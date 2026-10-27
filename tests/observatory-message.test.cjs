const test=require('node:test');
const assert=require('node:assert/strict');
const {trendState,trendMessage,validSeries}=require('../wordpress/theme/assets/js/cfo-observatoire-live.js');
test('the visual direction respects stable and missing values',()=>{
  for(const [value,state] of [[null,'missing'],['','missing'],[NaN,'missing'],[0,'neutral'],[-0.7,'neutral'],[0.99,'neutral'],[1,'up'],[-1,'down'],[4.5,'up'],[-5,'down']])assert.equal(trendState(value),state);
});
test('a message never describes missing data as stable',()=>{
  assert.match(trendMessage(null,'Audience'),/indisponible/);
  assert.match(trendMessage(4.5,'Écoutes'),/hausse modérée/);
  assert.match(trendMessage(-5,'Écoutes'),/baisse marquée/);
  assert.match(trendMessage(-0.7,'Radio'),/stabilité/);
});
test('absent chart observations are not converted to artificial zeroes',()=>{
  assert.deepEqual(validSeries([{date:'a',value:null},{date:'b',value:0},{date:'c',value:12},{value:'bad'}]),[{date:'b',value:0},{date:'c',value:12}]);
});
