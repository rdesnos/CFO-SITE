import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// RudyLadit: bounded piano pilot. Never expose the ElevenLabs secret to clients.
// Only deploy with Supabase JWT verification enabled.
const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const prompt = [
  "Create exactly eight seconds of original instrumental solo acoustic concert grand piano music.",
  "A beautiful, unforgettable lyrical melody with expressive phrasing and confident musical direction.",
  "Sophisticated melodic right hand, flowing arpeggiated harmonies, richly voiced left hand, rubato and expressive pedal resonance.",
  "Warm realistic premium close-miked concert grand, natural acoustic dynamics, nuanced touch, no quantized repetitive ostinatos.",
  "No synthesizers, no strings, no percussion, no vocals, no sound effects.",
  "An emotionally engaging opening for a cinematic brand film, beginning immediately with a distinct melody."
].join(" ");

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response(JSON.stringify({ok:false,error:"POST required"}), {status:405,headers});
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) return new Response(JSON.stringify({ok:false,error:"ElevenLabs server secret missing"}), {status:503,headers});
  try {
    // Fixed parameters: clients cannot increase cost or override the musical brief.
    const response = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192", {
      method:"POST",
      headers:{"xi-api-key":key,"Content-Type":"application/json","Accept":"audio/mpeg"},
      body:JSON.stringify({prompt,model_id:"music_v2_5",music_length_ms:8000,force_instrumental:true})
    });
    if (!response.ok) {
      return new Response(JSON.stringify({ok:false,error:"music generation failed",provider_status:response.status}), {status:502,headers});
    }
    const audio = await response.arrayBuffer();
    return new Response(audio,{status:200,headers:{"Content-Type":"audio/mpeg","Cache-Control":"no-store","Content-Disposition":"attachment; filename=rudyladit-piano-8s.mp3"}});
  } catch {
    return new Response(JSON.stringify({ok:false,error:"upstream request failed"}),{status:502,headers});
  }
});
