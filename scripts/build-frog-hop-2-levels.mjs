/**
 * Build levels: main spine P (unique geodesic) + optional detour between P[i] and P[j] (longer).
 */
function bfsShortestWays(n, S, G, obsSet) {
  function neigh(x, y) {
    const o = [];
    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || nx >= n || ny < 0 || ny >= n) continue;
      if (obsSet.has(`${nx},${ny}`)) continue;
      o.push([nx, ny]);
    }
    return o;
  }
  const dist = new Map();
  const ways = new Map();
  const sk = `${S.x},${S.y}`;
  dist.set(sk, 0);
  ways.set(sk, 1);
  const q = [[S.x, S.y]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    const d = dist.get(`${x},${y}`);
    for (const [nx, ny] of neigh(x, y)) {
      const k = `${nx},${ny}`;
      if (!dist.has(k)) {
        dist.set(k, d + 1);
        ways.set(k, ways.get(`${x},${y}`));
        q.push([nx, ny]);
      } else if (dist.get(k) === d + 1) {
        ways.set(k, ways.get(k) + ways.get(`${x},${y}`));
      }
    }
  }
  const gk = `${G.x},${G.y}`;
  return { D: dist.get(gk), ways: ways.get(gk) ?? 0, ok: dist.has(gk) };
}

function countSimplePathsByLen(n, S, G, obsSet, maxLen, visitCap = 250000) {
  function neigh(x, y) {
    const o = [];
    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || nx >= n || ny < 0 || ny >= n) continue;
      if (obsSet.has(`${nx},${ny}`)) continue;
      o.push([nx, ny]);
    }
    return o;
  }
  const counts = {};
  let visits = 0;
  function dfs(x, y, len, vis) {
    if (len > maxLen) return;
    if (visits++ > visitCap) return;
    const k = `${x},${y}`;
    if (vis.has(k)) return;
    if (x === G.x && y === G.y) {
      counts[len] = (counts[len] || 0) + 1;
      return;
    }
    vis.add(k);
    for (const [nx, ny] of neigh(x, y)) dfs(nx, ny, len + 1, vis);
    vis.delete(k);
  }
  dfs(S.x, S.y, 0, new Set());
  return counts;
}

function obstaclesFromFree(n, freeSet) {
  const obs = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (!freeSet.has(`${x},${y}`)) obs.push({ x, y });
    }
  return obs;
}

/** L-shape spine: bottom edge then right edge, S bottom-left inner, G top-right inner */
function spineL(n) {
  const S = { x: 1, y: n - 2 };
  const G = { x: n - 2, y: 1 };
  const cells = [];
  let x = S.x,
    y = S.y;
  cells.push([x, y]);
  while (x < n - 2) {
    x++;
    cells.push([x, y]);
  }
  while (y > 1) {
    y--;
    cells.push([x, y]);
  }
  return { S, G, cells };
}

/** Mirrored L: up along right inner column, then left along top — S bottom-right, G top-left */
function spineRL(n) {
  const S = { x: n - 2, y: n - 2 };
  const G = { x: 1, y: 1 };
  const cells = [];
  let x = S.x,
    y = S.y;
  cells.push([x, y]);
  while (y > 1) {
    y--;
    cells.push([x, y]);
  }
  while (x > 1) {
    x--;
    cells.push([x, y]);
  }
  return { S, G, cells };
}

/** Detour below a horizontal segment of spine: P[i]..P[j] on same y, dip south and return */
function detourUnderHorizontal(P, i, j) {
  const [ax, ay] = P[i];
  const [bx, by] = P[j];
  if (ay !== by) throw new Error('not horizontal');
  const yLow = ay + 1;
  const x0 = Math.min(ax, bx);
  const x1 = Math.max(ax, bx);
  const extra = [];
  for (let x = x0; x <= x1; x++) extra.push([x, yLow]);
  return extra.filter(([x, y]) => !P.some(([px, py]) => px === x && py === y));
}

/** Detour west of a vertical segment (same x), one column left */
function detourWestOfVertical(P, i, j) {
  const [vx, ay] = P[i];
  const [vx2, by] = P[j];
  if (vx !== vx2) throw new Error('not vertical');
  const y0 = Math.min(ay, by);
  const y1 = Math.max(ay, by);
  const extra = [];
  for (let y = y0; y <= y1; y++) extra.push([vx - 1, y]);
  return extra.filter(([x, y]) => !P.some(([px, py]) => px === x && py === y));
}

/** Dead-end nubs (1–2 cells) off spine, never touching another free except one spine cell */
function deadNubs(P, n, count) {
  const spineSet = new Set(P.map(([x, y]) => `${x},${y}`));
  const extra = [];
  const dirs = [
    [0, 1],
    [0, -1],
    [-1, 0],
    [1, 0],
  ];
  let added = 0;
  for (let t = 2; t < P.length - 2 && added < count; t += 3) {
    const [x, y] = P[t];
    for (const [dx, dy] of dirs) {
      if (added >= count) break;
      const x1 = x + dx,
        y1 = y + dy;
      if (x1 < 1 || x1 >= n - 1 || y1 < 1 || y1 >= n - 1) continue;
      if (spineSet.has(`${x1},${y1}`)) continue;
      const x2 = x1 + dx,
        y2 = y1 + dy;
      if (x2 < 1 || x2 >= n - 1 || y2 < 1 || y2 >= n - 1) continue;
      if (spineSet.has(`${x2},${y2}`)) continue;
      // block accidental merge: x2,y2 must not be 4-neighbor of any spine except x1,y1's connection
      let bad = false;
      for (const [sx, sy] of P) {
        if (Math.abs(sx - x2) + Math.abs(sy - y2) === 1 && !(sx === x && sy === y)) bad = true;
      }
      if (bad) continue;
      extra.push([x1, y1], [x2, y2]);
      spineSet.add(`${x1},${y1}`);
      spineSet.add(`${x2},${y2}`);
      added++;
    }
  }
  return extra;
}

function level1WidenAisles(n, mode, free) {
  if (n !== 11 || mode !== 'L') return;
  const b = n - 2;
  const stubs = [
    [2, b - 1],
    [3, b - 1],
    [4, b - 1],
    [5, b - 1],
    [6, b - 1],
    [7, b - 1],
    [2, b - 2],
    [6, b - 2],
    [3, b - 3],
    [5, b - 3],
  ];
  for (const [x, y] of stubs) free.add(`${x},${y}`);
  for (const y of [2, 4, 6]) free.add(`8,${y}`);
}

function buildLevel(n, withDetour, nubs, mode = 'L', levelIndex = 0) {
  const effectiveNubs = levelIndex === 0 ? Math.min(nubs, 1) : nubs;
  const { S, G, cells: P } = mode === 'RL' ? spineRL(n) : spineL(n);
  const free = new Set(P.map(([x, y]) => `${x},${y}`));
  if (withDetour) {
    if (mode === 'L') {
      const bottomY = n - 2;
      const idx = [];
      for (let k = 0; k < P.length; k++) if (P[k][1] === bottomY) idx.push(k);
      const i = idx[Math.max(1, Math.floor(idx.length / 4))];
      const j = idx[Math.min(idx.length - 2, Math.floor((3 * idx.length) / 4))];
      if (j > i + 2) {
        detourUnderHorizontal(P, i, j).forEach(([x, y]) => free.add(`${x},${y}`));
      }
    } else {
      const rightX = n - 2;
      const idx = [];
      for (let k = 0; k < P.length; k++) if (P[k][0] === rightX && P[k][1] < n - 2) idx.push(k);
      if (idx.length > 4) {
        const i = idx[Math.max(1, Math.floor(idx.length / 5))];
        const j = idx[Math.min(idx.length - 2, Math.floor((4 * idx.length) / 5))];
        if (j > i + 2) {
          detourWestOfVertical(P, i, j).forEach(([x, y]) => free.add(`${x},${y}`));
        }
      }
    }
  }
  deadNubs(P, n, effectiveNubs).forEach(([x, y]) => free.add(`${x},${y}`));
  if (levelIndex === 0) level1WidenAisles(n, mode, free);
  const obs = obstaclesFromFree(n, free);
  const ks = new Set(obs.map((p) => `${p.x},${p.y}`));
  return { S, G, obs, P, ks };
}

function firstStepDir(S, G, ks, n) {
  const parent = new Map();
  const dist = new Map();
  const sk = `${S.x},${S.y}`;
  dist.set(sk, 0);
  const q = [[S.x, S.y]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    const d = dist.get(`${x},${y}`);
    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || nx >= n || ny < 0 || ny >= n) continue;
      if (ks.has(`${nx},${ny}`)) continue;
      const k = `${nx},${ny}`;
      if (!dist.has(k)) {
        dist.set(k, d + 1);
        parent.set(k, `${x},${y}`);
        q.push([nx, ny]);
      }
    }
  }
  let cur = `${G.x},${G.y}`;
  let prev = parent.get(cur);
  const root = sk;
  while (prev && prev !== root) {
    cur = prev;
    prev = parent.get(cur);
  }
  const [fx, fy] = cur.split(',').map(Number);
  if (fx > S.x) return 'right';
  if (fx < S.x) return 'left';
  if (fy < S.y) return 'up';
  return 'down';
}

const specs = [
  { n: 11, detour: true, nubs: 1, mode: 'L' },
  { n: 12, detour: true, nubs: 5, mode: 'L' },
  { n: 13, detour: true, nubs: 6, mode: 'L' },
  { n: 14, detour: true, nubs: 7, mode: 'L' },
  { n: 14, detour: true, nubs: 8, mode: 'RL' },
  { n: 15, detour: true, nubs: 9, mode: 'L' },
  { n: 16, detour: true, nubs: 10, mode: 'L' },
  { n: 16, detour: true, nubs: 12, mode: 'RL' },
];

const out = [];
specs.forEach((s, levelIndex) => {
  const { S, G, obs, ks } = buildLevel(s.n, s.detour, s.nubs, s.mode, levelIndex);
  const { D, ways, ok } = bfsShortestWays(s.n, S, G, ks);
  const counts = countSimplePathsByLen(s.n, S, G, ks, (D || 0) + 40);
  const longer = Object.keys(counts).some((k) => Number(k) > D && counts[k] > 0);
  const dir = ok ? firstStepDir(S, G, ks, s.n) : '?';
  console.log({ n: s.n, D, ways, ok, longer, dir, obs: obs.length });
  out.push({ n: s.n, S, G, obs, D, ways, dir, longer, ok });
});

if (out.some((l) => !l.ok || l.ways !== 1 || !l.longer)) {
  console.error('VALIDATION FAILED');
  process.exit(1);
}

console.log('ALL OK');
console.log(JSON.stringify(out.map((l) => ({ n: l.n, S: l.S, G: l.G, obsLen: l.obs.length, D: l.D, dir: l.dir }))));
