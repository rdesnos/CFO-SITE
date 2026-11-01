import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import {createHash} from 'node:crypto';
const testToken='test-only-scoped-capability';
const hash=createHash('sha256').update(testToken).digest('hex');
let handler,providerCalls=0,objects=new Set();
globalThis.Deno={env:{get:k=>({SUPABASE_SERVICE_ROLE_KEY:'test-service',SUPABASE_URL:'https://test.invalid',ELEVENLABS_API_KEY:'test-provider'}[k])},serve:h=>handler=h};
globalThis.fetch=async(url,init={})=>{
 if(url.startsWith('https://api.elevenlabs.io/')){providerCalls++;const body=JSON.parse(init.body);assert.equal(body.music_length_ms,8000);const b=new Uint8Array(192000);b.set([73,68,51]);return new Response(b,{headers:{'Content-Type':'audio/mpeg'}});}
 if(url.includes('/bucket/'))return Response.json({public:false});
 if(url.includes('/object/sign/'))return Response.json({signedURL:'/test-only'});
 const name=url.split('/').at(-1);
 if(init.method==='HEAD')return new Response(null,{status:objects.has(name)?200:404});
 if(objects.has(name))return new Response(null,{status:409});objects.add(name);return Response.json({ok:true});
};
const source=await readFile(new URL('./index.ts',import.meta.url),'utf8');
async function install(expiry){const prepared=source.replace('"DISABLED"',JSON.stringify(hash)).replace('const pilotTokenExpiresAt = 0;',`const pilotTokenExpiresAt = ${expiry};`);await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(prepared)).toString('base64'));}
const req=key=>new Request('https://test.invalid',{method:'POST',headers:{Authorization:'Bearer public-jwt','x-pilot-token':key}});
await install(Date.now()+3600000);
assert.equal((await handler(req('wrong'))).status,403);assert.equal(providerCalls,0);
assert.equal((await handler(req(testToken))).status,200);assert.equal(providerCalls,1);
assert.equal((await handler(req(testToken))).status,200);assert.equal(providerCalls,1);
await install(1);
assert.equal((await handler(req(testToken))).status,403);assert.equal(providerCalls,1);
console.log('PASS: temporary capability rejects invalid/expired tokens, accepts scoped token, reuses saved MP3 without a second generation. No real provider call.');

