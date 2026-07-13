export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface FrogHopQuest2Level {
  id: number;
  name: string;
  gridSize: number;
  frogStart: Position;
  frogDirection: Direction;
  goal: Position;
  obstacles: Position[];
  path: Position[];
  maxCommands: number;
  hint: string;
  optimalHops: number;
}

function obstaclesFromFree(n: number, freeSet: Set<string>): Position[] {
  const obs: Position[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!freeSet.has(`${x},${y}`)) obs.push({ x, y });
    }
  }
  return obs;
}

function spineL(n: number): { S: Position; G: Position; P: [number, number][] } {
  const S = { x: 1, y: n - 2 };
  const G = { x: n - 2, y: 1 };
  const P: [number, number][] = [];
  let x = S.x;
  let y = S.y;
  P.push([x, y]);
  while (x < n - 2) {
    x++;
    P.push([x, y]);
  }
  while (y > 1) {
    y--;
    P.push([x, y]);
  }
  return { S, G, P };
}

function spineRL(n: number): { S: Position; G: Position; P: [number, number][] } {
  const S = { x: n - 2, y: n - 2 };
  const G = { x: 1, y: 1 };
  const P: [number, number][] = [];
  let x = S.x;
  let y = S.y;
  P.push([x, y]);
  while (y > 1) {
    y--;
    P.push([x, y]);
  }
  while (x > 1) {
    x--;
    P.push([x, y]);
  }
  return { S, G, P };
}

function detourUnderHorizontal(P: [number, number][], i: number, j: number): [number, number][] {
  const [ax, ay] = P[i]!;
  const [bx, by] = P[j]!;
  if (ay !== by) return [];
  const yLow = ay + 1;
  const x0 = Math.min(ax, bx);
  const x1 = Math.max(ax, bx);
  const extra: [number, number][] = [];
  for (let xi = x0; xi <= x1; xi++) extra.push([xi, yLow]);
  return extra.filter(([px, py]) => !P.some(([qx, qy]) => qx === px && qy === py));
}

function detourWestOfVertical(P: [number, number][], i: number, j: number): [number, number][] {
  const [vx, ay] = P[i]!;
  const [vx2, by] = P[j]!;
  if (vx !== vx2) return [];
  const y0 = Math.min(ay, by);
  const y1 = Math.max(ay, by);
  const extra: [number, number][] = [];
  for (let yi = y0; yi <= y1; yi++) extra.push([vx - 1, yi]);
  return extra.filter(([px, py]) => !P.some(([qx, qy]) => qx === px && qy === py));
}

function deadNubs(P: [number, number][], n: number, count: number): [number, number][] {
  const spineSet = new Set(P.map(([x, y]) => `${x},${y}`));
  const extra: [number, number][] = [];
  const dirs: [number, number][] = [
    [0, 1],
    [0, -1],
    [-1, 0],
    [1, 0],
  ];
  let added = 0;
  for (let t = 2; t < P.length - 2 && added < count; t += 3) {
    const [x, y] = P[t]!;
    for (const [dx, dy] of dirs) {
      if (added >= count) break;
      const x1 = x + dx;
      const y1 = y + dy;
      if (x1 < 1 || x1 >= n - 1 || y1 < 1 || y1 >= n - 1) continue;
      if (spineSet.has(`${x1},${y1}`)) continue;
      const x2 = x1 + dx;
      const y2 = y1 + dy;
      if (x2 < 1 || x2 >= n - 1 || y2 < 1 || y2 >= n - 1) continue;
      if (spineSet.has(`${x2},${y2}`)) continue;
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

/**
 * Tutorial maze (11×11 L): extra shallow pockets between rocks — all are dead ends
 * or scenic detours strictly longer than the spine, so the shortest hop-count route stays unique.
 */
function level1WidenAisles(n: number, mode: 'L' | 'RL', free: Set<string>) {
  if (n !== 11 || mode !== 'L') return;
  const b = n - 2;
  const stubs: [number, number][] = [
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

function computeMaze(
  n: number,
  withDetour: boolean,
  nubs: number,
  mode: 'L' | 'RL',
  levelIndex: number,
): { S: Position; G: Position; obstacles: Position[] } {
  const effectiveNubs = levelIndex === 0 ? Math.min(nubs, 1) : nubs;
  const { S, G, P } = mode === 'RL' ? spineRL(n) : spineL(n);
  const free = new Set(P.map(([x, y]) => `${x},${y}`));

  if (withDetour) {
    if (mode === 'L') {
      const bottomY = n - 2;
      const idxList: number[] = [];
      for (let k = 0; k < P.length; k++) if (P[k]![1] === bottomY) idxList.push(k);
      const i = idxList[Math.max(1, Math.floor(idxList.length / 4))]!;
      const j = idxList[Math.min(idxList.length - 2, Math.floor((3 * idxList.length) / 4))]!;
      if (j > i + 2) {
        detourUnderHorizontal(P, i, j).forEach(([x, y]) => free.add(`${x},${y}`));
      }
    } else {
      const rightX = n - 2;
      const idxList: number[] = [];
      for (let k = 0; k < P.length; k++) {
        if (P[k]![0] === rightX && P[k]![1] < n - 2) idxList.push(k);
      }
      if (idxList.length > 4) {
        const i = idxList[Math.max(1, Math.floor(idxList.length / 5))]!;
        const j = idxList[Math.min(idxList.length - 2, Math.floor((4 * idxList.length) / 5))]!;
        if (j > i + 2) {
          detourWestOfVertical(P, i, j).forEach(([x, y]) => free.add(`${x},${y}`));
        }
      }
    }
  }

  deadNubs(P, n, effectiveNubs).forEach(([x, y]) => free.add(`${x},${y}`));
  if (levelIndex === 0) level1WidenAisles(n, mode, free);

  const obstacles = obstaclesFromFree(n, free);
  return { S, G, obstacles };
}

function bfsShortestHops(n: number, S: Position, G: Position, obsSet: Set<string>): number {
  const q: Position[] = [S];
  const dist = new Map<string, number>();
  dist.set(`${S.x},${S.y}`, 0);
  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi]!;
    const d = dist.get(`${p.x},${p.y}`)!;
    if (p.x === G.x && p.y === G.y) return d;
    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ] as const) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (nx < 0 || nx >= n || ny < 0 || ny >= n) continue;
      if (obsSet.has(`${nx},${ny}`)) continue;
      const k = `${nx},${ny}`;
      if (!dist.has(k)) {
        dist.set(k, d + 1);
        q.push({ x: nx, y: ny });
      }
    }
  }
  return -1;
}

function firstStepDirection(S: Position, G: Position, obstacles: Position[], n: number): Direction {
  const ks = new Set(obstacles.map((p) => `${p.x},${p.y}`));
  const parent = new Map<string, string>();
  const dist = new Map<string, number>();
  const sk = `${S.x},${S.y}`;
  dist.set(sk, 0);
  const q: Position[] = [S];
  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi]!;
    const d = dist.get(`${p.x},${p.y}`)!;
    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ] as const) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (nx < 0 || nx >= n || ny < 0 || ny >= n) continue;
      if (ks.has(`${nx},${ny}`)) continue;
      const k = `${nx},${ny}`;
      if (!dist.has(k)) {
        dist.set(k, d + 1);
        parent.set(k, `${p.x},${p.y}`);
        q.push({ x: nx, y: ny });
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
  const [fx, fy] = cur.split(',').map(Number) as [number, number];
  if (fx > S.x) return 'right';
  if (fx < S.x) return 'left';
  if (fy < S.y) return 'up';
  return 'down';
}

const SPECS: { n: number; detour: boolean; nubs: number; mode: 'L' | 'RL' }[] = [
  { n: 11, detour: true, nubs: 1, mode: 'L' },
  { n: 12, detour: true, nubs: 5, mode: 'L' },
  { n: 13, detour: true, nubs: 6, mode: 'L' },
  { n: 14, detour: true, nubs: 7, mode: 'L' },
  { n: 14, detour: true, nubs: 8, mode: 'RL' },
  { n: 15, detour: true, nubs: 9, mode: 'L' },
  { n: 16, detour: true, nubs: 10, mode: 'L' },
  { n: 16, detour: true, nubs: 12, mode: 'RL' },
];

const NAMES = [
  'Reed Maze Shallows',
  'Broader Bend',
  'Boulder Labyrinth',
  'Great Basin',
  'Mirror Marsh',
  'Monarch Pool',
  'Eldest Pond',
  'Crown Channels',
];

const HINTS = [
  'Wider shallows here — several corridors cross between rocks. Optional: save a repeating hop pattern as 🪷 A or 🪷 B and call it from your program (one block = whole routine).',
  'Rocks wall off most of the pond. Stay on the main spine; side pockets are dead ends.',
  'Double hops can skip straight runs — but a wrong tunnel costs more turns than it saves.',
  'The maze widens: there is a longer way through the extra channel. The true shortest path stays tight along the L.',
  'You start in the bottom-right corner this time. The slim strip west of the tall rocks is scenic, not shortest.',
  'Huge pool — plan turns at corners. The shortest trip hugs the inner L; scenic loops add hops.',
  'Sixteen tiles across. One geodesic wins; detours and nooks are for explorers who like extra steps.',
  'Final mirror layout: face upstream first. The shortest solve is still unique — scenic ribs are longer.',
];

export function buildFrogHopQuest2Levels(): FrogHopQuest2Level[] {
  return SPECS.map((s, idx) => {
    const { S, G, obstacles } = computeMaze(s.n, s.detour, s.nubs, s.mode, idx);
    const obsSet = new Set(obstacles.map((p) => `${p.x},${p.y}`));
    const optimalHops = bfsShortestHops(s.n, S, G, obsSet);
    const frogDirection = firstStepDirection(S, G, obstacles, s.n);
    const maxCommands = Math.min(160, optimalHops * 3 + 36);

    return {
      id: idx + 1,
      name: NAMES[idx] ?? `Level ${idx + 1}`,
      gridSize: s.n,
      frogStart: S,
      frogDirection,
      goal: G,
      obstacles,
      path: [],
      maxCommands,
      hint: HINTS[idx] ?? 'Find the unique shortest path in hops.',
      optimalHops,
    };
  });
}
