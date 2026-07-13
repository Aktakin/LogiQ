import type { Cell, Direction, Level, Position } from './underOneConditionLevels';

const W: Cell = 'water';
const P: Cell = 'pad';
const G: Cell = 'goal';

export interface BranchSpec {
  side: 'left' | 'right';
  splitY: number;
  col: number;
  detour?: number;
}

export interface MazeSpec {
  width: number;
  height: number;
  startX: number;
  goalX: number;
  spineX: number;
  branches: BranchSpec[];
  mergeY?: number;
}

function set(grid: Cell[][], x: number, y: number, c: Cell) {
  if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) grid[y][x] = c;
}

/** L-shaped connector from hub into a fat vertical lane */
function connectLane(
  grid: Cell[][],
  spineX: number,
  splitY: number,
  col: number,
  side: 'left' | 'right',
  mergeY: number,
  detour: number,
) {
  const step = side === 'left' ? -1 : 1;
  const hookCol = col + step;
  const wideCol = col + step * 2;
  const turnY = splitY - 1;

  // Junction: hub + one step toward lane
  set(grid, spineX, splitY, P);
  set(grid, spineX + step, splitY, P);
  // L-turn into lane
  set(grid, spineX + step, turnY, P);

  // Elbow row leading into lane column
  const elbowFrom = Math.min(spineX + step, col);
  const elbowTo = Math.max(spineX + step, col);
  for (let x = elbowFrom; x <= elbowTo; x++) set(grid, x, turnY, P);

  if (detour > 0) {
    const bottom = turnY - detour;
    for (let y = turnY - 1; y >= bottom; y--) {
      set(grid, col, y, P);
      set(grid, hookCol, y, P);
      if (wideCol >= 0 && wideCol < grid[0].length) set(grid, wideCol, y, P);
    }
    for (let y = bottom - 1; y >= mergeY; y--) {
      set(grid, col, y, P);
      set(grid, hookCol, y, P);
    }
  } else {
    for (let y = turnY - 1; y >= mergeY; y--) {
      set(grid, col, y, P);
      const w = side === 'left' ? col - 1 : col + 1;
      if (w >= 0 && w < grid[0].length) set(grid, w, y, P);
    }
  }
}

export function buildMultiPathMaze(spec: MazeSpec): Cell[][] {
  const { height: h, goalX, spineX, branches } = spec;
  const mergeY = spec.mergeY ?? 1;
  const grid: Cell[][] = Array.from({ length: h }, () => Array(spec.width).fill(W));

  const splits = branches.map((b) => b.splitY);
  const lowest = splits.length ? Math.min(...splits) : mergeY;
  const highest = splits.length ? Math.max(...splits) : lowest;

  // Hub spine segments (water gaps between junction zones keep lanes visually separate)
  for (let y = h - 1; y >= lowest; y--) set(grid, spineX, y, P);
  for (let y = highest - 1; y >= mergeY; y--) set(grid, spineX, y, P);

  for (const br of branches) {
    connectLane(grid, spineX, br.splitY, br.col, br.side, mergeY, br.detour ?? 0);
  }

  // Merge platform
  const cols = [goalX, spineX, ...branches.map((b) => b.col), ...branches.map((b) => b.col + (b.side === 'left' ? -1 : 1))];
  const left = Math.min(...cols);
  const right = Math.max(...cols);
  for (let x = left; x <= right; x++) set(grid, x, mergeY, P);

  set(grid, goalX, 0, G);
  return grid;
}

export interface MazeLevelMeta {
  pathWays: number;
  parBlocks: number;
  maxBlocks: number;
}

export function mazeLevel(
  id: number,
  name: string,
  subtitle: string,
  spec: MazeSpec,
  meta: MazeLevelMeta,
  extra: Partial<Level> = {},
): Level {
  const grid = buildMultiPathMaze(spec);
  const ways = meta.pathWays;
  const routeLabel =
    ways >= 5 ? 'Five routes' : ways === 3 ? 'Three routes' : ways === 2 ? 'Two routes' : `${ways} routes`;

  return {
    id,
    name,
    subtitle: `${routeLabel} - ${subtitle}`,
    grid,
    start: { x: spec.startX, y: spec.height - 1 },
    direction: 'up' as Direction,
    goal: { x: spec.goalX, y: 0 },
    hint:
      extra.hint ??
      (ways >= 5
        ? `Map all ${ways} corridors before coding! Only the shortest fits in ${meta.maxBlocks} blocks.`
        : ways === 3
          ? `Trace every path on paper first - you only get ${meta.maxBlocks} blocks.`
          : `The scenic detour needs more than ${meta.maxBlocks} blocks. Find the shortcut!`),
    maxBlocks: meta.maxBlocks,
    palette: ['hop', 'if_path_else'],
    challenge: id >= 3,
    parBlocks: meta.parBlocks,
    pathWays: ways,
    ...extra,
  };
}

export function printMaze(grid: Cell[][]) {
  const ch = (c: Cell) => (c === 'water' ? '·' : c === 'pad' ? '#' : c === 'goal' ? 'G' : '?');
  grid.forEach((row, y) => console.log(String(y).padStart(2), row.map(ch).join(' ')));
}
