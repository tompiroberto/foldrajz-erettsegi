import fs from 'node:fs';
import { NAME_MAP } from '../name-map.ts';
const ids = [...fs.readFileSync(process.argv[2]!, 'utf8').matchAll(/^ {2}- (\S+)/gm)].map((m) => m[1]!);
const manual = ids.filter((id) => NAME_MAP[id]?.rule.src === 'manual');
const failed = ids.filter((id) => NAME_MAP[id] && NAME_MAP[id]!.rule.src !== 'manual');
const none = ids.filter((id) => !NAME_MAP[id]);
console.log(`manual ${manual.length}, rule failed ${failed.length}, no rule ${none.length}`);
console.log('--- FAILED:\n' + failed.map((id) => `${id}  ${JSON.stringify(NAME_MAP[id]!.rule)}`).join('\n'));
console.log('--- NO RULE:\n' + none.join('\n'));
