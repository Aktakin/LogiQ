import { buildMultiPathMaze, printMaze } from '../src/lib/mazeBuilder.ts';
import { resolveBlockAction } from '../src/lib/underOneConditionEngine.ts';

const spec = {
  width: 15, height: 12, startX: 7, goalX: 7, spineX: 7,
  branches: [
    { side: 'left', splitY: 8, col: 2, detour: 3 },
    { side: 'right', splitY: 5, col: 12, detour: 0 },
  ],
};
const grid = buildMultiPathMaze(spec);
printMaze(grid);
const lv = { grid, start: { x: 7, y: 11 }, goal: { x: 7, y: 0 }, direction: 'up' };

function run(prog) {
  let s = { pos: lv.start, dir: 'up' };
  for (const t of prog) {
    const r = resolveBlockAction(lv, { id: '1', templateId: t }, s);
    const l = r.states[r.states.length - 1];
    s = { pos: l.pos, dir: l.dir };
    if (r.result === 'win') return 'win';
  }
  return s.pos.x === 7 && s.pos.y === 0 ? 'win' : `miss ${s.pos.x},${s.pos.y}`;
}

console.log('short', run(['hop','hop','hop','hop','hop','hop','if_path_else','if_path_else']));
console.log('long', run(['hop','hop','if_path_else','if_path_else','if_path_else','if_path_else','if_path_else','if_path_else','if_path_else','if_path_else']));
