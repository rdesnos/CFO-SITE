import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method !== "GET") return new Response("GET only", {status:405});

  const { data, error } = await sb.rpc("cfo_salles_snapshot");
  if (error) return Response.json({ok:false,error:error.message},{status:500});

  return Response.json(
    {ok:true, ...data},
    {
      headers:{
        "Cache-Control":"public, max-age=300, s-maxage=300",
        "Access-Control-Allow-Origin":"*"
      }
    }
  );
});