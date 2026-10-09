const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the actual collector predicate without fetching feeds or writing data.
const source = fs.readFileSync(path.join(__dirname, '../supabase/functions/cfo-news-collector/index.ts'), 'utf8');
const directTerms = source.match(/^const directTerms = .*;$/m)?.[0];
const normalize = source.match(/^function normalize\(s:string\)\{.*\}$/m)?.[0];
const predicate = source.match(/^function relevant\(title:string,description:string\)\{.*\}$/m)?.[0];
assert.ok(directTerms && normalize && predicate, 'Collector relevance predicate must be found');
const relevant = vm.runInNewContext(
  `${directTerms}\n${normalize.replace('(s:string)', '(s)')}\n${predicate.replace('(title:string,description:string)', '(title,description)')}\nrelevant`
);
const cases = [
  ['Marine Lorphelin donne de ses nouvelles', '', false],
  ['Marine Le Pen annonce une nouvelle campagne', '', false],
  ['Marine Tondelier invitée à la télévision', '', false],
  ['La Marine nationale ouvre ses portes', '', false],
  ['Marine dévoile Tricheur', '', true],
  ['Marine Delplace invitée de la Star Academy', '', true],
  ['Marine Delplace rencontre Marine Lorphelin', '', true],
  ['MARINE-LORPHELIN hospitalisée', '', false],
  ['Star Academy : voici les 17 nouveaux élèves', 'La nouvelle promotion entre au château.', false],
  ['Vianney annonce son nouvel album', 'Il sera parrain de la Star Academy.', false],
  ['La gagnante prépare sa tournée', 'Marine Delplace sera sur scène.', true],
  ['Un nouveau clip pour Cœur maladroit', '', true],
];
for (const [title, description, expected] of cases) assert.equal(relevant(title, description), expected, title);
console.log(`${cases.length} relevance cases passed`);
