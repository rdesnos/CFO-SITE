import { budgetedFetch, authorizeLegacy } from "../_shared/soundcharts-budget.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2.57.4";

Deno.serve(async(req)=>{
 if(!await authorizeLegacy(req))return Response.json({error:"Unauthorized"},{status:401});

  const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
  const {data:cred,error:ce}=await db.rpc("cfo_soundcharts_credentials");
  if(ce||!cred?.app_id||!cred?.api_key)return Response.json({error:ce?.message??"credentials"},{status:500});
  const slugs=["ambre","lea-doffey"];
  const out:any={};
  for(const slug of slugs){
    const {data:a,error:ae}=await db.schema("acquisition").from("artists").select("id,name,soundcharts_uuid").eq("slug",slug).single();
    if(ae||!a?.soundcharts_uuid){out[slug]={error:ae?.message??"missing artist uuid"};continue;}
    const url=new URL("https://customer.api.soundcharts.com/api/v2.21/artist/"+a.soundcharts_uuid+"/songs");
    url.searchParams.set("limit","100");url.searchParams.set("offset","0");url.searchParams.set("sortBy","releaseDate");url.searchParams.set("sortOrder","desc");
    const r=await budgetedFetch(url,{headers:{"x-app-id":cred.app_id,"x-api-key":cred.api_key,accept:"application/json"}});
    const p=await r.json().catch(()=>({}));
    const items=Array.isArray(p?.items)?p.items:[];
    const page=p?.page??{};
    const {data:raw,error:re}=await db.schema("acquisition").from("raw_api_responses").insert({
      source_code:"soundcharts",endpoint_name:"artist_songs",endpoint_url:url.toString(),http_method:"GET",http_status:r.status,
      artist_id:a.id,request_parameters:{limit:100,offset:0,sortBy:"releaseDate",sortOrder:"desc"},
      response_headers:{"content-type":r.headers.get("content-type")??""},response_payload:p,page_offset:0,page_limit:100,
      page_total:Number.isFinite(Number(page?.total))?Number(page.total):items.length,next_url:typeof page?.next==="string"?page.next:null,
      requested_at:new Date().toISOString(),received_at:new Date().toISOString()
    }).select("id").single();
    if(re){out[slug]={http:r.status,error:re.message};continue;}
    const {data:norm,error:ne}=await db.rpc("cfo_normalize_soundcharts_catalog",{p_artist_slug:slug});
    out[slug]={http:r.status,raw_id:raw?.id,items:items.length,page_total:page?.total??null,normalized:norm,error:ne?.message??null};
  }
  return Response.json(out);
});
