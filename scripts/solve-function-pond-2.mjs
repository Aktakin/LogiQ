/**
 * Verified solutions for Frog Function Pond 2.
 * Run: node scripts/solve-function-pond-2.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const text = readFileSync(join(root, 'src/lib/frogFunctionPond2Levels.ts'), 'utf8');

function extractLevels(src) {
  const levels = [];
  const arr = src.slice(src.indexOf('export const frogFunctionPond2Levels'));
  const blocks = arr.split(/\{\s*\n\s*id:\s*(?=\d)/).slice(1);
  for (const block of blocks) {
    const id = +block.match(/^(\d+)/)[1];
    const name = block.match(/name:\s*'([^']*)'/)?.[1];
    const maxCommands = +block.match(/maxCommands:\s*(\d+)/)[1];
    const maxFunctionCommands = +block.match(/maxFunctionCommands:\s*(\d+)/)[1];
    const maxCustomFunctions = +(block.match(/maxCustomFunctions:\s*(\d+)/)?.[1] ?? 99);
    const sm = block.match(/robotStart:\s*\{\s*x:\s*(\d+)\s*,\s*y:\s*(\d+)/);
    const dir = block.match(/robotDirection:\s*'(\w+)'/)[1];
    const pathMatch = block.match(/path:\s*\[([\s\S]*?)\],\s*\n\s*maxCommands/);
    const path = [...pathMatch[1].matchAll(/\{\s*x:\s*(\d+)\s*,\s*y:\s*(\d+)\s*\}/g)].map((m) => ({
      x: +m[1],
      y: +m[2],
    }));
    const predefined = [];
    const pf = block.match(/predefinedFunctions:\s*\[([\s\S]*?)\],\s*\n\s*(?:hint|tutorial)/);
    if (pf) {
      for (const m of pf[1].matchAll(/fn\('([^']+)',\s*'([^']+)',[^,]+,[^,]+,\s*\[([^\]]*)\]\)/g)) {
        const commands = [...m[3].matchAll(/'(\w+)'/g)].map((x) => x[1]);
        predefined.push({ id: m[1], name: m[2], commands });
      }
    }
    levels.push({
      id,
      name,
      maxCommands,
      maxFunctionCommands,
      maxCustomFunctions,
      dir,
      path,
      predefined,
    });
  }
  return levels;
}

const dirs = ['up', 'right', 'down', 'left'];
function turnLeft(d) {
  return dirs[(dirs.indexOf(d) + 3) % 4];
}
function turnRight(d) {
  return dirs[(dirs.indexOf(d) + 1) % 4];
}
function neededDir(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 1) return 'right';
  if (dx === -1) return 'left';
  if (dy === -1) return 'up';
  if (dy === 1) return 'down';
  throw new Error('bad step');
}

function pathToBase(level) {
  let dir = level.dir;
  const cmds = [];
  for (let i = 1; i < level.path.length; i++) {
    const from = level.path[i - 1];
    const to = level.path[i];
    const want = neededDir(from, to);
    let d = dir;
    let lefts = 0;
    while (d !== want) {
      d = turnLeft(d);
      lefts++;
    }
    d = dir;
    let rights = 0;
    while (d !== want) {
      d = turnRight(d);
      rights++;
    }
    if (lefts <= rights) {
      for (let k = 0; k < lefts; k++) cmds.push('left');
    } else {
      for (let k = 0; k < rights; k++) cmds.push('right');
    }
    dir = want;
    cmds.push('forward');
  }
  return cmds;
}

function expand(tokens, defs, stack = []) {
  const out = [];
  for (const t of tokens) {
    if (t === 'forward' || t === 'left' || t === 'right') {
      out.push(t);
      continue;
    }
    if (stack.includes(t)) throw new Error(`cycle ${t}`);
    const def = defs[t];
    if (!def) throw new Error(`missing ${t}`);
    out.push(...expand(def, defs, [...stack, t]));
  }
  return out;
}

function checkSolution(level, customFns, main) {
  const defs = {};
  for (const p of level.predefined) defs[p.id] = p.commands;
  for (const [id, steps] of Object.entries(customFns)) {
    if (steps.length > level.maxFunctionCommands) {
      return { ok: false, reason: `${id} has ${steps.length} > maxFn ${level.maxFunctionCommands}` };
    }
    defs[id] = steps;
  }
  if (Object.keys(customFns).length > level.maxCustomFunctions) {
    return { ok: false, reason: 'too many custom fns' };
  }
  if (main.length > level.maxCommands) {
    return { ok: false, reason: `main ${main.length} > ${level.maxCommands}` };
  }
  const want = pathToBase(level);
  let got;
  try {
    got = expand(main, defs);
  } catch (e) {
    return { ok: false, reason: String(e.message || e) };
  }
  if (got.length !== want.length || got.some((c, i) => c !== want[i])) {
    let i = 0;
    while (i < Math.min(got.length, want.length) && got[i] === want[i]) i++;
    return {
      ok: false,
      reason: `mismatch @${i} got=${got.length} want=${want.length}\n  got:  ${got.join(' ')}\n  want: ${want.join(' ')}`,
    };
  }
  return { ok: true };
}

const F = 'forward';
const L = 'left';
const R = 'right';

const SOLUTIONS = {
  1: {
    custom: {},
    main: ['hop2', 'hop2', F],
  },
  2: {
    custom: {
      twin: ['zig', 'zig'],
      last: [F, R, F],
    },
    main: ['twin', 'zig', 'last'],
  },
  3: {
    custom: {
      elbow: ['hop3', L, F, R],
      climb: ['hop3', F, F],
    },
    main: ['elbow', 'hop3', L, 'climb'],
  },
  4: {
    custom: {
      hop3: [F, F, F],
      hall: ['hop3', L, 'hop3'],
      exit: [R, 'hop3', L, F],
    },
    main: ['hall', R, F, L, 'hop3', 'exit'],
  },
  5: {
    custom: {
      climb: ['zig', 'zig', F, F],
      jog: [R, F, F, L],
    },
    main: ['climb', 'jog', F, R, F],
  },
  6: {
    custom: {
      rise: [F, F, L, 'hop3'],
      drop: [R, 'hop3', L, F, F],
    },
    main: ['rise', R, 'hop3', 'drop'],
  },
  7: {
    custom: {
      A: [F, L, 'hop2', R, 'hop2'],
      B: [R, 'hop2', L],
      C: ['hop2', F, L],
      climb: ['hop2', 'hop2', 'hop2', F, R],
    },
    main: ['A', 'B', 'C', 'climb', F],
  },
  8: {
    // First corridor is 3 hops (not hop4). hop4 unused is fine.
    custom: {
      hop3: [F, F, F],
      side: [R, F, F, L],
      end: [F, R, 'hop3'],
    },
    main: ['hop3', 'side', 'hop3', 'side', 'end'],
  },
  9: {
    custom: {
      A: [F, L, 'hop2', R, 'hop2'],
      B: [R, 'hop2', L, 'hop2'],
      C: [L, 'hop2', F, R, F],
    },
    main: ['A', 'B', 'C', 'C'],
  },
  10: {
    custom: {
      hall: ['hop2', F, L, 'hop2', F],
      mid: [R, F, L, 'hop2', F],
      end: [R, 'hop2', F, L, 'hop2'],
    },
    main: ['hall', 'mid', 'end', R, F],
  },
  11: {
    custom: {
      PQ: [F, R, F, R, 'hop2'],
      S: ['hop2', F, L, F],
      end: [L, 'hop2', 'hop2', R, F],
      V: [R, 'hop2', 'hop2', 'hop1'],
    },
    main: ['PQ', R, 'hop2', R, 'S', 'end', 'V'],
  },
  12: {
    custom: {
      lane: [L, 'hop3', F, R, F],
    },
    main: ['hop3', 'lane'],
  },
  13: {
    custom: {
      cross: ['hop5', 'hop2', 'hop2'],
      pivL: [L, F, L],
      pivR: [R, F, R],
      pair: ['cross', 'pivL', 'cross', 'pivR'],
      route: ['pair', 'pair', 'cross', 'pivL', 'cross'],
    },
    main: ['route'],
  },
  14: {
    custom: {
      climb4: ['hop2', 'hop2'],
      jog: [R, 'hop2', L],
      mid: [R, 'hop2', R, 'hop3', 'hop3'],
      finish: [L, 'hop2', L, 'hop3', 'hop2', 'hop2'],
      route: ['climb4', 'jog', 'climb4', 'mid', 'finish'],
    },
    main: ['route', R, 'hop3'],
  },
  15: {
    // leg7 reused for both down7 and up7 (same body)
    custom: {
      up9: ['hop4', 'hop3', 'hop2'],
      leg7: ['hop4', 'hop3'],
      start: ['hop3', L, 'up9', R, 'hop2', R],
      mid: ['leg7', L, 'hop2', L, 'leg7'],
      end: [R, 'hop2', R, 'up9'],
    },
    main: ['start', 'mid', 'end'],
  },
};

const levels = extractLevels(text);
let fails = 0;

for (const L of levels) {
  const sol = SOLUTIONS[L.id];
  if (!sol) {
    console.log(`L${L.id} ${L.name}: MISSING`);
    fails++;
    continue;
  }
  const r = checkSolution(L, sol.custom, sol.main);
  if (r.ok) {
    console.log(`L${L.id} ${L.name}: OK`);
    for (const [id, steps] of Object.entries(sol.custom)) {
      console.log(`  ${id}: [${steps.join(', ')}]`);
    }
    console.log(`  MAIN: [${sol.main.join(', ')}]\n`);
  } else {
    console.log(`L${L.id} ${L.name}: FAIL — ${r.reason}\n`);
    fails++;
  }
}

console.log(fails ? `${fails} failed` : 'All 15 OK');
process.exit(fails ? 1 : 0);
