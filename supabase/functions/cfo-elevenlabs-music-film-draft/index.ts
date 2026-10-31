// RudyLadit film draft 03, warm lyrical French pop: one fixed 40-second generation; add 0.5s silence at 30s and compress 3s drum solo to 2.5s locally.
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
      "text": "[Instrumental]\n{Intimate high-register acoustic piano, heartfelt pop melody}\n{Small rising piano arpeggio in the final second}",
      "positive_styles": [
        "Original contemporary French pop instrumental, heartfelt and organic",
        "A memorable singable melody, bittersweet warmth and hopeful emotional lift",
        "Natural human phrasing and dynamics, intimate detailed recording",
        "100 BPM, flowing pop pulse, harmonically coherent from start to finish",
        "Entirely instrumental, no vocals or spoken words",
        "Solo real acoustic grand piano only",
        "Warm bright upper-middle register C5 to E6, lyrical right-hand melody, subtle spacious left hand",
        "Tender vocal-like melodic phrasing played only on piano, simple emotionally direct tune",
        "A small elegant rising arpeggio in the final second introduces the violins",
        "No percussion or strings yet"
      ],
      "negative_styles": [
        "vocals",
        "singing",
        "spoken words",
        "acoustic guitar",
        "nylon guitar",
        "trailer music",
        "epic orchestral soundtrack",
        "Hollywood fanfare",
        "brass",
        "hybrid cinematic drums",
        "synth pads",
        "EDM",
        "heavy metal",
        "aggressive distortion",
        "virtuosic shredding",
        "bombastic orchestral hits",
        "strings",
        "violin",
        "cello",
        "double bass",
        "drums",
        "electric guitar"
      ],
      "context_adherence": "high"
    },
    {
      "duration_ms": 8000,
      "text": "[Instrumental]\n{Violins join and gently swell; piano keeps playing the melody}",
      "positive_styles": [
        "Original contemporary French pop instrumental, heartfelt and organic",
        "A memorable singable melody, bittersweet warmth and hopeful emotional lift",
        "Natural human phrasing and dynamics, intimate detailed recording",
        "100 BPM, flowing pop pulse, harmonically coherent from start to finish",
        "Entirely instrumental, no vocals or spoken words",
        "The same piano melody continues clearly without stopping",
        "Soft real bowed violins enter, embrace and gently lift the piano melody",
        "Intimate French pop string arrangement, gradual rise in emotion without symphonic bombast",
        "Earlier piano remains present, violin layer stays after entry"
      ],
      "negative_styles": [
        "vocals",
        "singing",
        "spoken words",
        "acoustic guitar",
        "nylon guitar",
        "trailer music",
        "epic orchestral soundtrack",
        "Hollywood fanfare",
        "brass",
        "hybrid cinematic drums",
        "synth pads",
        "EDM",
        "heavy metal",
        "aggressive distortion",
        "virtuosic shredding",
        "bombastic orchestral hits",
        "cello",
        "double bass",
        "drums",
        "electric guitar"
      ],
      "context_adherence": "high"
    },
    {
      "duration_ms": 8000,
      "text": "[Instrumental]\n{Warm cello joins; piano and violins remain, emotional cumulative build}",
      "positive_styles": [
        "Original contemporary French pop instrumental, heartfelt and organic",
        "A memorable singable melody, bittersweet warmth and hopeful emotional lift",
        "Natural human phrasing and dynamics, intimate detailed recording",
        "100 BPM, flowing pop pulse, harmonically coherent from start to finish",
        "Entirely instrumental, no vocals or spoken words",
        "Piano and violins continue, sustained natural warmth",
        "A warm bowed cello enters at the start, tender lyrical counter-melody",
        "Gradual emotional swell with breathing space, each layer remains audible",
        "No double bass or drums yet"
      ],
      "negative_styles": [
        "vocals",
        "singing",
        "spoken words",
        "acoustic guitar",
        "nylon guitar",
        "trailer music",
        "epic orchestral soundtrack",
        "Hollywood fanfare",
        "brass",
        "hybrid cinematic drums",
        "synth pads",
        "EDM",
        "heavy metal",
        "aggressive distortion",
        "virtuosic shredding",
        "bombastic orchestral hits",
        "double bass",
        "drums",
        "electric guitar"
      ],
      "context_adherence": "high"
    },
    {
      "duration_ms": 6000,
      "text": "[Instrumental]\n{Finger-plucked double bass joins; all earlier layers continue and swell, then stop together}",
      "positive_styles": [
        "Original contemporary French pop instrumental, heartfelt and organic",
        "A memorable singable melody, bittersweet warmth and hopeful emotional lift",
        "Natural human phrasing and dynamics, intimate detailed recording",
        "100 BPM, flowing pop pulse, harmonically coherent from start to finish",
        "Entirely instrumental, no vocals or spoken words",
        "Piano, violins and bowed cello all continue",
        "Finger-plucked acoustic double bass enters in pizzicato, round woody notes",
        "The low pizzicato pulse lifts the same pop theme, expressive cumulative growth",
        "Crescendo stays intimate and melodic, no trailer tension or orchestral fanfare",
        "Abrupt full-ensemble stop at the end"
      ],
      "negative_styles": [
        "vocals",
        "singing",
        "spoken words",
        "acoustic guitar",
        "nylon guitar",
        "trailer music",
        "epic orchestral soundtrack",
        "Hollywood fanfare",
        "brass",
        "hybrid cinematic drums",
        "synth pads",
        "EDM",
        "heavy metal",
        "aggressive distortion",
        "virtuosic shredding",
        "bombastic orchestral hits",
        "bowed double bass",
        "drums",
        "electric guitar"
      ],
      "context_adherence": "high"
    },
    {
      "duration_ms": 3000,
      "text": "[Instrumental drum solo]\n{Acoustic drums only; brief tasteful pop fill into the ensemble return}",
      "positive_styles": [
        "Original contemporary French pop instrumental, heartfelt and organic",
        "A memorable singable melody, bittersweet warmth and hopeful emotional lift",
        "Natural human phrasing and dynamics, intimate detailed recording",
        "100 BPM, flowing pop pulse, harmonically coherent from start to finish",
        "Entirely instrumental, no vocals or spoken words",
        "Live acoustic drum kit alone, all harmonic instruments completely absent",
        "Short musical pop drum solo, tasteful kick snare and toms, natural room",
        "Human groove and a decisive pickup into the returning ensemble, not a loud rock showcase"
      ],
      "negative_styles": [
        "vocals",
        "singing",
        "spoken words",
        "acoustic guitar",
        "nylon guitar",
        "trailer music",
        "epic orchestral soundtrack",
        "Hollywood fanfare",
        "brass",
        "hybrid cinematic drums",
        "synth pads",
        "EDM",
        "heavy metal",
        "aggressive distortion",
        "virtuosic shredding",
        "bombastic orchestral hits",
        "piano",
        "strings",
        "violin",
        "cello",
        "double bass",
        "guitar",
        "orchestra"
      ],
      "context_adherence": "low"
    },
    {
      "duration_ms": 7000,
      "text": "[Instrumental final chorus]\n{Electric guitar melodic riff enters immediately, all earlier instruments return behind it}\n{Warm powerful resolved ending}",
      "positive_styles": [
        "Original contemporary French pop instrumental, heartfelt and organic",
        "A memorable singable melody, bittersweet warmth and hopeful emotional lift",
        "Natural human phrasing and dynamics, intimate detailed recording",
        "100 BPM, flowing pop pulse, harmonically coherent from start to finish",
        "Entirely instrumental, no vocals or spoken words",
        "Full pop-band return: piano, violins, cello, pizzicato double bass and live drums together",
        "Electric guitar enters immediately with a memorable repeated melodic RIFF clearly at the front",
        "Warm clean-to-light-overdrive electric amp tone, singing sustain, emotionally uplifting recognizable hook",
        "The guitar riff carries the same lyrical motif while the piano and strings support it behind",
        "Strong emotional French pop climax with clarity and warmth, powerful without aggression",
        "A decisive musical ending, not an endless fade"
      ],
      "negative_styles": [
        "vocals",
        "singing",
        "spoken words",
        "acoustic guitar",
        "nylon guitar",
        "trailer music",
        "epic orchestral soundtrack",
        "Hollywood fanfare",
        "brass",
        "hybrid cinematic drums",
        "synth pads",
        "EDM",
        "heavy metal",
        "aggressive distortion",
        "virtuosic shredding",
        "bombastic orchestral hits"
      ],
      "context_adherence": "high"
    }
  ]
};


const bucket = "rudyladit-music-pilot";
const audioPath = "film-draft03-pop-40s-2026-11-01.mp3";
const lockPath = "film-draft03-pop-40s-2026-11-01.attempt.json";
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
    return json({ok:true,model_id:"music_v2_5",generated_duration_ms:40000,final_duration_ms:40000,
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
      body:JSON.stringify({attempted_at:new Date().toISOString(),model_id:"music_v2_5",music_length_ms:40000})});
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
