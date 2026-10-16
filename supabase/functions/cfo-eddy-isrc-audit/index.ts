import { budgetedFetch, authorizeLegacy } from "../_shared/soundcharts-budget.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";

const BASE = "https://customer.api.soundcharts.com";

function walk(v:any, out:Set<string>) {
  if (v == null) return;
  if (Array.isArray(v)) { for (const x of v) walk(x,out); return; }
  if (typeof v !== "object") return;
  for (const [k,val] of Object.entries(v)) {
    if (/isrc/i.test(k) && typeof val === "string") {
      const s = val.replace(/[^A-Za-z0-9]/g,"").toUpperCase();
      if (/^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/.test(s)) out.add(s);
    }
    walk(val,out);
  }
}

Deno.serve(async (req) => {
 if(!await authorizeLegacy(req))return Response.json({error:"Unauthorized"},{status:401});
  const u = new URL(req.url);
  
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {auth:{persistSession:false}});
  const {data:cred,error:ce} = await db.rpc("cfo_soundcharts_credentials");
  if (ce || !cred?.app_id || !cred?.api_key) return Response.json({error:ce?.message ?? "credentials missing"},{status:500});
  const {data:artist,error:ae} = await db.schema("acquisition").from("artists").select("id").eq("slug","eddy-de-pretto").single();
  if (ae || !artist) return Response.json({error:ae?.message ?? "artist missing"},{status:500});
  const {data:tracks,error:te} = await db.schema("acquisition").from("tracks")
    .select("id,title,soundcharts_uuid,isrc")
    .eq("primary_artist_id",artist.id)
    .order("release_date",{ascending:true,nullsFirst:false})
    .order("title")
    .range(Math.max(0, Number(u.searchParams.get("offset") ?? "0")), Math.max(0, Number(u.searchParams.get("offset") ?? "0")) + Math.min(9, Math.max(0, Number(u.searchParams.get("limit") ?? "8"))) );
  if (te) return Response.json({error:te.message},{status:500});

  const rows:any[] = [];
  for (const t of tracks ?? []) {
    if (!t.soundcharts_uuid) { rows.push({id:t.id,title:t.title,action:"no_uuid"}); continue; }
    const url = BASE + "/api/v2/song/" + t.soundcharts_uuid + "/identifiers?limit=100&offset=0";
    const res = await budgetedFetch(url,{headers:{"x-app-id":cred.app_id,"x-api-key":cred.api_key,accept:"application/json"}});
    const payload = await res.json().catch(()=>({}));
    const isrcs = [...new Set((payload?.items ?? []).filter((x:any)=>x?.platformCode === "isrc").map((x:any)=>String(x.identifier).replace(/[^A-Za-z0-9]/g,"").toUpperCase()).filter((x:string)=>/^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/.test(x)))];

    await db.schema("acquisition").from("track_identifier_snapshots").insert({
      track_id:t.id,
      soundcharts_uuid:t.soundcharts_uuid,
      http_status:res.status,
      payload:{endpoint:url,raw:payload,extracted_isrcs:isrcs},
      error_message:res.ok?null:"HTTP "+res.status
    });

    let action = "review";
    if (res.ok && isrcs.length === 1 && !t.isrc) {
      const {data:conf} = await db.schema("acquisition").from("tracks").select("id,title").eq("isrc",isrcs[0]).maybeSingle();
      if (!conf) {
        const {error:ue} = await db.schema("acquisition").from("tracks").update({isrc:isrcs[0],updated_at:new Date().toISOString()}).eq("id",t.id);
        action = ue ? "update_error" : "updated";
      } else {
        action = "duplicate_isrc";
      }
    } else if (res.ok && isrcs.length === 0) action = "no_isrc";
    else if (res.ok && isrcs.length > 1) action = "multiple_isrcs";
    else if (!res.ok) action = "http_error";
    rows.push({id:t.id,title:t.title,isrcs,action,status:res.status});
  }

  const summary:any = {};
  for (const r of rows) summary[r.action]=(summary[r.action]??0)+1;
  return Response.json({count:rows.length,summary,rows});
});
