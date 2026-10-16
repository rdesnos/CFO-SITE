import { budgetedFetch, authorizeLegacy } from "../_shared/soundcharts-budget.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";
const INVOKE_HASH="04c06a2c7fa9936b163d9295b91cadd518332191c720b17613982620e3edf497";
async function sha256(value:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,"0")).join("")}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return Response.json({error:"POST required"},{status:405});
 const key=req.headers.get("x-cfo-extractor-key")??"";
 if(!key||await sha256(key)!==INVOKE_HASH)return Response.json({error:"Unauthorized"},{status:401});
 const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
 const {data:credentials,error}=await db.rpc("cfo_soundcharts_credentials");
 if(error||!credentials?.app_id||!credentials?.api_key)return Response.json({error:error?.message??"Missing credentials"},{status:500});
 const body=await req.json().catch(()=>({}));
 const artists=Array.isArray(body.artists)?body.artists:[];
 const results:Record<string,unknown>={};
 for(const artist of artists){
   const name=String(artist.name??""); const slug=String(artist.slug??"");
   const url=new URL("https://customer.api.soundcharts.com/api/v2/artist/search/"+encodeURIComponent(name));
   url.searchParams.set("limit","20");url.searchParams.set("offset","0");
   const res=await budgetedFetch(url,{headers:{"x-app-id":credentials.app_id,"x-api-key":credentials.api_key,"accept":"application/json"}});
   const payload=await res.json().catch(()=>({}));
   const items=Array.isArray(payload?.items)?payload.items:[];
   results[slug]={status:res.status,candidates:items.slice(0,10).map((x:any)=>({uuid:x.uuid,name:x.name,slug:x.slug,countryCode:x.countryCode,appUrl:x.appUrl,imageUrl:x.imageUrl,genres:x.genres,spotifyFollowers:x.spotifyFollowers,soundchartsScore:x.soundchartsScore}))};
 }
 return Response.json({results});
});
