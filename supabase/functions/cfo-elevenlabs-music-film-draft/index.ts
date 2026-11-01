// RudyLadit V11: complete forty-second listening proposal, new first phrase and electric finale.
// Reuse the existing V8 isolated drums; 28.7s first phrase + 0.3s breath + 4s drums + 7s finale.
// New phrases follow corrected pizzicato cello and audible four-second drum solo instructions.
// Assembly must reject a missing drum attack or an extended silent section.
// This endpoint returns the original provider MP3 for the selected fixed part.
// Isolated from the initial piano pilot and all CFO article/TTS functions.
// Deploy ONLY with verify_jwt=true; additionally require an explicit pilot credential.
// Temporary access is disabled until a separately authorized credential is provisioned.
const pilotTokenSha256 = "DISABLED";
const pilotTokenExpiresAt = 0;
const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const fixedRequests = {
  "first": {
    "composition_plan": {
      "chunks": [
        {
          "duration_ms": 5000,
          "text": "[Instrumental piano opening]",
          "positive_styles": [
            "Original instrumental expressive French acoustic pop ballad, lively 112 BPM, B minor",
            "Strong memorable melodic hook with personality, sensitivity and forward motion",
            "Natural acoustic sound, expressive human phrasing, no vocals",
            "Only acoustic grand piano; sensitive but lively and rhythmically buoyant",
            "Clear melodic right hand in the upper middle register and flowing broken chords",
            "Begin playing on the very first beat, short rising arpeggio near the end"
          ],
          "negative_styles": [
            "vocals",
            "strings",
            "drums",
            "guitars",
            "silent intro"
          ],
          "context_adherence": "medium"
        },
        {
          "duration_ms": 4000,
          "text": "[Violin enters above continuing piano]",
          "positive_styles": [
            "Original instrumental expressive French acoustic pop ballad, lively 112 BPM, B minor",
            "Strong memorable melodic hook with personality, sensitivity and forward motion",
            "Natural acoustic sound, expressive human phrasing, no vocals",
            "Clearly audible real bowed violin enters now, warmly in its middle register",
            "Violin complements the piano melody in close harmonic partnership; piano stays present",
            "Growing emotional intensity, balanced chamber duo, no shrill high violin"
          ],
          "negative_styles": [
            "vocals",
            "drums",
            "guitars"
          ],
          "context_adherence": "medium"
        },
        {
          "duration_ms": 19700,
          "text": "[Pizzicato cello joins; first phrase develops and resolves]",
          "positive_styles": [
            "Original instrumental expressive French acoustic pop ballad, lively 112 BPM, B minor",
            "Strong memorable melodic hook with personality, sensitivity and forward motion",
            "Natural acoustic sound, expressive human phrasing, no vocals",
            "Finger-plucked PIZZICATO CELLO enters immediately with a warm rhythmic low counterline",
            "Acoustic piano and middle-register bowed violin keep playing",
            "Sustained growth of intensity, a clear beautiful tune with a developing answer phrase",
            "Violin supports and enriches the piano, never a detached solo pasted over it",
            "The complete melodic sentence lands on a resolved B-minor chord at the very end, no long fade and no silent outro"
          ],
          "negative_styles": [
            "vocals",
            "bowed cello",
            "drums",
            "guitars",
            "synthesizers"
          ],
          "context_adherence": "high"
        }
      ]
    },
    "model_id": "music_v2_5"
  },
  "finale": {
    "prompt": "Entirely instrumental original French pop-rock final climax, B minor, lively 112 BPM. Start at full intensity from the very first instant. A memorable expressive ELECTRIC GUITAR RIFF in the middle register plays in front of a full acoustic ensemble: grand piano, warm bowed violin, finger-plucked pizzicato cello and powerful live acoustic drums. Strong melodic hook, warm amp sustain, controlled overdrive, confident rhythmic drive. The piano carries sensitivity, the strings carry intensity, the drums carry power. All instruments play together in symbiosis. Clear emotional payoff, uplifting passionate character, not a sentimental lullaby. No vocals, no acoustic guitar, no synth pads, no brass, no heavy metal. No quiet introduction. Resolve the short final statement firmly in B minor near the ending. Nine seconds total.",
    "music_length_ms": 9000,
    "force_instrumental": true,
    "model_id": "music_v2_5"
  }
};


const bucket = "rudyladit-music-pilot";
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {status, headers});
async function equalSecret(a: string, b: string) {
  const enc = new TextEncoder();
  const [x,y] = await Promise.all([a,b].map(v => crypto.subtle.digest("SHA-256",enc.encode(v))));
  const p=new Uint8Array(x), q=new Uint8Array(y);
  let diff=0; for(let i=0;i<p.length;i++) diff |= p[i]^q[i];
  return diff===0;
}
Deno.serve(async (req: Request) => {
  if(req.method!=="POST") return json({ok:false,error:"POST required"},405);
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if(!service || !url || !key) return json({ok:false,error:"Server configuration missing"},503);
  const token = req.headers.get("Authorization")?.replace(/^Bearer /,"") || "";
  const pilotToken = req.headers.get("x-pilot-token") || "";
  let temporaryAccess = false;
  if(pilotToken && Date.now() < pilotTokenExpiresAt && /^[a-f0-9]{64}$/.test(pilotTokenSha256)) {
    const digest = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(pilotToken));
    const hex = Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
    temporaryAccess = await equalSecret(hex,pilotTokenSha256);
  }
  if(!temporaryAccess && !await equalSecret(token,service)) return json({ok:false,error:"Authorized pilot credential required"},403);
  let input: {part?: string};
  try { input = await req.json(); } catch { return json({ok:false,error:"JSON body required"},400); }
  if(!input || typeof input!=="object" || Object.keys(input).some(k=>k!=="part") || !["first","finale"].includes(input.part || "")) {
    return json({ok:false,error:"part must be first or finale; no other parameters allowed"},400);
  }
  const part = input.part as keyof typeof fixedRequests;
  const providerRequest = fixedRequests[part];
  const generatedDurationMs = part==="first" ? 28700 : 9000;
  const stem = "score11-"+part+"-2026-11-01";
  const audioPath = stem+".mp3";
  const lockPath = stem+".attempt.json";
  const storage = (path: string, init: RequestInit = {}) => fetch(url+"/storage/v1/"+path, {
    ...init, headers: {"apikey":service,"Authorization":"Bearer "+service,...init.headers},
    signal: AbortSignal.timeout(20000)
  });
  const signedResult = async () => {
    const r = await storage("object/sign/"+bucket+"/"+audioPath,{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({expiresIn:604800})
    });
    if(!r.ok) return json({ok:false,error:"Audio stored; signing failed. Do not regenerate."},502);
    const data=await r.json();
    return json({ok:true,model_id:"music_v2_5",part,generated_duration_ms:generatedDurationMs,planned_film_duration_ms:40000,
      audio_url:url+"/storage/v1"+data.signedURL,expires_in:604800,object:bucket+"/"+audioPath});
  };
  try {
    // A dedicated PRIVATE bucket, no changes to existing media buckets or policies.
    const existing = await storage("bucket/"+bucket);
    if(existing.status===404 || existing.status===400) {
      const made=await storage("bucket",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:bucket,name:bucket,public:false})});
      if(!made.ok && made.status!==409) return json({ok:false,error:"Private storage setup failed"},502);
    } else if(!existing.ok) return json({ok:false,error:"Private storage unavailable"},502);
    else if((await existing.json()).public) return json({ok:false,error:"Pilot bucket must be private"},503);
    const saved = await storage("object/authenticated/"+bucket+"/"+audioPath,{method:"HEAD"});
    if(saved.ok) return await signedResult();
    if(saved.status!==404 && saved.status!==400) return json({ok:false,error:"Cannot check existing audio"},502);
    // Atomic create, never upsert: concurrent calls/redeployments cannot repeat generation.
    // Retain this lock even on failure/timeout: provider may already have billed.
    const lock = await storage("object/"+bucket+"/"+lockPath,{method:"POST",
      headers:{"Content-Type":"application/json","x-upsert":"false"},
      body:JSON.stringify({attempted_at:new Date().toISOString(),model_id:"music_v2_5",music_length_ms:generatedDurationMs})});
    if(!lock.ok) return json({ok:false,error:"Attempt already reserved or storage unavailable; generation NOT retried"},409);
    const response=await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192",{
      method:"POST",headers:{"xi-api-key":key,"Content-Type":"application/json","Accept":"audio/mpeg"},
      body:JSON.stringify(providerRequest),
      signal:AbortSignal.timeout(120000)
    });
    if(!response.ok) {
      // Return only safe provider codes, never raw upstream content or credentials.
      let providerCode="unknown";
      try { const e=await response.json(); const c=e?.detail?.status;
        if(typeof c==="string" && /^[a-z0-9_]{1,80}$/i.test(c)) providerCode=c;
      } catch { /* non-JSON provider error */ }
      return json({ok:false,error:"Music generation failed; no automatic retry",
        provider_status:response.status,provider_code:providerCode},502);
    }
    if(!response.headers.get("Content-Type")?.includes("audio/")) return json({ok:false,error:"Provider returned non-audio; do not retry"},502);
    const audio=await response.arrayBuffer();
    const bytes=new Uint8Array(audio);
    const mp3=bytes.length>1000 && ((bytes[0]===0x49 && bytes[1]===0x44 && bytes[2]===0x33) ||
      (bytes[0]===0xff && (bytes[1]&0xe0)===0xe0));
    if(!mp3 || bytes.length>2000000) return json({ok:false,error:"Invalid MP3 response; do not retry"},502);
    const upload=await storage("object/"+bucket+"/"+audioPath,{method:"POST",
      headers:{"Content-Type":"audio/mpeg","x-upsert":"false"},body:audio});
    if(!upload.ok) return json({ok:false,error:"Audio generated but storage failed; do not regenerate"},502);
    return await signedResult();
  } catch {
    return json({ok:false,error:"Request failed or timed out; do not regenerate automatically"},502);
  }
});
