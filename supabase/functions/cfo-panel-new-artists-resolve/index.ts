import { budgetedFetch, authorizeLegacy } from "../_shared/soundcharts-budget.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2.57.4";
Deno.serve(async(req)=>{
 if(!await authorizeLegacy(req))return Response.json({error:"Unauthorized"},{status:401});

 const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
 const {data:c,error:e}=await db.rpc("cfo_soundcharts_credentials"); if(e||!c?.app_id||!c?.api_key)return Response.json({error:"credentials"},{status:500});
 const names=["Ambre","Léa Doffey"]; const out:any={};
 for(const name of names){
  const r=await budgetedFetch("https://customer.api.soundcharts.com/api/v2/artist/search/"+encodeURIComponent(name)+"?limit=10&offset=0",{headers:{"x-app-id":c.app_id,"x-api-key":c.api_key,accept:"application/json"}});
  const p=await r.json().catch(()=>({}));
  out[name]={status:r.status,items:(p?.items??[]).map((x:any)=>({uuid:x.uuid,name:x.name,slug:x.slug,countryCode:x.countryCode,appUrl:x.appUrl,genres:x.genres,spotifyFollowers:x.spotifyFollowers,soundchartsScore:x.soundchartsScore}))};
 }
 return Response.json(out);
});
