import { LEVELS } from '../src/lib/underOneConditionLevels.ts';
import { expandProgram, resolveBlockAction } from '../src/lib/underOneConditionEngine.ts';

function mk(id, n = 1, extra = {}) {
  return Array.from({ length: n }, (_, i) => ({ id: `b${i}`, templateId: id, ...extra }));
}

function run(level, program, routineA = [], routineB = []) {
  const steps = expandProgram(
    program,
    routineA.length ? routineA : null,
    routineB.length ? routineB : null,
  );
  let state = { pos: { ...level.start }, dir: level.direction };
  for (const { block } of steps) {
    const r = resolveBlockAction(level, block, state);
    if (!r) continue;
    if (r.result === 'trap') return { ok: false, why: 'trap', pos: state.pos };
    if (r.result === 'win') return { ok: true, pos: state.pos };
    if (r.result === 'stuck') return { ok: false, why: 'stuck', pos: state.pos };
    if (r.states.length) {
      const last = r.states[r.states.length - 1];
      state = { pos: { ...last.pos }, dir: last.dir };
    }
  }
  if (state.pos.x === level.goal.x && state.pos.y === level.goal.y) return { ok: true, pos: state.pos };
  return { ok: false, why: 'miss', pos: state.pos };
}

const tests = process.argv[2] ? JSON.parse(process.argv[2]) : [];

if (tests.length === 0) {
  console.log('LEVELS count:', LEVELS.length);
  for (const lv of LEVELS) {
    const forks = lv.grid.flat().filter((c) => c === 'fork').length;
    console.log(`${lv.id}. ${lv.name} — forks:${forks} challenge:${!!lv.challenge} routines:${!!lv.routinesEnabled}`);
  }
} else {
  for (const [id, prog, ra, rb] of tests) {
    const level = LEVELS.find((l) => l.id === id);
    console.log(id, level?.name, run(level, prog, ra ?? [], rb ?? []));
  }
}
