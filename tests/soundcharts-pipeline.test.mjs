import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { chooseIdentifier, normalize } from '../supabase/functions/cfo-soundcharts-shazam-backfill/logic.mjs';

function setup({items=[], budget=true, http=200, persistError=null, next=null}={}) {
  const calls=[], stored=[], audits=[];
  const tracks=[{id:'track-1',title:'Qualified track',soundcharts_uuid:'song-1'}];
  const db={
    schema(){return this;},
    from(table){
      const chain={
        insert(x){audits.push(x);return chain;},
        select(){return chain;},eq(){return chain;},order(){return chain;},
        single:async()=>({data:{id:'run-1'}}),
        limit:async()=>({data:[{platform_identifier:'canonical'}]}),
        update(x){audits.push(x);return chain;},
        then(resolve){return Promise.resolve({error:null}).then(resolve);}
      };return chain;
    },
    async rpc(name,args) {
      calls.push({name,args});
      if(name==='cfo_soundcharts_context')return {data:{app_id:'private-app',api_key:'private-api',soundcharts_uuid:'artist-1'}};
      if(name==='cfo_track_extract_context')return {data:{tracks}};
      if(name==='cfo_reserve_soundcharts_call')return {data:budget?1:null};
      if(name==='cfo_track_store_soundcharts_shazam'){stored.push(args);return {data:{records_inserted:args.p_pages.flatMap(x=>x.observations).length}};}
      if(name==='cfo_record_soundcharts_response')return {error:persistError};
      return {data:'run-1'};
    }
  };
  let requests=0,handler;
  const fakeCrypto={subtle:{async digest(algorithm,bytes){
    const value=new TextDecoder().decode(bytes);
    if(value==='test-invoke')return Uint8Array.from(Buffer.from('04c06a2c7fa9936b163d9295b91cadd518332191c720b17613982620e3edf497','hex')).buffer;
    return crypto.subtle.digest(algorithm,bytes);
  }}};
  function load(slug) {
    const source=fs.readFileSync(new URL('../supabase/functions/'+slug+'/index.ts',import.meta.url),'utf8')
      .replace(/^import .*;\r?\n/gm,'').replace('export async function handler','async function handler');
    vm.runInNewContext(stripTypeScriptTypes(source),{
      Response,Request,URL,TextEncoder,TextDecoder,crypto:fakeCrypto,console,chooseIdentifier,normalize,
      createClient:()=>db,Deno:{env:{get:()=>''},serve:fn=>{handler=fn;}},
      fetch:async()=>{requests++;return new Response(JSON.stringify({items,page:{next}}),{status:http});}
    });
    return (body={},authorized=true)=>handler(new Request('https://example.test',{
      method:'POST',headers:authorized?{'x-cfo-extractor-key':'test-invoke'}:{},body:JSON.stringify(body)
    }));
  }
  return {load,calls,stored,audits,get requests(){return requests;}};
}

test('canonical identifier remains stable when another counter grows larger',()=>{
  assert.equal(chooseIdentifier([{date:'2026-10-15',plots:[{identifier:'a',value:10},{identifier:'b',value:20}]}],'a'),'a');
});
test('null, negative and out-of-window values never become observations',()=>{
  const items=[null,-1,4].map((value,i)=>({date:'2026-10-'+(12+i),plots:[{identifier:'a',value}]}));
  assert.deepEqual(normalize(items,'a','2026-10-13','2026-10-16'),[{date:'2026-10-14',value:4,identifier:'a'}]);
});
for(const slug of ['cfo-soundcharts-extract','cfo-soundcharts-shazam-backfill']){
  test(slug+' rejects unauthenticated requests before accessing credentials',async()=>{
    const s=setup(),run=s.load(slug);assert.equal((await run({},false)).status,401);assert.equal(s.calls.length,0);
  });
}
test('daily collector refuses historical collection before calling Soundcharts',async()=>{
  const s=setup(),run=s.load('cfo-soundcharts-extract');
  assert.equal((await run({datasets:['platform_history']})).status,400);assert.equal(s.requests,0);
});
test('Shazam persists only qualified tracks and actual provider observations',async()=>{
  const s=setup({items:[{date:'2026-10-15',plots:[{identifier:'canonical',value:123}]}]});
  const r=await s.load('cfo-soundcharts-shazam-backfill')({max_tracks:1000});
  assert.equal(r.status,200);assert.equal(s.requests,1);assert.equal(s.stored[0].p_track_id,'track-1');
  assert.equal(s.stored[0].p_pages[0].observations[0].value,123);
  assert.ok(s.calls.findIndex(x=>x.name==='cfo_reserve_soundcharts_call')<s.calls.findIndex(x=>x.name==='cfo_track_store_soundcharts_shazam'));
  assert.ok(!(await r.text()).includes('private-api'));
});
test('empty Shazam response is archived without inventing a zero',async()=>{
  const s=setup();const r=await s.load('cfo-soundcharts-shazam-backfill')();
  assert.equal((await r.json()).tracks[0].status,'no_data');
  assert.equal(s.stored[0].p_pages[0].observations.length,0);
});
test('exhausted budget prevents network calls and records partial run',async()=>{
  const s=setup({budget:false});const r=await s.load('cfo-soundcharts-shazam-backfill')();
  assert.equal(s.requests,0);assert.equal((await r.json()).status,'partial');assert.equal(s.stored.length,0);
});
test('provider failure never reaches observation storage',async()=>{
  const s=setup({http:429});const r=await s.load('cfo-soundcharts-shazam-backfill')();
  assert.equal((await r.json()).status,'partial');assert.equal(s.stored.length,0);assert.equal(s.requests,1);
});
test('archival errors cannot be reported as successful extraction',async()=>{
  const s=setup({persistError:{message:'archive unavailable'}});
  const r=await s.load('cfo-soundcharts-extract')({datasets:['streaming_audience']});
  const data=await r.json();assert.equal(data.datasets.streaming_audience.status,'partial');
});
