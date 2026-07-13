import { LEVELS } from '../src/lib/underOneConditionLevels.ts';
import { resolveBlockAction } from '../src/lib/underOneConditionEngine.ts';

function mk(t) {
  return { id: 'x', templateId: t };
}

function solve(level, maxLen) {
  function run(prog) {
    let s = { pos: { ...level.start }, dir: level.direction };
    for (const b of prog) {
      const r = resolveBlockAction(level, b, s);
      if (!r) continue;
      if (r.result === 'trap') return false;
      if (r.result === 'win') return true;
      const l = r.states[r.states.length - 1];
      s = { pos: l.pos, dir: l.dir };
    }
    return s.pos.x === level.goal.x && s.pos.y === level.goal.y;
  }
  function search(prog) {
    if (prog.length > maxLen) return null;
    if (run(prog)) return prog;
    for (const b of level.palette) {
      if (b.startsWith('call_')) continue;
      const f = search([...prog, mk(b)]);
      if (f) return f;
    }
    return null;
  }
  return search([]);
}

for (const id of [2, 5, 7, 10, 16, 20]) {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) continue;
  const sol = solve(level, level.maxBlocks);
  console.log(
    `L${id}`,
    level.pathWays ?? '-',
    `max=${level.maxBlocks}`,
    sol ? `OK ${sol.length}b` : 'FAIL',
    level.subtitle.slice(0, 50),
  );
}
