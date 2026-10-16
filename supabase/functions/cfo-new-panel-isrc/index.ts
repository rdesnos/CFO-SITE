import { budgetedFetch, authorizeLegacy } from "../_shared/soundcharts-budget.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2.57.4";
Deno.serve(async(req)=>{
 if(!await authorizeLegacy(req))return Response.json({error:"Unauthorized"},{status:401});

 const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
 const {data:c,error:e}=await db.rpc("cfo_soundcharts_credentials"); if(e||!c?.app_id||!c?.api_key)return Response.json({error:"credentials"},{status:500});
 const {data:artists}=await db.schema("acquisition").from("artists").select("id,slug").in("slug",["ambre","lea-doffey"]);
 const ids=(artists??[]).map((a:any)=>a.id);
 const {data:tracks,error:te}=await db.schema("acquisition").from("tracks").select("id,title,soundcharts_uuid,isrc,primary_artist_id").in("primary_artist_id",ids);
 if(te)return Response.json({error:te.message},{status:500});
 const out:any[]=[];
 for(const t of tracks??[]){
  const url="https://customer.api.soundcharts.com/api/v2/song/"+t.soundcharts_uuid+"/identifiers?limit=100&offset=0";
  const r=await budgetedFetch(url,{headers:{"x-app-id":c.app_id,"x-api-key":c.api_key,accept:"application/json"}});
  const p=await r.json().catch(()=>({}));
  const isrcs=[...new Set((p?.items??[]).filter((x:any)=>x?.platformCode==="isrc").map((x:any)=>String(x.identifier).replace(/[^A-Za-z0-9]/g,"").toUpperCase()).filter((x:string)=>/^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/.test(x)))];
  await db.schema("acquisition").from("track_identifier_snapshots").insert({track_id:t.id,soundcharts_uuid:t.soundcharts_uuid,http_status:r.status,payload:{isrcs,raw:p},error_message:r.ok?null:"HTTP "+r.status});
  let status="no_isrc";
  if(isrcs.length===1){
    const isrc=isrcs[0] as string;
    const {data:existing}=await db.schema("acquisition").from("tracks").select("id,title").eq("isrc",isrc).neq("id",t.id).maybeSingle();
    if(existing) status="duplicate_isrc";
    else {const {error:ue}=await db.schema("acquisition").from("tracks").update({isrc,updated_at:new Date().toISOString()}).eq("id",t.id);status=ue?"update_error":"updated";}
  } else if(isrcs.length>1) status="multiple_isrcs";
  out.push({title:t.title,status,http:r.status,isrcs});
 }
 return Response.json({processed:out.length,results:out});
});
