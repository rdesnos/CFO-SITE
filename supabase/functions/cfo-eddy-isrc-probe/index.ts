import { budgetedFetch, authorizeLegacy } from "../_shared/soundcharts-budget.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2.57.4";
Deno.serve(async(req)=>{
 if(!await authorizeLegacy(req))return Response.json({error:"Unauthorized"},{status:401});
 const u=new URL(req.url); 
 const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
 const {data:c,error:e}=await db.rpc("cfo_soundcharts_credentials"); if(e||!c?.app_id||!c?.api_key)return Response.json({error:e?.message??"credentials"},{status:500});
 const uuid=u.searchParams.get("uuid"); if(!uuid)return Response.json({error:"missing uuid"},{status:400});
 const r=await budgetedFetch("https://customer.api.soundcharts.com/api/v2/song/"+uuid+"/identifiers?limit=100&offset=0",{headers:{"x-app-id":c.app_id,"x-api-key":c.api_key,accept:"application/json"}});
 const p=await r.json().catch(()=>({})); return Response.json({status:r.status,payload:p});
});
