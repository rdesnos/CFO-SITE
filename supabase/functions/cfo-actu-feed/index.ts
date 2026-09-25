import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("GET only", { status: 405 });
  }

  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)));
  const tier = url.searchParams.get("tier");
  const category = url.searchParams.get("category");

  let q = sb
    .from("cfo_actu_feed")
    .select("*")
    .limit(limit);

  if (tier && ["platinum","gold","silver"].includes(tier)) q = q.eq("source_tier", tier);
  if (category) q = q.eq("category", category);

  const { data, error } = await q;
  if (error) {
    return Response.json({ ok:false, error:error.message }, { status:500 });
  }

  return Response.json({
    ok:true,
    generated_at:new Date().toISOString(),
    count:data?.length || 0,
    items:data || []
  }, {
    headers:{
      "Cache-Control":"public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin":"*"
    }
  });
});