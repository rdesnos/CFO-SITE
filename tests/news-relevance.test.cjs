const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the actual collector predicate without fetching feeds or writing data.
const source = fs.readFileSync(path.join(__dirname, '../supabase/functions/cfo-news-collector/index.ts'), 'utf8');
const terms = source.match(/^const terms = .*;$/m)?.[0];
const predicate = source.match(/^function relevant\(s:string\)\{.*\}$/m)?.[0];
assert.ok(terms && predicate, 'Collector relevance predicate must be found');
const relevant = vm.runInNewContext(`${terms}\n${predicate.replace('(s:string)', '(s)')}\nrelevant`);
const cases = [
  ['Marine Lorphelin donne de ses nouvelles', false],
  ['Marine Le Pen annonce une nouvelle campagne', false],
  ['Marine Tondelier invitée à la télévision', false],
  ['La Marine nationale ouvre ses portes', false],
  ['Marine dévoile Tricheur', true],
  ['Marine Delplace invitée de la Star Academy', true],
  ['Marine Delplace rencontre Marine Lorphelin', true],
  ['MARINE-LORPHELIN hospitalisée', false],
];
for (const [title, expected] of cases) assert.equal(relevant(title), expected, title);
console.log(`${cases.length} relevance cases passed`);
