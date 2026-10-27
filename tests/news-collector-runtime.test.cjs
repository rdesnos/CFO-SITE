const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const source=stripTypeScriptTypes(fs.readFileSync(require('node:path').join(__dirname,'../supabase/functions/cfo-news-collector/index.ts'),'utf8')).replace(/^import .*;$/gm,'');

async function runCollector(sources){
  const writes=[];let handler;let fetches=0;
  const client={from(table){let filters=[];return {
    select(){return this;},insert(value){writes.push({table,op:'insert',value});return this;},
    update(value){writes.push({table,op:'update',value});return this;},
    eq(field,value){filters.push([field,value]);return this;},in(){return this;},
    async single(){return {data:{id:'run-1'}};},
    then(resolve){return Promise.resolve(resolve({data:table==='cfo_news_sources'?sources.filter(s=>filters.every(([k,v])=>s[k]===v)):[],error:null}));},
  };}};
  vm.runInNewContext(source,{Deno:{env:{get:()=>''},serve:fn=>handler=fn},createClient:()=>client,URL,Response,AbortSignal,fetch:async()=>{fetches++;throw new Error('Unexpected network request');}});
  await handler({method:'POST',json:async()=>({})});
  return {writes,fetches};
}
test('a social homepage is never recorded as a successful publication collection',async()=>{
  const {writes,fetches}=await runCollector([{id:'social-1',name:'Marine Instagram',active:true,source_status:'active',collector_type:'social_external'}]);
  assert.equal(fetches,0);
  const update=writes.find(w=>w.table==='cfo_news_sources'&&w.op==='update');
  assert.match(update.value.last_error,/COLLECTOR_NOT_CONNECTED/);
  assert.equal(update.value.last_success_at,undefined);
  assert.equal(writes.at(-1).value.status,'partial');
});
test('paused and blacklisted sources are not collected',async()=>{
  const {writes,fetches}=await runCollector([{id:'paused',active:true,source_status:'paused',collector_type:'web'},{id:'blocked',active:true,source_status:'blacklisted',collector_type:'web'}]);
  assert.equal(fetches,0);
  assert.equal(writes.filter(w=>w.table==='cfo_news_sources'&&w.op==='update').length,0);
  assert.equal(writes.at(-1).value.sources_checked,0);
});
