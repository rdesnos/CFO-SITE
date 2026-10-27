import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildMarineFeedQuery } from "./logic.mjs";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "X-CFO-Feed-Version": "2026-10-27.1",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET") {
    return new Response("GET only", { status: 405, headers: cors });
  }

  const url = new URL(req.url);
  const q = buildMarineFeedQuery(sb, url);

  const { data, error } = await q;
  if (error) {
    return Response.json({ ok:false, error:"Le fil est temporairement indisponible." }, { status:500, headers: cors });
  }

  return Response.json({
    ok:true,
    generated_at:new Date().toISOString(),
    count:data?.length || 0,
    items:data || []
  }, {
    headers:{
      "Cache-Control":"public, max-age=300, s-maxage=300",
      ...cors
    }
  });
});
