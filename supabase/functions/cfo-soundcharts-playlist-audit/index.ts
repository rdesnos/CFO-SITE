import { budgetedFetch, authorizeLegacy } from "../_shared/soundcharts-budget.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";
const BASE="https://customer.api.soundcharts.com";
Deno.serve(async(req)=>{
 if(!await authorizeLegacy(req))return Response.json({error:"Unauthorized"},{status:401});
try{if(req.method!=="POST")return Response.json({error:"POST required"},{status:405});const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);const body=await req.json().catch(()=>({}));const uuid=String(body.soundcharts_uuid||"bcfe9f65-1a5a-41da-b312-89afffe4693e");const platforms=Array.isArray(body.platforms)?body.platforms:["spotify","deezer","applemusic","amazonmusic","youtube"];
const {data:ctx,error}=await db.rpc("cfo_soundcharts_context",{p_artist_slug:"marine"});if(error)throw error;const headers={"x-app-id":ctx.app_id,"x-api-key":ctx.api_key,accept:"application/json"};const out:any[]=[];
for(const platform of platforms){for(const kind of ["current","reach"]){const path=kind==="current"?`/api/v2.20/song/${uuid}/playlist/current/${platform}`:`/api/v2/song/${uuid}/playlist/reach/${platform}`;const u=new URL(BASE+path);u.searchParams.set("limit","100");u.searchParams.set("offset","0");const r=await budgetedFetch(u,{headers});let payload:any;try{payload=await r.json()}catch{payload={text:await r.text().catch(()=>"")}}out.push({platform,kind,status:r.status,url:u.toString(),payload});}}
return Response.json({soundcharts_uuid:uuid,results:out});}catch(e){return Response.json({error:String(e?.message||e)},{status:500})}});
