import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";
import { chooseIdentifier, normalize } from "./logic.mjs";
const INVOKE_HASH = "04c06a2c7fa9936b163d9295b91cadd518332191c720b17613982620e3edf497";
const BASE = "https://customer.api.soundcharts.com";
async function hash(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))))
    .map(x=>x.toString(16).padStart(2,"0")).join("");
}
export async function handler(req) {
  if (req.method !== "POST") return Response.json({error:"POST required"},{status:405});
  const supplied = req.headers.get("x-cfo-extractor-key") || "";
  if (!supplied || await hash(supplied) !== INVOKE_HASH) return Response.json({error:"Unauthorized"},{status:401});
  const db = createClient(Deno.env.get("SUPABASE_URL"),Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),{auth:{persistSession:false}});
  const {data:ctx,error:ce} = await db.rpc("cfo_soundcharts_context",{p_artist_slug:"marine"});
  const {data:scope,error:se} = await db.rpc("cfo_track_extract_context",{p_artist_slug:"marine"});
  if (ce || se || !ctx?.app_id || !ctx?.api_key || !Array.isArray(scope?.tracks)) return Response.json({error:"Incomplete extraction context"},{status:500});
  const end = new Date().toISOString().slice(0,10);
  const start = new Date(Date.now()-14*86400000).toISOString().slice(0,10);
  const {data:run,error:runError} = await db.schema("acquisition").from("soundcharts_daily_runs")
    .insert({dataset:"track_shazam"}).select("id").single();
  if (runError || !run) return Response.json({error:"Unable to start audited extraction"},{status:500});
  const results = [];
  let calls = 0;
  let budgetBlocked = false;
  for (const track of scope.tracks) {
    const endpoint = BASE+"/api/v2/song/"+track.soundcharts_uuid+"/audience/shazam";
    const pages = [];
    const all = [];
    let failure = null;
    // A fortnight requires at most one normal page. Second page is a strict safety bound.
    try {
      for (let offset=0;offset<200;offset+=100) {
        const u = new URL(endpoint);
        for (const [key,value] of Object.entries({startDate:start,endDate:end,offset:String(offset),limit:"100",sortBy:"date",sortOrder:"asc"})) u.searchParams.set(key,value);
        const {data:reserved,error:be} = await db.rpc("cfo_reserve_soundcharts_call",{p_endpoint:u.pathname});
        if (be || !reserved) {budgetBlocked=true;throw new Error("Soundcharts budget unavailable or exhausted");}
        calls++;
        const requested_at = new Date().toISOString();
        const response = await fetch(u,{headers:{"x-app-id":ctx.app_id,"x-api-key":ctx.api_key,accept:"application/json"}});
        const payload = await response.json();
        const items = Array.isArray(payload.items) ? payload.items : [];
        const page = {url:u.toString(),status:response.status,request_parameters:Object.fromEntries(u.searchParams),
          response_headers:{"x-ratelimit-limit":response.headers.get("x-ratelimit-limit"),"x-ratelimit-remaining":response.headers.get("x-ratelimit-remaining")},
          payload,response_hash:await hash(JSON.stringify(payload)),offset,requested_at,items};
        pages.push(page);
        if (!response.ok) throw new Error("Soundcharts HTTP "+response.status);
        all.push(...items);
        if (!payload.page?.next || items.length<100) break;
        if (offset===100) throw new Error("Shazam pagination safety bound exceeded");
      }
      // Preserve the identifier previously verified for this track whenever available.
      const {data:previous,error:pe} = await db.schema("acquisition").from("metric_observations")
        .select("platform_identifier").eq("track_id",track.id).eq("platform","shazam").eq("metric_type","shazam_count")
        .order("observation_date",{ascending:false}).limit(1);
      if (pe) throw new Error("Unable to read canonical identifier");
      const identifier = chooseIdentifier(all,previous?.[0]?.platform_identifier);
      if (all.length && !identifier) throw new Error("No canonical Shazam identifier");
      // Even an empty provider response is archived; no synthetic observation is written.
      const {data:stored,error:storeError} = await db.rpc("cfo_track_store_soundcharts_shazam",{
        p_track_id:track.id,p_endpoint_url:endpoint,p_start_date:start,p_end_date:end,p_identifier:identifier,
        p_pages:pages.map(p=>({...p,observations:identifier ? normalize(p.items,identifier,start,end) : []}))
      });
      if (storeError) throw new Error("Shazam persistence failed: "+storeError.message);
      results.push({track_id:track.id,status:all.length?"success":"no_data",calls:pages.length,received:all.length,inserted:stored?.records_inserted || 0});
    } catch (error) {
      failure = error.message;
      results.push({track_id:track.id,status:"failed",calls:pages.length,error:failure});
    }
    if (budgetBlocked) break;
  }
  const status = results.some(x=>x.status==="failed") ? "partial" : "success";
  const summary = {start_date:start,end_date:end,expected_tracks:scope.tracks.length,processed:results.length,tracks:results};
  const {error:finishError} = await db.schema("acquisition").from("soundcharts_daily_runs")
    .update({status,api_calls:calls,finished_at:new Date().toISOString(),summary}).eq("id",run.id);
  return Response.json({run_id:run.id,status:finishError?"audit_failed":status,api_calls:calls,...summary},{status:finishError?500:200});
}
Deno.serve(handler);
