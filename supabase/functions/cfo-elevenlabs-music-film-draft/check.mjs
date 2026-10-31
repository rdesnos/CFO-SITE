import assert from 'node:assert/strict';
let handler, calls=[], objects=new Set(), providerCalls=0, failure=false;
globalThis.Deno={env:{get:k=>({SUPABASE_SERVICE_ROLE_KEY:'test-service',SUPABASE_URL:'https://test.invalid',ELEVENLABS_API_KEY:'test-provider'}[k])},serve:h=>handler=h};
globalThis.fetch=async (url,init={})=>{
  calls.push({url,init});
  if(url.startsWith('https://api.elevenlabs.io/')){
    providerCalls++; await new Promise(resolve=>setTimeout(resolve,10));
    const body=JSON.parse(init.body);
    assert.equal(body.model_id,'music_v2_5'); assert.equal(body.composition_plan.chunks.reduce((n,c)=>n+c.duration_ms,0),38000); assert.equal(body.composition_plan.chunks.length,6); assert.equal(body.prompt,undefined); assert.ok(body.composition_plan.chunks[5].positive_styles.some(s=>s.includes('RIFF')));
    if(failure)return Response.json({detail:{status:'missing_permissions',message:'must never echo arbitrary provider text'}},{status:403});
    const b=new Uint8Array(192000); b.set([0x49,0x44,0x33]);return new Response(b,{headers:{'Content-Type':'audio/mpeg'}});
  }
  if(url.includes('/bucket/'))return Response.json({public:false});
  if(url.includes('/object/sign/'))return Response.json({signedURL:'/object/sign/test?token=test-only'});
  const name=url.split('/').at(-1);
  if(init.method==='HEAD')return new Response(null,{status:objects.has(name)?200:404});
  if(objects.has(name))return Response.json({error:'duplicate'},{status:400});
  objects.add(name);return Response.json({ok:true});
};
await import('./index.ts');
const req=(token='test-service',method='POST')=>new Request('https://test.invalid',{method,headers:token?{Authorization:'Bearer '+token}:{}});
assert.equal((await handler(req('', 'GET'))).status,405);
assert.equal((await handler(req(''))).status,403);
assert.equal((await handler(req('public-anon'))).status,403);
assert.equal(calls.length,0);
const result=await handler(req());assert.equal(result.status,200);assert.equal((await result.json()).ok,true);assert.equal(providerCalls,1);
assert.equal((await handler(req())).status,200);assert.equal(providerCalls,1);
objects.clear(); failure=true;
const failed=await handler(req());assert.equal(failed.status,502);const error=await failed.json();assert.equal(error.provider_code,'missing_permissions');assert.ok(!JSON.stringify(error).includes('must never'));
assert.equal((await handler(req())).status,409);assert.equal(providerCalls,2);
objects.clear();failure=false;
const concurrent=await Promise.all([handler(req()),handler(req())]);assert.equal(providerCalls,3);assert.ok(concurrent.some(r=>r.status===409));
console.log('PASS: methods, admin authorization, fixed API parameters, cached result, sanitized provider error, durable lock after failure, concurrent request lock. All provider calls mocked.');
