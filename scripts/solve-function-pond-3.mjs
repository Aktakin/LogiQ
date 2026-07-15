/**
 * Verify Pond 3 — no predefined kernels; all hops are custom-built.
 * Run: node scripts/solve-function-pond-3.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const text = readFileSync(join(root, 'src/lib/frogFunctionPond3Levels.ts'), 'utf8');

function extractLevels(src) {
  const levels = [];
  const arr = src.slice(src.indexOf('export const frogFunctionPond3Levels'));
  const blocks = arr.split(/\{\s*\n\s*id:\s*(?=\d)/).slice(1);
  for (const block of blocks) {
    const id = +block.match(/^(\d+)/)[1];
    const name = block.match(/name:\s*'([^']*)'/)?.[1];
    const maxCommands = +block.match(/maxCommands:\s*(\d+)/)[1];
    const maxFunctionCommands = +block.match(/maxFunctionCommands:\s*(\d+)/)[1];
    const maxCustomFunctions = +(block.match(/maxCustomFunctions:\s*(\d+)/)?.[1] ?? 99);
    const dir = block.match(/robotDirection:\s*'(\w+)'/)[1];
    const pathMatch = block.match(/path:\s*\[([\s\S]*?)\],\s*\n\s*maxCommands/);
    const path = [...pathMatch[1].matchAll(/\{\s*x:\s*(\d+)\s*,\s*y:\s*(\d+)\s*\}/g)].map((m) => ({
      x: +m[1],
      y: +m[2],
    }));
    const hasPre =
      /predefinedFunctions:\s*\[[\s\S]*?fn\(/.test(block.split(/hint:/)[0] || '');
    levels.push({
      id,
      name,
      maxCommands,
      maxFunctionCommands,
      maxCustomFunctions,
      dir,
      path,
      predefined: [],
      hasPre,
    });
  }
  return levels;
}

const dirs = ['up', 'right', 'down', 'left'];
const turnLeft = (d) => dirs[(dirs.indexOf(d) + 3) % 4];
const turnRight = (d) => dirs[(dirs.indexOf(d) + 1) % 4];
function neededDir(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 1) return 'right';
  if (dx === -1) return 'left';
  if (dy === -1) return 'up';
  if (dy === 1) return 'down';
  throw new Error('bad');
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
    if (lefts <= rights) for (let k = 0; k < lefts; k++) cmds.push('left');
    else for (let k = 0; k < rights; k++) cmds.push('right');
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
    if (stack.includes(t)) throw new Error('cycle ' + t);
    if (!defs[t]) throw new Error('missing ' + t);
    out.push(...expand(defs[t], defs, [...stack, t]));
  }
  return out;
}
function usesNesting(custom) {
  for (const steps of Object.values(custom)) {
    if (steps.some((s) => s !== 'forward' && s !== 'left' && s !== 'right')) return true;
  }
  return false;
}
function check(level, custom, main) {
  if (level.hasPre) return { ok: false, reason: 'still has predefinedFunctions' };
  if (!usesNesting(custom)) return { ok: false, reason: 'solution has no nesting' };
  if (main.some((t) => t === 'forward' || t === 'left' || t === 'right')) {
    return { ok: false, reason: 'main has raw hops — must be function calls only' };
  }
  const defs = {};
  for (const [id, steps] of Object.entries(custom)) {
    if (steps.length > level.maxFunctionCommands)
      return { ok: false, reason: `${id} len ${steps.length} > ${level.maxFunctionCommands}` };
    defs[id] = steps;
  }
  if (Object.keys(custom).length > level.maxCustomFunctions)
    return { ok: false, reason: 'too many customs' };
  if (main.length > level.maxCommands) return { ok: false, reason: 'main too long' };
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
      reason: `mismatch @${i}\n  got:  ${got.join(' ')}\n  want: ${want.join(' ')}`,
    };
  }
  return { ok: true };
}

const F = 'forward';
const L = 'left';
const R = 'right';

const SOLUTIONS = {
  1: {
    custom: {
      hop2: [F, F],
      hop3: [F, F, F],
      top: ['hop2', 'hop2', R, 'hop2', L, 'hop2', 'hop2', R, 'hop2', R, 'hop3', 'hop3', L, 'hop2', L, 'hop3', 'hop2', 'hop2', R, 'hop3'],
    },
    main: ['top'],
  },
  2: {
    custom: {
      hop2: [F, F],
      hop3: [F, F, F],
      top: ['hop3', L, 'hop2', 'hop2', 'hop3', 'hop2', R, 'hop2', R, 'hop2', 'hop2', 'hop3', L, 'hop2', L, 'hop2', 'hop2', 'hop3', R, 'hop2', R, 'hop2', 'hop2', 'hop3', 'hop2'],
    },
    main: ['top'],
  },
  3: {
    custom: {
      hop3: [F, F, F],
      cross: ['hop3', 'hop3', 'hop3'],
      route: ['cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross'],
    },
    main: ['route'],
  },
  4: {
    custom: {
      hop2: [F, F],
      cross: ['hop2', 'hop2', 'hop2', 'hop2', 'hop2', F],
      route: ['cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross'],
    },
    main: ['route'],
  },
  5: {
    custom: {
      hop2: [F, F],
      hop4: ['hop2', 'hop2'],
      top: ['hop4', 'hop2', R, 'hop2', R, 'hop4', L, 'hop2', L, 'hop4', 'hop2', R, 'hop2', R, 'hop4', 'hop2', L, 'hop2', L, 'hop4', R, 'hop2', R, 'hop4', F, L, F],
    },
    main: ['top'],
  },
  6: {
    custom: {
      hop2: [F, F],
      cross: ['hop2', 'hop2', 'hop2', 'hop2', 'hop2', F],
      route: ['cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross'],
    },
    main: ['route'],
  },
  7: {
    custom: {
      hop2: [F, F],
      cross: ['hop2', 'hop2', 'hop2', 'hop2', 'hop2', 'hop2', F],
      route: ['cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross'],
    },
    main: ['route'],
  },
  8: {
    custom: {
      hop2: [F, F],
      hop4: ['hop2', 'hop2'],
      top: ['hop4', 'hop2', R, 'hop2', R, 'hop4', 'hop4', L, 'hop2', L, 'hop4', 'hop4', R, 'hop2', R, 'hop4', 'hop2', L, 'hop2', L, 'hop4', 'hop4', 'hop2', R, 'hop2', R, 'hop4', L, F],
    },
    main: ['top'],
  },
  9: {
    custom: {
      hop2: [F, F],
      cross: ['hop2', 'hop2', 'hop2', 'hop2', 'hop2', F],
      route: ['cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross'],
    },
    main: ['route'],
  },
  10: {
    custom: {
      hop2: [F, F],
      cross: ['hop2', 'hop2', 'hop2', 'hop2', 'hop2', 'hop2', F],
      route: ['cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross'],
    },
    main: ['route'],
  },
  11: {
    custom: {
      hop2: [F, F],
      cross: ['hop2', 'hop2', 'hop2', 'hop2', 'hop2', 'hop2', F],
      route: ['cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross'],
    },
    main: ['route'],
  },
  12: {
    custom: {
      hop3: [F, F, F],
      cross: ['hop3', 'hop3', 'hop3', 'hop3', 'hop3'],
      route: ['cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross'],
    },
    main: ['route'],
  },
  13: {
    custom: {
      hop2: [F, F],
      hop4: ['hop2', 'hop2'],
      top: ['hop4', 'hop4', R, 'hop2', R, 'hop4', 'hop2', L, 'hop2', L, 'hop4', 'hop4', 'hop2', R, 'hop2', R, 'hop4', 'hop4', L, 'hop2', L, 'hop4', 'hop4', 'hop4', R, 'hop2', R, 'hop4', 'hop4', 'hop2', L, F, L, 'hop4', 'hop2'],
    },
    main: ['top'],
  },
  14: {
    custom: {
      hop2: [F, F],
      cross: ['hop2', 'hop2', 'hop2', 'hop2', 'hop2', 'hop2', F],
      route: ['cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross'],
    },
    main: ['route'],
  },
  15: {
    custom: {
      hop3: [F, F, F],
      cross: ['hop3', 'hop3', 'hop3', 'hop3', 'hop3'],
      route: ['cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross', R, F, R, 'cross', L, F, L, 'cross'],
    },
    main: ['route'],
  },
};

const levels = extractLevels(text);
let fails = 0;
for (const L of levels) {
  // bump L6/L10 caps in check against file — update file if needed
  const sol = SOLUTIONS[L.id];
  if (!sol) {
    console.log(`L${L.id} MISSING`);
    fails++;
    continue;
  }
  const r = check(L, sol.custom, sol.main);
  if (r.ok) console.log(`L${L.id} ${L.name}: OK`);
  else {
    console.log(`L${L.id} ${L.name}: FAIL — ${r.reason}`);
    fails++;
  }
}
console.log(fails ? `\n${fails} failed` : '\nAll levels OK');
process.exit(fails ? 1 : 0);
