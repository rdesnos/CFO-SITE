import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const UA = "CFO-Salles-Monitor/1.1 (+https://chroniques-fille-ordinaire.com)";

function detectStatus(text:string, current:string) {
  const x = text.toLowerCase().replace(/\s+/g, " ");
  if (/(concert complet|complet|sold out|épuisé|epuise|plus de places|aucune place disponible)/i.test(x)) return "sold_out";
  if (/(bientôt en vente|bientot en vente|prochainement en vente|mise en vente prochaine)/i.test(x)) return "coming_soon";
  if (/(acheter|réserver|reserver|billet|tickets?|places disponibles|book now|buy tickets)/i.test(x)) return "on_sale";
  return current || "unknown";
}

async function updateRow(item:any, status:string, httpStatus:number|null, error:string|null, url:string, success:boolean) {
  await sb.rpc("cfo_salles_monitor_update", {
    p_event_id:item.id,
    p_status:status,
    p_http_status:httpStatus,
    p_error:error,
    p_checked_url:url,
    p_success:success
  });
}

async function checkItem(item:any) {
  const url = item.status_source_url || item.ticket_url;
  if (!url) return {ok:false,id:item.id,error:"no_url"};
  try {
    const response = await fetch(url, {
      headers:{"user-agent":UA,"accept":"text/html,application/xhtml+xml"},
      redirect:"follow",
      signal:AbortSignal.timeout(12000)
    });
    const body = await response.text();
    if (!response.ok) {
      await updateRow(item,item.ticket_status,response.status,"http_"+response.status,url,false);
      return {ok:false,id:item.id,http:response.status};
    }
    const status = item.ticket_status || "unknown";
    await updateRow(item,status,response.status,null,url,true);
    return {ok:true,id:item.id,status,http:response.status};
  } catch (e) {
    await updateRow(item,item.ticket_status,null,String(e),url,false);
    return {ok:false,id:item.id,error:String(e)};
  }
}

Deno.serve(async (req) => {
  if (!["GET","POST"].includes(req.method)) return new Response("GET/POST only",{status:405});

  const { data, error } = await sb.rpc("cfo_salles_snapshot");
  if (error) return Response.json({ok:false,error:error.message},{status:500});

  const items = Array.isArray(data?.items) ? data.items : [];
  const results:any[] = [];
  for (let i=0;i<items.length;i+=5) {
    results.push(...await Promise.all(items.slice(i,i+5).map(checkItem)));
  }

  return Response.json({
    ok:true,
    checked:results.filter(x=>x.ok).length,
    failed:results.filter(x=>!x.ok).length,
    generated_at:new Date().toISOString(),
    results
  });
});