import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function boundedNumber(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return value === null || !Number.isFinite(parsed) ? fallback : Math.min(max, Math.max(min, Math.floor(parsed)));
}

function cors(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Cache-Control": status >= 400 ? "no-store" : "public, max-age=120, s-maxage=120"
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  if (req.method !== "GET") return cors({ ok: false, error: "GET only" }, 405);

  const u = new URL(req.url);
  const artistSlug = u.searchParams.get("artist") || "philypa-phoenix";
  const newsLimit = boundedNumber(u.searchParams.get("news_limit"), 6, 1, 12);
  const agendaDays = boundedNumber(u.searchParams.get("agenda_days"), 180, 30, 365);
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const to = new Date(today.getTime() + agendaDays * 86400000).toISOString().slice(0, 10);
  const since30 = new Date(today.getTime() - 30 * 86400000).toISOString();

  const [
    { data: profile, error: profileError },
    { data: sources },
    { data: news, error: newsError },
    { data: agenda, error: agendaError },
    { data: metricRows },
    { data: actingCredits, error: actingError },
    { data: works, error: worksError }
  ] = await Promise.all([
    sb.from("cfo_artist_site_profiles").select("*").eq("artist_slug", artistSlug).eq("active", true).maybeSingle(),
    sb.from("cfo_artist_news_sources").select("source_name,source_url,source_type,reliability_score").eq("artist_slug", artistSlug).eq("active", true).order("reliability_score", { ascending: false }),
    sb.from("cfo_news_items")
      .select("id,source_title,canonical_url,source_name,source_domain,published_at,detected_at,category,cfo_summary,source_excerpt,image_url,thumbnail_url,relevance_score,reliability_score,priority_score,is_official_source,source_tier")
      .eq("artist_slug", artistSlug)
      .eq("status", "published")
      .order("priority_score", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(newsLimit),
    sb.from("cfo_events")
      .select("id,event_date,event_end_date,start_time,end_time,all_day,event_type,title,description,location,venue,city,address,timezone,official_url,source_url,source_name,verified,event_status,publication_status,visual_url")
      .eq("artist_slug", artistSlug)
      .eq("publication_status", "published")
      .eq("verified", true)
      .gte("event_date", todayIso)
      .lte("event_date", to)
      .neq("event_status", "cancelled")
      .order("event_date", { ascending: true })
      .limit(20),
    sb.from("cfo_artist_metric_snapshots")
      .select("metric_key,metric_label,metric_value,metric_text,metric_unit,observed_at,source_name,source_url")
      .eq("artist_slug", artistSlug)
      .order("observed_at", { ascending: false })
      .limit(50),
    sb.from("cfo_artist_acting_credits")
      .select("credit_year,title,role_name,work_type,broadcaster,platform,release_date,episode_count,source_name,source_url")
      .eq("artist_slug", artistSlug)
      .eq("verified", true)
      .gte("credit_year", 2024)
      .lte("credit_year", 2026)
      .order("credit_year", { ascending: false })
      .order("release_date", { ascending: false, nullsFirst: false }),
    sb.from("cfo_artist_works").select("title,work_year,work_type,publisher,role_name,local_url,source_name,source_url,updated_at").eq("artist_slug",artistSlug).eq("verified",true).order("work_year",{ascending:false}).order("title").limit(200)
  ]);

  if (profileError) return cors({ ok:false, error:profileError.message }, 500);
  if (!profile) return cors({ ok:false, error:"artist not found" }, 404);
  if (newsError) return cors({ ok:false, error:newsError.message }, 500);
  if (agendaError) return cors({ ok:false, error:agendaError.message }, 500);
  if (actingError) return cors({ ok:false, error:actingError.message }, 500);
  if (worksError) return cors({ok:false,error:worksError.message},500);

  const { count: news30 } = await sb.from("cfo_news_items")
    .select("id", { count: "exact", head: true })
    .eq("artist_slug", artistSlug)
    .eq("status", "published")
    .gte("detected_at", since30);

  const latestMetric = new Map<string, any>();
  for (const row of metricRows || []) {
    if (!latestMetric.has(row.metric_key)) latestMetric.set(row.metric_key, row);
  }

  const credits = actingCredits || [];
  const byYear: Record<string, number> = {};
  const broadcasterSet = new Set<string>();
  const platformSet = new Set<string>();
  for (const c of credits) {
    byYear[String(c.credit_year)] = (byYear[String(c.credit_year)] || 0) + 1;
    if (c.broadcaster) broadcasterSet.add(c.broadcaster);
    if (c.platform) platformSet.add(c.platform);
  }

  const acting = {
    period: "2024-2026",
    credits_count: credits.length,
    years_active: Object.keys(byYear).length,
    broadcasters_count: broadcasterSet.size,
    platforms_count: platformSet.size,
    broadcasters: Array.from(broadcasterSet).sort(),
    platforms: Array.from(platformSet).sort(),
    by_year: byYear,
    credits
  };

  const metrics = [
    { key:"news_30d", label:"Contenus repérés", value:news30 || 0, unit:"30 jours", source:"CFO" },
    { key:"sources", label:"Sources suivies", value:(sources || []).length, unit:"sources", source:"CFO" },
    { key:"agenda", label:"Rendez-vous à venir", value:(agenda || []).length, unit:agendaDays + " jours", source:"CFO" },
    ...Array.from(latestMetric.values()).map((m:any) => ({
      key:m.metric_key, label:m.metric_label, value:m.metric_value, text:m.metric_text,
      unit:m.metric_unit, observed_at:m.observed_at, source:m.source_name, source_url:m.source_url
    }))
  ];

  return cors({
    ok:true,
    generated_at:new Date().toISOString(),
    artist: profile,
    metrics,
    acting,
    works: works || [],
    news: news || [],
    agenda: agenda || [],
    sources: sources || []
  });
});