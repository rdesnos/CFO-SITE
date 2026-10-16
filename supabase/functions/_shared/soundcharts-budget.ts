import { createClient } from "jsr:@supabase/supabase-js@2.57.4";
const INVOKE_HASH = "04c06a2c7fa9936b163d9295b91cadd518332191c720b17613982620e3edf497";
export async function authorizeLegacy(req: Request) {
  const key=req.headers.get("x-cfo-extractor-key");
  if (!key) return false;
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(key));
  return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("")===INVOKE_HASH;
}
export async function budgetedFetch(input: Request | URL | string, init?: RequestInit) {
  const url=new URL(input instanceof Request ? input.url : String(input));
  if (url.hostname==="customer.api.soundcharts.com") {
    const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
    const {data,error}=await db.rpc("cfo_reserve_soundcharts_call",{p_endpoint:url.pathname});
    if (error || !data) return Response.json({errors:[{message:"Soundcharts budget unavailable or exhausted"}]},{status:429});
  }
  return fetch(input,init);
}

