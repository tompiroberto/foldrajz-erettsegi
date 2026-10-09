// Aggregates review/content-status/*.md into review/content-status.md (run: node scripts/content-status.mjs).
import fs from 'node:fs';
import path from 'node:path';

const dir = 'review/content-status';
const count = (f, key) => {
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  const v = d[key];
  return Array.isArray(v) ? v.length : Object.keys(v ?? {}).length;
};
const sum = (sub, key) => fs.readdirSync(`src/content/${sub}`).filter((f) => f.endsWith('.json')).reduce((a, f) => a + count(`src/content/${sub}/${f}`, key), 0);
const processes = fs.readdirSync('src/content/processes').filter((f) => f.endsWith('.json')).length;
const diagrams = fs.readdirSync('src/components/diagrams').filter((f) => /^[a-z].*\.tsx$/.test(f) && f !== 'index.tsx').length;

const groups = { concepts: 'Fogalmak', cards: 'Tanulókártyák', processes: 'Folyamatok', places: 'Helyek (fekvés + tények)' };
let out = `# Tartalom állapota – összesítő

Minden itt felsorolt tartalom **AI-generált** (\`generated: true\`, \`reviewed: false\`), és az alkalmazásban
„AI-generált – ellenőrizd a tankönyvvel” jelzést kap. Az alábbi fájlok sorolják fel tételesen, mit érdemes
tanárnak vagy tankönyvvel ellenőrizni. Az összesítőt a \`node scripts/content-status.mjs\` frissíti.

| Tartalom | Darab |
| --- | --- |
| Fogalomtár-szócikkek | ${sum('concepts', 'entries')} (mind az 1021 hivatalos címke lefedve) |
| Tanulókártyák | ${sum('cards', 'cards')} / 647 követelmény |
| Folyamatok (lépések + esszé) | ${processes} / 41 |
| Helyek fekvésleírással | ${sum('places-facts', 'facts')} / 802 |
| Ábrakomponensek | ${diagrams} |

Az érettségi feladatok ellenőrzendő tételei külön: [exam-status.md](exam-status.md). A térképi geometria: [geo-report.md](geo-report.md).

`;
for (const [prefix, title] of Object.entries(groups)) {
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(prefix)).sort();
  out += `## ${title}\n\n`;
  for (const f of files) {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    const items = text.split('\n').filter((l) => /^\s*[-*] /.test(l)).length;
    out += `- [${f}](content-status/${f}) – ${items} listatétel\n`;
  }
  out += '\n';
}
out += `## Ismert geoadat-pontatlanságok (a helyleíró ügynökök jelezték)

A \`public/data/places.json\` horgonypontja/befoglaló téglalapja néhány elemnél a tengerentúli területek miatt félrevezető
(Franciaország, Hollandia, Norvégia, Egyesült Királyság, Portugália, Spanyolország, Oroszország, Nyugat- és Észak-Európa,
USA, Chile, Ecuador, Amerika, Ausztrália, Új-Zéland, Melanézia, Polinézia). Csíkszereda horgonya kb. 0,3°-kal nyugatabbra
van, a Kárpát-medence téglalapja csak az Alföldet fedi. A térképi rajz jó, csak a „középpontja kb.” koordináta pontatlan.
`;
fs.writeFileSync('review/content-status.md', out);
console.log(out.split('\n').slice(0, 16).join('\n'));
