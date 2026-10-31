// RudyLadit film draft 01: one fixed 38-second generation; insert 2-second silence locally at 24s.
// Isolated from the initial piano pilot and all CFO article/TTS functions.
// Deploy ONLY with verify_jwt=true; additionally require an explicit pilot credential.
// Temporary access is disabled until a separately authorized credential is provisioned.
const pilotTokenSha256 = "DISABLED";
const pilotTokenExpiresAt = 0;
const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const compositionPlan = {
  "chunks": [
    {
      "duration_ms": 8000,
      "text": "[Instrumental piano opening]\n[Upper-register lyrical solo piano]\n[Small ascending piano arpeggio in the final second, leading into violin entry]",
      "positive_styles": [
        "Original instrumental cinematic chamber-rock score",
        "No vocals, no singing, no spoken words",
        "One memorable lyrical motif in D major, coherent harmonic development",
        "Expressive real acoustic concert grand piano in a bright upper register, nuanced touch",
        "Natural dynamics, acoustic realism, polished recording, 120 BPM with expressive phrasing",
        "Solo acoustic grand piano only",
        "Bright upper-register melody, singing expressive right hand, subtle left hand",
        "No strings or percussion yet, arpeggio pickup at the end"
      ],
      "negative_styles": [
        "vocals",
        "singing",
        "spoken words",
        "acoustic guitar",
        "nylon guitar",
        "synth pads",
        "electronic drums",
        "strings",
        "violin",
        "cello",
        "double bass",
        "drums",
        "guitar"
      ],
      "context_adherence": "high"
    },
    {
      "duration_ms": 8000,
      "text": "[Instrumental: violins join the continuing piano]\n[Piano stays audible throughout, violins expand the same melody]",
      "positive_styles": [
        "Original instrumental cinematic chamber-rock score",
        "No vocals, no singing, no spoken words",
        "One memorable lyrical motif in D major, coherent harmonic development",
        "Expressive real acoustic concert grand piano in a bright upper register, nuanced touch",
        "Natural dynamics, acoustic realism, polished recording, 120 BPM with expressive phrasing",
        "Piano continues without stopping",
        "Warm bowed acoustic violins join and remain",
        "Cumulative arrangement, no instrument drops out"
      ],
      "negative_styles": [
        "vocals",
        "singing",
        "spoken words",
        "acoustic guitar",
        "nylon guitar",
        "synth pads",
        "electronic drums",
        "cello",
        "double bass",
        "drums",
        "guitar"
      ],
      "context_adherence": "high"
    },
    {
      "duration_ms": 4000,
      "text": "[Instrumental: cello joins piano and violins]\n[All earlier instruments continue]",
      "positive_styles": [
        "Original instrumental cinematic chamber-rock score",
        "No vocals, no singing, no spoken words",
        "One memorable lyrical motif in D major, coherent harmonic development",
        "Expressive real acoustic concert grand piano in a bright upper register, nuanced touch",
        "Natural dynamics, acoustic realism, polished recording, 120 BPM with expressive phrasing",
        "Piano and bowed violins remain clearly audible",
        "Expressive bowed cello enters with a lyrical counterline",
        "Three acoustic layers accumulating"
      ],
      "negative_styles": [
        "vocals",
        "singing",
        "spoken words",
        "acoustic guitar",
        "nylon guitar",
        "synth pads",
        "electronic drums",
        "double bass",
        "drums",
        "guitar"
      ],
      "context_adherence": "high"
    },
    {
      "duration_ms": 4000,
      "text": "[Instrumental: plucked double bass joins]\n[Piano, violins and cello all continue to an abrupt ensemble stop]",
      "positive_styles": [
        "Original instrumental cinematic chamber-rock score",
        "No vocals, no singing, no spoken words",
        "One memorable lyrical motif in D major, coherent harmonic development",
        "Expressive real acoustic concert grand piano in a bright upper register, nuanced touch",
        "Natural dynamics, acoustic realism, polished recording, 120 BPM with expressive phrasing",
        "Piano, bowed violins and bowed cello all continue",
        "Acoustic double bass enters in pizzicato, played with fingers, distinctly plucked",
        "Cumulative crescendo, abrupt clean stop at section end"
      ],
      "negative_styles": [
        "vocals",
        "singing",
        "spoken words",
        "acoustic guitar",
        "nylon guitar",
        "synth pads",
        "electronic drums",
        "bowed double bass",
        "drums",
        "guitar"
      ],
      "context_adherence": "high"
    },
    {
      "duration_ms": 5000,
      "text": "[Instrumental: acoustic drum kit solo]\n[Only drums, energetic expressive toms and snare, setting up the full-band return]",
      "positive_styles": [
        "Original instrumental cinematic chamber-rock score",
        "No vocals, no singing, no spoken words",
        "One memorable lyrical motif in D major, coherent harmonic development",
        "Expressive real acoustic concert grand piano in a bright upper register, nuanced touch",
        "Natural dynamics, acoustic realism, polished recording, 120 BPM with expressive phrasing",
        "Acoustic drum kit alone",
        "Tight live drum solo, tom fills, snare, kick, cymbals",
        "All pitched instruments and all strings completely absent"
      ],
      "negative_styles": [
        "vocals",
        "singing",
        "spoken words",
        "acoustic guitar",
        "nylon guitar",
        "synth pads",
        "electronic drums",
        "piano",
        "strings",
        "violin",
        "cello",
        "double bass",
        "guitar",
        "bass guitar",
        "orchestra"
      ],
      "context_adherence": "high"
    },
    {
      "duration_ms": 9000,
      "text": "[Instrumental full ensemble climax]\n[Prominent catchy electric guitar riff over the entire returning ensemble]\n[Decisive resolved ending]",
      "positive_styles": [
        "Original instrumental cinematic chamber-rock score",
        "No vocals, no singing, no spoken words",
        "One memorable lyrical motif in D major, coherent harmonic development",
        "Expressive real acoustic concert grand piano in a bright upper register, nuanced touch",
        "Natural dynamics, acoustic realism, polished recording, 120 BPM with expressive phrasing",
        "Foreground electric guitar with an identifiable melodic rock RIFF, crunchy amplified tone",
        "The electric guitar riff is the lead and clearly audible, not buried background guitar",
        "Full return of acoustic piano, bowed violins, bowed cello, pizzicato double bass and acoustic drums",
        "All instruments play together behind the electric guitar riff",
        "Powerful joyful cinematic climax, memorable motif, final resolved chord"
      ],
      "negative_styles": [
        "vocals",
        "singing",
        "spoken words",
        "acoustic guitar",
        "nylon guitar",
        "synth pads",
        "electronic drums"
      ],
      "context_adherence": "high"
    }
  ]
};


const bucket = "rudyladit-music-pilot";
const audioPath = "film-draft01-38s-2026-10-31.mp3";
const lockPath = "film-draft01-38s-2026-10-31.attempt.json";
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
    return json({ok:true,model_id:"music_v2_5",generated_duration_ms:38000,final_duration_ms:40000,
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
      body:JSON.stringify({attempted_at:new Date().toISOString(),model_id:"music_v2_5",music_length_ms:38000})});
    if(!lock.ok) return json({ok:false,error:"Attempt already reserved or storage unavailable; generation NOT retried"},409);
    const response=await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192",{
      method:"POST",headers:{"xi-api-key":key,"Content-Type":"application/json","Accept":"audio/mpeg"},
      body:JSON.stringify({composition_plan:compositionPlan,model_id:"music_v2_5"}),
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
