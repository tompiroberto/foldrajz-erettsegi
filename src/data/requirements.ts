import raw from '../../starter-data/requirements.json';
import type { Level, Objective, RequirementGroup, RequirementsFile } from './types';
import { slugify } from '@/lib/slug';

const file = raw as RequirementsFile;
export const TOPICS: Record<number, string> = Object.fromEntries(
  Object.entries(file.topics).map(([k, v]) => [Number(k), v]),
);

export interface Subtopic {
  id: string;
  topicNo: number;
  /** e.g. "3.1.2. A kőzetlemezek és mozgásaik következményei" or "Németország". */
  title: string;
  /** Enclosing heading for un-numbered country/region blocks, e.g. "8.4.1. Európa magterülete". */
  parents: string[];
  objectives: Objective[];
}

/**
 * The PDF extraction split two subtopic titles and two sentences across a page break
 * ("6.1. A" + "nemzetgazdaságok és a világgazdaság", "10.5. … a globális" + "béke fenntartása").
 * Merge them back; nothing is added that is not in the source.
 */
function repair(groups: RequirementGroup[]): RequirementGroup[] {
  const out: RequirementGroup[] = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i]!;
    const next = groups[i + 1];
    const brokenTitle = /\b(A|a globális)$/.test(g.subtopic) && next && !/^\d/.test(next.subtopic);
    if (brokenTitle && next) {
      const join = (a: string[], b: string[]) => {
        const res = [...a];
        const rest = [...b];
        const last = res[res.length - 1];
        // A sentence without a final period continues with the first fragment of the next block.
        if (last && !/[.!?]$/.test(last) && rest[0] && /^[a-zá-ű]/.test(rest[0])) {
          res[res.length - 1] = `${last} ${rest.shift()}`;
        }
        return [...res, ...rest];
      };
      out.push({
        topicNo: g.topicNo,
        subtopic: `${g.subtopic} ${next.subtopic}`,
        kozep: [...g.kozep, ...next.kozep],
        emelt: join(g.emelt, next.emelt),
      });
      i++;
    } else out.push(g);
  }
  return out;
}

const numDepth = (t: string) => (t.match(/^(\d+(?:\.\d+)*)\.?\s/)?.[1]?.split('.').length ?? 0);

export const SUBTOPICS: Subtopic[] = (() => {
  const res: Subtopic[] = [];
  const stack: string[] = []; // numbered headings without own objectives
  for (const g of repair(file.requirements)) {
    const depth = numDepth(g.subtopic);
    const empty = g.kozep.length === 0 && g.emelt.length === 0;
    if (depth > 0) {
      // Drop headings at the same or deeper level.
      while (stack.length && numDepth(stack[stack.length - 1]!) >= depth) stack.pop();
    }
    // Numbered subtopics hang under headings whose number is their prefix (3.1 → 3.1.2);
    // un-numbered blocks (e.g. "Olaszország") hang under every open heading.
    const parents = depth > 0 ? stack.filter((p) => g.subtopic.startsWith(p.split(' ')[0]!)) : [...stack];
    if (depth > 0) stack.push(g.subtopic);
    if (empty) continue;
    const id = slugify(g.subtopic);
    const mk = (level: Level) => (text: string, i: number): Objective => ({
      id: `${id}--${level === 'kozep' ? 'k' : 'e'}${i + 1}`,
      topicNo: g.topicNo,
      subtopic: g.subtopic,
      subtopicId: id,
      level,
      text,
    });
    res.push({
      id,
      topicNo: g.topicNo,
      title: g.subtopic,
      parents,
      objectives: [...g.kozep.map(mk('kozep')), ...g.emelt.map(mk('emelt'))],
    });
  }
  return res;
})();

export const OBJECTIVES: Objective[] = SUBTOPICS.flatMap((s) => s.objectives);

export const SUBTOPIC_BY_ID = new Map(SUBTOPICS.map((s) => [s.id, s]));
