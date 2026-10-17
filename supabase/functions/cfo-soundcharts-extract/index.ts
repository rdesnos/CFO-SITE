import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";

const INVOKE_HASH = "04c06a2c7fa9936b163d9295b91cadd518332191c720b17613982620e3edf497";
const BASE = "https://customer.api.soundcharts.com";
const TRACK_DATASET = "track_streams";
const PLATFORM_HISTORY_DATASET = "platform_history";

type Json = Record<string, unknown>;
type TrackContext = {
  id: string;
  title: string;
  display_label?: string | null;
  soundcharts_uuid: string;
  release_date?: string | null;
  last_verified_date?: string | null;
  metadata?: Json;
};

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isoDate(daysAgo = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function shiftDate(value: string, days: number) {
  const d = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function countRecords(payload: unknown): number {
  if (Array.isArray(payload)) return payload.length;
  if (!payload || typeof payload !== "object") return 0;
  const p = payload as Json;
  for (const key of ["items", "data", "results", "objects"]) {
    const v = p[key];
    if (Array.isArray(v)) return v.length;
    if (v && typeof v === "object") {
      for (const nested of ["items", "data", "results"]) {
        const n = (v as Json)[nested];
        if (Array.isArray(n)) return n.length;
      }
    }
  }
  return Object.keys(p).length ? 1 : 0;
}

async function soundchartsFetch(url: URL, appId: string, apiKey: string, db: ReturnType<typeof createClient>) {
  const { data: reservation, error: budgetError } = await db.rpc("cfo_reserve_soundcharts_call", { p_endpoint: url.pathname });
  if (budgetError || !reservation) throw new Error("Soundcharts budget unavailable or exhausted");
  const requestedAt = new Date().toISOString();
  let status = 0;
  let payload: unknown = {};
  let responseHeaders: Record<string, string> = {};
  try {
    const res = await fetch(url, {
      headers: { "x-app-id": appId, "x-api-key": apiKey, accept: "application/json" },
    });
    status = res.status;
    responseHeaders = {
      "content-type": res.headers.get("content-type") ?? "",
      "x-ratelimit-limit": res.headers.get("x-ratelimit-limit") ?? "",
      "x-ratelimit-remaining": res.headers.get("x-ratelimit-remaining") ?? "",
    };
    const responseText = await res.text();
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { raw_text: responseText.slice(0, 100000) };
    }
  } catch (error) {
    payload = { error: error instanceof Error ? error.message : String(error) };
  }
  const { error: traceError } = await db.rpc("cfo_complete_soundcharts_call", {
    p_call_id: reservation, p_request_parameters: Object.fromEntries(url.searchParams),
    p_http_status: status, p_response_hash: await sha256(JSON.stringify(payload)),
    p_summary: { source_crawl_date: ((payload as Json)?.related as Json | undefined)?.lastCrawlDate ?? null },
  });
  responseHeaders["x-cfo-call-id"] = String(reservation);
  return { requestedAt, status, payload, responseHeaders, traceError };
}

function audienceIssues(payload: unknown, endpoint: string) {
  const p = payload as Json;
  if (!p || !Array.isArray(p.items)) return ["unexpected_response_format"];
  const issues: string[] = [];
  if (Array.isArray(p.errors) && p.errors.length) issues.push("provider_errors");
  const items = p.items as Json[];
  if (!items.length) issues.push("no_data");
  const field = endpoint.startsWith("streaming_") ? "value" : "followerCount";
  const valid = items.filter(i => i && typeof i.date === "string" && /^\d{4}-\d{2}-\d{2}T/.test(i.date as string)
    && i[field] != null && i[field] !== "" && Number.isFinite(Number(i[field])) && Number(i[field]) >= 0);
  if (valid.length !== items.length) issues.push("invalid_items");
  const page = p.page as Json | undefined;
  if (page?.next || (page?.total != null && Number(page.total) > items.length)) issues.push("pagination_incomplete");
  const latest = valid.map(i => String(i.date).slice(0,10)).sort().at(-1);
  if (latest && latest < isoDate(3)) issues.push("source_delayed");
  return issues;
}

function chooseCanonicalIdentifier(items: Json[]) {
  const dated = items
    .filter((item) => typeof item.date === "string" && Array.isArray(item.plots))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const latest = dated[0];
  if (!latest) return null;
  const plots = (latest.plots as Json[])
    .filter((plot) => typeof plot.identifier === "string" && Number.isFinite(Number(plot.value)))
    .sort((a, b) => Number(b.value) - Number(a.value) || String(a.identifier).localeCompare(String(b.identifier)));
  return plots[0] ? String(plots[0].identifier) : null;
}

function normalizeTrackItems(items: Json[], identifier: string) {
  const byDate = new Map<string, Json>();
  for (const item of items) {
    const date = typeof item.date === "string" ? item.date.slice(0, 10) : "";
    if (!validDate(date) || !Array.isArray(item.plots)) continue;
    const plots = item.plots as Json[];
    const selected = plots.find((plot) => String(plot.identifier ?? "") === identifier);
    const value = selected && selected.value != null ? Number(selected.value) : Number.NaN;
    if (!Number.isFinite(value) || value < 0) continue;
    byDate.set(date, {
      date,
      value,
      identifier,
      identifiers_seen: plots.filter((plot) => typeof plot.identifier === "string").length,
    });
  }
  return Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
}


async function extractAirplay(
  db: ReturnType<typeof createClient>,
  artistSlug: string,
  artistUuid: string,
  appId: string,
  apiKey: string,
  body: Json,
) {
  const backfill = body.airplay_backfill === true;
  const { data: artist, error: artistError } = await db
    .schema("acquisition")
    .from("artists")
    .select("id")
    .eq("slug", artistSlug)
    .single();
  if (artistError || !artist?.id) throw new Error(artistError?.message ?? "Unknown artist");

  let state: Json | null = null;
  let startDate = validDate(body.airplay_start_date) ? body.airplay_start_date : isoDate(7);
  let endDate = validDate(body.airplay_end_date) ? body.airplay_end_date : isoDate();
  let countryCode: string | null = typeof body.airplay_country_code === "string"
    ? body.airplay_country_code.toUpperCase().slice(0, 2)
    : "FR";

  if (backfill) {
    const { data, error } = await db
      .schema("acquisition")
      .from("airplay_backfill_state")
      .select("*")
      .eq("artist_id", artist.id)
      .single();
    if (error || !data) throw new Error(error?.message ?? "Airplay backfill state not found");
    state = data as Json;
    if (String(state.status) === "completed") {
      return { status: "completed", calls: 0, records_received: 0, records_stored: 0 };
    }
    startDate = String(state.next_start_date);
    const windowDays = Math.max(1, Math.min(90, Number(state.window_days) || 7));
    const candidateEnd = shiftDate(startDate, windowDays - 1);
    endDate = candidateEnd < String(state.end_date) ? candidateEnd : String(state.end_date);
    countryCode = typeof state.country_code === "string" && state.country_code
      ? String(state.country_code)
      : null;
  }

  if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) {
    throw new Error("Invalid airplay date range");
  }

  const { data: runId, error: startError } = await db.rpc("cfo_start_extraction", {
    p_artist_slug: artistSlug,
    p_dataset_code: "airplay",
    p_parameters: {
      requested_at: new Date().toISOString(),
      backfill,
      start_date: startDate,
      end_date: endDate,
      country_code: countryCode,
    },
  });
  if (startError || !runId) throw new Error(startError?.message ?? "Unable to start airplay extraction");

  const endpointName = `radio_broadcasts_${countryCode ? countryCode.toLowerCase() : "global"}`;
  const endpointUrl = `${BASE}/api/v2/artist/${artistUuid}/broadcasts`;
  let offset = 0;
  let calls = 0;
  let received = 0;
  let failed: Json | null = null;

  while (true) {
    const url = new URL(endpointUrl);
    if (countryCode) url.searchParams.set("countryCode", countryCode);
    url.searchParams.set("startDate", startDate);
    url.searchParams.set("endDate", endDate);
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("limit", "100");

    const response = await soundchartsFetch(url, appId, apiKey, db);
    calls++;
    const payload = response.payload && typeof response.payload === "object"
      ? response.payload as Json
      : {};
    const page = payload.page && typeof payload.page === "object" ? payload.page as Json : {};
    const items = Array.isArray(payload.items) ? payload.items as Json[] : [];
    const total = Number(page.total);
    const nextUrl = typeof page.next === "string" ? page.next : null;
    received += items.length;

    const { error: recordError } = await db.rpc("cfo_record_soundcharts_response", {
      p_run_id: runId,
      p_artist_slug: artistSlug,
      p_dataset_code: "airplay",
      p_endpoint_name: endpointName,
      p_endpoint_url: url.toString(),
      p_http_status: response.status,
      p_request_parameters: {
        startDate,
        endDate,
        offset,
        limit: 100,
        ...(countryCode ? { countryCode } : {}),
      },
      p_response_headers: response.responseHeaders,
      p_response_payload: payload,
      p_response_hash: await sha256(JSON.stringify(payload)),
      p_page_offset: offset,
      p_page_limit: 100,
      p_page_total: Number.isFinite(total) ? total : null,
      p_next_url: nextUrl,
    });
    if (recordError) {
      failed = { error: recordError.message, offset };
      break;
    }

    if (response.status < 200 || response.status >= 300) {
      failed = {
        http_status: response.status,
        error: payload.errors ?? payload.error ?? "Soundcharts request failed",
        offset,
      };
      break;
    }
    if (!items.length || items.length < 100 || (Number.isFinite(total) && offset + items.length >= total)) break;
    offset += 100;
    if (offset > 100000) {
      failed = { error: "Soundcharts airplay pagination safety limit reached", offset };
      break;
    }
  }

  let normalized: Json = {};
  if (!failed) {
    const { data, error } = await db.rpc("cfo_normalize_airplay_soundcharts", {
      p_artist_slug: artistSlug,
      p_run_id: runId,
    });
    if (error) failed = { error: error.message, stage: "normalization" };
    else normalized = (data ?? {}) as Json;
  }

  const stored = Number(normalized.inserted ?? 0) + Number(normalized.updated ?? 0);
  const ok = !failed;
  await db.rpc("cfo_finish_extraction", {
    p_run_id: runId,
    p_status: ok ? "success" : "failed",
    p_records: received,
    p_error_code: ok ? null : "SOUNDCHARTS_AIRPLAY_ERROR",
    p_error_message: ok ? null : JSON.stringify(failed),
    p_metadata: {
      api_calls: calls,
      backfill,
      start_date: startDate,
      end_date: endDate,
      country_code: countryCode,
      normalized,
    },
  });

  if (backfill && state) {
    const nextStart = shiftDate(endDate, 1);
    const completed = nextStart > String(state.end_date);
    await db
      .schema("acquisition")
      .from("airplay_backfill_state")
      .update({
        next_start_date: completed ? String(state.end_date) : nextStart,
        status: ok ? (completed ? "completed" : "running") : "failed",
        windows_completed: Number(state.windows_completed ?? 0) + (ok ? 1 : 0),
        api_calls: Number(state.api_calls ?? 0) + calls,
        records_received: Number(state.records_received ?? 0) + received,
        records_stored: Number(state.records_stored ?? 0) + stored,
        last_window_start: startDate,
        last_window_end: endDate,
        last_error: ok ? null : JSON.stringify(failed),
        last_run_at: new Date().toISOString(),
        completed_at: ok && completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("artist_id", artist.id);
  }

  return {
    status: ok ? "success" : "failed",
    backfill,
    start_date: startDate,
    end_date: endDate,
    country_code: countryCode,
    calls,
    pages: calls,
    records_received: received,
    records_stored: stored,
    normalized,
    error: failed,
  };
}

async function extractTrackStreams(
  db: ReturnType<typeof createClient>,
  artistSlug: string,
  appId: string,
  apiKey: string,
  body: Json,
) {
  const { data: extractionContext, error: contextError } = await db.rpc("cfo_track_extract_context", {
    p_artist_slug: artistSlug,
  });
  if (contextError) throw new Error(contextError.message);
  let tracks = (Array.isArray(extractionContext?.tracks) ? extractionContext.tracks : []) as TrackContext[];
  tracks.sort((a: TrackContext, b: TrackContext) => String(a.release_date ?? "9999").localeCompare(String(b.release_date ?? "9999")) || String(a.display_label).localeCompare(String(b.display_label)));
  const trackOffset = Number.isFinite(Number(body.track_offset)) && Number(body.track_offset) > 0
    ? Math.floor(Number(body.track_offset))
    : 0;
  if (trackOffset) tracks = tracks.slice(trackOffset);
  const maxTracks = Number(body.max_tracks);
  if (Number.isFinite(maxTracks) && maxTracks > 0) tracks = tracks.slice(0, Math.floor(maxTracks));
  const forcedStart = validDate(body.track_start_date) ? body.track_start_date : null;
  const endDate = validDate(body.track_end_date) ? body.track_end_date : isoDate();
  const result: Json[] = [];
  let calls = 0;

  for (const track of tracks) {
    const incrementalStart = track.last_verified_date ? shiftDate(track.last_verified_date, -14) : null;
    const startDate = forcedStart ?? (incrementalStart && incrementalStart > isoDate(35) ? incrementalStart : isoDate(35));
    const endpointUrl = `${BASE}/api/v2/song/${track.soundcharts_uuid}/audience/spotify`;
    const pages: Array<Json & { items: Json[] }> = [];
    const allItems: Json[] = [];
    let offset = 0;
    let failed: Json | null = null;

    while (true) {
      const url = new URL(endpointUrl);
      url.searchParams.set("startDate", startDate);
      url.searchParams.set("endDate", endDate);
      url.searchParams.set("offset", String(offset));
      url.searchParams.set("limit", "100");
      url.searchParams.set("sort", "asc");
      const response = await soundchartsFetch(url, appId, apiKey, db);
      calls++;
      const payload = response.payload && typeof response.payload === "object" ? response.payload as Json : {};
      const page = payload.page && typeof payload.page === "object" ? payload.page as Json : {};
      const items = Array.isArray(payload.items) ? payload.items as Json[] : [];
      pages.push({
        url: url.toString(),
        status: response.status,
        request_parameters: { startDate, endDate, offset, limit: 100, sort: "asc" },
        response_headers: response.responseHeaders,
        payload,
        response_hash: await sha256(JSON.stringify(payload)),
        offset,
        requested_at: response.requestedAt,
        items,
      });

      if (response.status < 200 || response.status >= 300) {
        failed = { http_status: response.status, error: payload.errors ?? payload.error ?? "Soundcharts request failed" };
        break;
      }

      allItems.push(...items);
      const total = Number(page.total);
      if (!items.length || items.length < 100 || (Number.isFinite(total) && offset + items.length >= total)) break;
      offset += 100;
      if (offset > 5000) {
        failed = { error: "Soundcharts pagination safety limit reached" };
        break;
      }
    }

    let inserted = 0;
    const preferred = track.metadata?.cfo_soundcharts && (track.metadata.cfo_soundcharts as Json).spotify_identifier;
    const identifier = failed ? null : (typeof preferred === "string" && allItems.some(item => Array.isArray(item.plots) && (item.plots as Json[]).some(p => p.identifier === preferred)) ? preferred : chooseCanonicalIdentifier(allItems));
    if (!failed && !identifier) failed = { error: "No canonical Spotify identifier in Soundcharts response" };

    if (!failed && identifier) {
      const persistedPages = pages.map((page) => ({
        url: page.url,
        status: page.status,
        request_parameters: page.request_parameters,
        response_headers: page.response_headers,
        payload: page.payload,
        response_hash: page.response_hash,
        offset: page.offset,
        requested_at: page.requested_at,
        observations: normalizeTrackItems(page.items, identifier),
      }));
      const { data: stored, error: storeError } = await db.rpc("cfo_track_store_soundcharts", {
        p_track_id: track.id,
        p_endpoint_url: endpointUrl,
        p_start_date: startDate,
        p_end_date: endDate,
        p_identifier: identifier,
        p_pages: persistedPages,
      });
      if (storeError) failed = { error: storeError.message };
      else inserted = Number(stored?.records_inserted ?? 0);
    }

    result.push({
      title: track.display_label ?? track.title,
      status: failed ? (inserted ? "partial" : "failed") : "success",
      start_date: startDate,
      end_date: endDate,
      pages: pages.length,
      records_received: allItems.length,
      records_stored: inserted,
      spotify_identifier: identifier,
      error: failed,
    });
  }

  return { status: result.some((item) => item.status === "failed") ? "partial" : "success", calls, tracks: result };
}


async function extractPlatformHistory(
  db: ReturnType<typeof createClient>,
  artistSlug: string,
  artistUuid: string,
  appId: string,
  apiKey: string,
  body: Json,
) {
  const startDate = validDate(body.history_start_date) ? body.history_start_date : "2022-05-27";
  const endDate = validDate(body.history_end_date) ? body.history_end_date : isoDate();
  const windowDays = Math.max(1, Math.min(90, Number(body.history_window_days) || 90));
  const allowedPlatforms = new Set(["spotify", "youtube", "deezer", "instagram"]);
  const requestedPlatforms = Array.isArray(body.history_platforms)
    ? body.history_platforms.map(String).filter((p) => allowedPlatforms.has(p))
    : ["spotify", "youtube", "deezer"];
  const allowedTypes = new Set(["streaming", "audience"]);
  const requestedTypes = Array.isArray(body.history_types)
    ? body.history_types.map(String).filter((t) => allowedTypes.has(t))
    : ["streaming", "audience"];

  if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) {
    throw new Error("Invalid platform history date range");
  }
  if (!requestedPlatforms.length || !requestedTypes.length) {
    throw new Error("No valid platform history route requested");
  }

  const summary: Record<string, unknown> = {};
  let totalCalls = 0;
  let totalRecords = 0;

  for (const type of requestedTypes) {
    const datasetCode = type === "streaming" ? "streaming_audience" : "social_audience";
    const { data: runId, error: startError } = await db.rpc("cfo_start_extraction", {
      p_artist_slug: artistSlug,
      p_dataset_code: datasetCode,
      p_parameters: {
        requested_at: new Date().toISOString(),
        mode: PLATFORM_HISTORY_DATASET,
        type,
        platforms: requestedPlatforms,
        start_date: startDate,
        end_date: endDate,
        window_days: windowDays,
      },
    });
    if (startError || !runId) {
      throw new Error(startError?.message ?? `Unable to start ${type} history extraction`);
    }

    let cursor = startDate;
    let records = 0;
    let calls = 0;
    const errors: Json[] = [];

    while (cursor <= endDate) {
      const candidateEnd = shiftDate(cursor, windowDays - 1);
      const windowEnd = candidateEnd < endDate ? candidateEnd : endDate;

      for (const platform of requestedPlatforms) {
        const endpointName = type === "streaming"
          ? `streaming_${platform}`
          : `audience_${platform}`;
        const path = type === "streaming"
          ? `/api/v2/artist/${artistUuid}/streaming/${platform}/listening`
          : `/api/v2/artist/${artistUuid}/audience/${platform}`;
        let offset = 0;

        while (true) {
          const url = new URL(BASE + path);
          url.searchParams.set("startDate", cursor);
          url.searchParams.set("endDate", windowEnd);
          url.searchParams.set("offset", String(offset));
          url.searchParams.set("limit", "100");
          url.searchParams.set("sort", "asc");

          const response = await soundchartsFetch(url, appId, apiKey, db);
          calls++;
          totalCalls++;
          const payload = response.payload && typeof response.payload === "object"
            ? response.payload as Json
            : {};
          const page = payload.page && typeof payload.page === "object" ? payload.page as Json : {};
          const items = Array.isArray(payload.items) ? payload.items as Json[] : [];
          const nextUrl = typeof page.next === "string" ? page.next : null;
          const pageTotal = Number.isFinite(Number(page.total)) ? Number(page.total) : null;
          records += items.length;
          totalRecords += items.length;

          const { error: recordError } = await db.rpc("cfo_record_soundcharts_response", {
            p_run_id: runId,
            p_artist_slug: artistSlug,
            p_dataset_code: datasetCode,
            p_endpoint_name: endpointName,
            p_endpoint_url: url.toString(),
            p_http_status: response.status,
            p_request_parameters: {
              startDate: cursor,
              endDate: windowEnd,
              offset,
              limit: 100,
              sort: "asc",
              mode: PLATFORM_HISTORY_DATASET,
            },
            p_response_headers: response.responseHeaders,
            p_response_payload: payload,
            p_response_hash: await sha256(JSON.stringify(payload)),
            p_page_offset: offset,
            p_page_limit: 100,
            p_page_total: pageTotal,
            p_next_url: nextUrl,
          });

          if (recordError) {
            errors.push({
              type,
              platform,
              start_date: cursor,
              end_date: windowEnd,
              offset,
              error: recordError.message,
            });
            break;
          }
          if (response.status < 200 || response.status >= 300) {
            errors.push({
              type,
              platform,
              start_date: cursor,
              end_date: windowEnd,
              offset,
              http_status: response.status,
              response_errors: Array.isArray(payload.errors) ? payload.errors : null,
            });
            break;
          }

          if (!nextUrl || items.length < 100) break;
          offset += 100;
        }
      }

      cursor = shiftDate(windowEnd, 1);
    }

    const ok = errors.length === 0;
    await db.rpc("cfo_finish_extraction", {
      p_run_id: runId,
      p_status: ok ? "success" : "partial",
      p_records: records,
      p_error_code: ok ? null : "SOUNDCHARTS_HISTORY_ERRORS",
      p_error_message: ok ? null : JSON.stringify(errors),
      p_metadata: {
        mode: PLATFORM_HISTORY_DATASET,
        api_calls: calls,
        platforms: requestedPlatforms,
        start_date: startDate,
        end_date: endDate,
        window_days: windowDays,
        errors,
      },
    });

    summary[type] = {
      status: ok ? "success" : "partial",
      run_id: runId,
      calls,
      records,
      errors,
    };
  }

  const { data: normalized, error: normalizeError } = await db.rpc("cfo_normalize_soundcharts", {
    p_artist_slug: artistSlug,
  });
  if (normalizeError) throw new Error(normalizeError.message);

  return {
    status: Object.values(summary).some((item) => (item as Json).status !== "success") ? "partial" : "success",
    start_date: startDate,
    end_date: endDate,
    window_days: windowDays,
    platforms: requestedPlatforms,
    calls: totalCalls,
    records: totalRecords,
    normalized,
    datasets: summary,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });
  const supplied = req.headers.get("x-cfo-extractor-key") ?? "";
  if (!supplied || await sha256(supplied) !== INVOKE_HASH) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const body = await req.json().catch(() => ({})) as Json;
  const artistSlug = typeof body.artist_slug === "string" ? body.artist_slug : "marine";
  if (body.airplay_backfill === true || (Array.isArray(body.datasets) && body.datasets.includes(PLATFORM_HISTORY_DATASET)) || body.track_start_date || body.track_end_date || body.airplay_start_date || body.airplay_end_date) {
    return Response.json({ error: "Historical collection is disabled on the daily collector" }, { status: 400 });
  }
  const requested = Array.isArray(body.datasets) ? body.datasets : [
    "streaming_audience", "social_audience", "airplay", "charts", TRACK_DATASET,
  ];
  if (body.endpoints !== undefined && (!Array.isArray(body.endpoints) || !body.endpoints.length ||
      body.endpoints.some(e => typeof e !== "string" || !/^(streaming_(spotify|deezer|youtube)|audience_(instagram|tiktok|youtube|facebook|spotify|deezer))$/.test(e)) ||
      requested.some(d => !["streaming_audience", "social_audience"].includes(String(d))))) {
    return Response.json({ error: "Endpoint filtering requires supported audience endpoints and datasets" }, { status: 400 });
  }

  const { data: context, error: contextError } = await db.rpc("cfo_soundcharts_context", { p_artist_slug: artistSlug });
  if (contextError || !context?.soundcharts_uuid || !context?.app_id || !context?.api_key) {
    return Response.json({ error: contextError?.message ?? "Incomplete extraction context" }, { status: 400 });
  }

  const uuid = context.soundcharts_uuid as string;
  const start30 = isoDate(30);
  const start7 = isoDate(7);
  const end = isoDate();
  const routes: Record<string, Array<{ name: string; path: string; params?: Record<string, string | number> }>> = {
    artist_profile: [
      { name: "artist_metadata", path: `/api/v2/artist/${uuid}` },
      { name: "artist_identifiers", path: `/api/v2/artist/${uuid}/identifiers`, params: { limit: 100, offset: 0 } },
    ],
    catalog: [
      { name: "artist_songs", path: `/api/v2.21/artist/${uuid}/songs`, params: { limit: 100, offset: 0, sortBy: "releaseDate", sortOrder: "desc" } },
      { name: "artist_albums", path: `/api/v2.34/artist/${uuid}/albums`, params: { limit: 100, offset: 0, type: "all", sortBy: "releaseDate", sortOrder: "desc" } },
    ],
    streaming_audience: ["spotify", "deezer", "youtube"].map((platform) => ({
      name: `streaming_${platform}`, path: `/api/v2/artist/${uuid}/streaming/${platform}/listening`,
      params: { startDate: start30, endDate: end, limit: 100, offset: 0, sort: "asc" },
    })),
    social_audience: ["instagram", "tiktok", "youtube", "facebook", "spotify", "deezer"].map((platform) => ({
      name: `audience_${platform}`, path: `/api/v2/artist/${uuid}/audience/${platform}`,
      params: { startDate: start30, endDate: end, limit: 100, offset: 0, sort: "asc" },
    })),
    airplay: [
      { name: "radio_broadcasts_fr", path: `/api/v2/artist/${uuid}/broadcasts`, params: { countryCode: "FR", startDate: start7, endDate: end, limit: 100, offset: 0 } },
      { name: "radio_broadcast_groups_fr", path: `/api/v2/artist/${uuid}/broadcast-groups`, params: { countryCode: "FR", startDate: start7, endDate: end, limit: 100, offset: 0 } },
    ],
    charts: [
      ...["spotify", "deezer", "itunes", "shazam", "youtube"].map((platform) => ({
        name: `song_charts_${platform}`, path: `/api/v2/artist/${uuid}/charts/song/ranks/${platform}`,
        params: { currentOnly: 0, limit: 100, offset: 0, sortBy: "rankDate", sortOrder: "desc" },
      })),
      ...["spotify", "itunes", "deezer"].map((platform) => ({
        name: `album_charts_${platform}`, path: `/api/v2.28/artist/${uuid}/charts/album/ranks/${platform}`,
        params: { currentOnly: 0, limit: 100, offset: 0, sortBy: "rankDate", sortOrder: "desc" },
      })),
    ],
    events: [
      { name: "artist_events", path: `/api/v2/artist/${uuid}/events`, params: { type: "all", startDate: "2024-01-01", endDate: isoDate(-365), limit: 100, offset: 0, sortBy: "date", sortOrder: "asc" } },
    ],
  };

  const summary: Record<string, unknown> = {};
  let totalCalls = 0;
  for (const dataset of requested) {
    if (dataset === "airplay") {
      try {
        const airplaySummary = await extractAirplay(db, artistSlug, uuid, context.app_id, context.api_key, body);
        totalCalls += Number(airplaySummary.calls) || 0;
        summary[dataset] = airplaySummary;
      } catch (error) {
        summary[dataset] = { status: "failed", error: error instanceof Error ? error.message : String(error) };
      }
      continue;
    }

    if (dataset === PLATFORM_HISTORY_DATASET) {
      try {
        const historySummary = await extractPlatformHistory(
          db, artistSlug, uuid, context.app_id, context.api_key, body,
        );
        totalCalls += Number(historySummary.calls) || 0;
        summary[dataset] = historySummary;
      } catch (error) {
        summary[dataset] = { status: "failed", error: error instanceof Error ? error.message : String(error) };
      }
      continue;
    }

    if (dataset === TRACK_DATASET) {
      try {
        const trackSummary = await extractTrackStreams(db, artistSlug, context.app_id, context.api_key, body);
        totalCalls += Number(trackSummary.calls) || 0;
        summary[dataset] = trackSummary;
      } catch (error) {
        summary[dataset] = { status: "failed", error: error instanceof Error ? error.message : String(error) };
      }
      continue;
    }

    const datasetRoutes = (routes[String(dataset)] ?? []).filter(route =>
      !Array.isArray(body.endpoints) || body.endpoints.includes(route.name));
    if (!datasetRoutes.length) continue;
    const { data: runId, error: startError } = await db.rpc("cfo_start_extraction", {
      p_artist_slug: artistSlug,
      p_dataset_code: dataset,
      p_parameters: { requested_at: new Date().toISOString(), routes: datasetRoutes.map(r => r.name) },
    });
    if (startError) {
      summary[String(dataset)] = { status: "failed", error: startError.message };
      continue;
    }

    let records = 0;
    let datasetCalls = 0;
    const errors: Array<{ endpoint: string; status: number; reason?: string }> = [];
    for (const route of datasetRoutes) {
      try {
      const url = new URL(BASE + route.path);
      Object.entries(route.params ?? {}).forEach(([key, value]) => url.searchParams.set(key, String(value)));
      const response = await soundchartsFetch(url, context.app_id, context.api_key, db);
      totalCalls++;
      datasetCalls++;
      records += countRecords(response.payload);
      if (response.status < 200 || response.status >= 300) errors.push({ endpoint: route.name, status: response.status });
      const { error: persistError } = await db.rpc("cfo_record_soundcharts_response", {
        p_run_id: runId,
        p_artist_slug: artistSlug,
        p_dataset_code: dataset,
        p_endpoint_name: route.name,
        p_endpoint_url: url.toString(),
        p_http_status: response.status,
        p_request_parameters: route.params ?? {},
        p_response_headers: response.responseHeaders,
        p_response_payload: response.payload,
        p_response_hash: await sha256(JSON.stringify(response.payload)),
        p_page_offset: Number(route.params?.offset ?? 0),
        p_page_limit: Number(route.params?.limit ?? 0) || null,
        p_page_total: null,
        p_next_url: null,
      });
      if (persistError) errors.push({ endpoint: route.name, status: 500 });
      if (response.traceError) errors.push({ endpoint: route.name, status: 500, reason: "call_trace_failed" });
      if (String(dataset).endsWith("_audience") && response.status === 200) {
        for (const reason of audienceIssues(response.payload, route.name)) errors.push({ endpoint: route.name, status: 200, reason });
      }
      } catch {
        errors.push({ endpoint: route.name, status: 0, reason: "request_or_budget_failure" });
      }
    }
    const ok = errors.length === 0;
    await db.rpc("cfo_finish_extraction", {
      p_run_id: runId,
      p_status: ok ? "success" : (errors.length < datasetRoutes.length ? "partial" : "failed"),
      p_records: records,
      p_error_code: ok ? null : "SOUNDCHARTS_ENDPOINT_ERRORS",
      p_error_message: ok ? null : JSON.stringify(errors),
      p_metadata: { api_calls: datasetCalls, errors },
    });
    summary[String(dataset)] = { status: ok ? "success" : "partial", calls: datasetCalls, records, errors };
  }

  return Response.json({ artist_slug: artistSlug, soundcharts_uuid: uuid, total_calls: totalCalls, datasets: summary });
});
