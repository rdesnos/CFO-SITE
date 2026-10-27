const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

// Exercise the actual collector predicate without fetching feeds or writing data.
const source = fs.readFileSync(path.join(__dirname, '../supabase/functions/cfo-news-collector/index.ts'), 'utf8');
const executable = stripTypeScriptTypes(source).replace(/^import .*;$/gm, '');
const relevant = vm.runInNewContext(executable+'\nrelevant', {
  Deno:{env:{get:()=>''},serve:()=>{}},createClient:()=>({}),
});
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

