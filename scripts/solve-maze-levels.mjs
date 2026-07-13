import { LEVELS } from '../src/lib/underOneConditionLevels.ts';
import { expandProgram, resolveBlockAction } from '../src/lib/underOneConditionEngine.ts';

const BLOCKS = ['hop', 'if_path', 'if_path_else', 'call_routine_a', 'call_routine_b'];

function mk(id, extra = {}) {
  return { id: Math.random().toString(36).slice(2), templateId: id, ...extra };
}

function run(level, program, routineA = [], routineB = []) {
  const steps = expandProgram(program, routineA.length ? routineA : null, routineB.length ? routineB : null);
  let state = { pos: { ...level.start }, dir: level.direction };
  for (const { block } of steps) {
    const r = resolveBlockAction(level, block, state);
    if (!r) continue;
    if (r.result === 'trap') return 'trap';
    if (r.result === 'win') return 'win';
    if (r.result === 'stuck') return 'stuck';
    if (r.states.length) {
      const last = r.states[r.states.length - 1];
      state = { pos: { ...last.pos }, dir: last.dir };
    }
  }
  if (state.pos.x === level.goal.x && state.pos.y === level.goal.y) return 'win';
  return `miss ${state.pos.x},${state.pos.y}`;
}

function tryProgram(level, program, ra = [], rb = []) {
  return run(level, program, ra, rb) === 'win';
}

// Brute-force short programs of hops + if_path_else
function solveLevel(level, maxLen = 14) {
  const palette = level.palette.filter((b) => BLOCKS.includes(b));
  if (!palette.length) return null;

  function search(prog) {
    if (prog.length > maxLen) return null;
    if (tryProgram(level, prog)) return prog;
    for (const b of palette) {
      const found = search([...prog, mk(b)]);
      if (found) return found;
    }
    return null;
  }
  return search([]);
}

for (const level of LEVELS) {
  const forks = level.grid.flat().filter((c) => c === 'fork').length;
  const sol = solveLevel(level);
  console.log(
    level.id,
    level.name,
    forks ? 'FORK!' : 'ok',
    sol ? `SOLVED ${sol.length} blocks: ${sol.map((b) => b.templateId).join(',')}` : 'NO SOLUTION',
  );
}
