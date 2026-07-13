import type {
  BranchAction,
  Cell,
  Condition,
  Direction,
  Level,
  Position,
  ProgramBlock,
} from './underOneConditionLevels';
import { resolveBlockSpec, isPathEditable } from './underOneConditionLevels';

export function turnLeft(dir: Direction): Direction {
  const map: Record<Direction, Direction> = { up: 'left', left: 'down', down: 'right', right: 'up' };
  return map[dir];
}

export function turnRight(dir: Direction): Direction {
  const map: Record<Direction, Direction> = { up: 'right', right: 'down', down: 'left', left: 'up' };
  return map[dir];
}

export function directionDelta(dir: Direction): Position {
  switch (dir) {
    case 'up':
      return { x: 0, y: -1 };
    case 'down':
      return { x: 0, y: 1 };
    case 'left':
      return { x: -1, y: 0 };
    case 'right':
      return { x: 1, y: 0 };
  }
}

export function rotationDeg(dir: Direction): number {
  return { up: 0, right: 90, down: 180, left: 270 }[dir];
}

function inBounds(level: Level, pos: Position): boolean {
  return pos.y >= 0 && pos.y < level.grid.length && pos.x >= 0 && pos.x < level.grid[0].length;
}

export function cellAt(level: Level, pos: Position): Cell | null {
  if (!inBounds(level, pos)) return null;
  return level.grid[pos.y][pos.x];
}

function isWalkable(cell: Cell | null): boolean {
  return cell === 'pad' || cell === 'fork' || cell === 'goal';
}

function relativeDir(dir: Direction, offset: 'left' | 'right' | 'ahead'): Direction {
  if (offset === 'left') return turnLeft(dir);
  if (offset === 'right') return turnRight(dir);
  return dir;
}

function straightRayHitsGoal(level: Level, pos: Position, dir: Direction): boolean {
  let cur = { ...pos };
  for (let step = 0; step < 40; step++) {
    const delta = directionDelta(dir);
    const next = { x: cur.x + delta.x, y: cur.y + delta.y };
    const cell = cellAt(level, next);
    if (cell === 'goal') return true;
    if (cell === 'trap' || !isWalkable(cell)) return false;
    cur = next;
  }
  return false;
}

/** BFS from branch entry — goal reachable without stepping on traps or back onto the fork */
function branchLeadsToGoal(level: Level, branchStart: Position, forkPos: Position): boolean {
  const key = (p: Position) => `${p.x},${p.y}`;
  const queue: Position[] = [branchStart];
  const visited = new Set<string>([key(branchStart)]);

  while (queue.length > 0) {
    const p = queue.shift()!;
    if (p.x === level.goal.x && p.y === level.goal.y) return true;

    for (const d of ['up', 'right', 'down', 'left'] as Direction[]) {
      const delta = directionDelta(d);
      const next = { x: p.x + delta.x, y: p.y + delta.y };
      const k = key(next);
      if (visited.has(k)) continue;
      if (next.x === forkPos.x && next.y === forkPos.y) continue;
      const cell = cellAt(level, next);
      if (!isWalkable(cell) || cell === 'trap') continue;
      visited.add(k);
      queue.push(next);
    }
  }
  return false;
}

export function evaluateCondition(
  level: Level,
  cond: Condition,
  pos: Position,
  dir: Direction,
): boolean {
  const offset =
    cond === 'path_left' || cond === 'star_left'
      ? 'left'
      : cond === 'path_right' || cond === 'star_right'
        ? 'right'
        : 'ahead';

  const checkDir = relativeDir(dir, offset);
  const delta = directionDelta(checkDir);
  const adjacent = { x: pos.x + delta.x, y: pos.y + delta.y };
  const cell = cellAt(level, adjacent);

  if (cond.startsWith('path_')) {
    return isWalkable(cell);
  }

  if (cell === 'goal') return true;

  if (cond === 'star_ahead') {
    return straightRayHitsGoal(level, pos, dir);
  }

  if (!isWalkable(cell)) return false;
  return branchLeadsToGoal(level, adjacent, pos);
}

export type StepResult = 'ok' | 'win' | 'trap' | 'stuck';

export interface RunState {
  pos: Position;
  dir: Direction;
}

export function executeHop(level: Level, state: RunState): { state: RunState; result: StepResult } {
  const delta = directionDelta(state.dir);
  const next = { x: state.pos.x + delta.x, y: state.pos.y + delta.y };
  const cell = cellAt(level, next);
  if (!isWalkable(cell)) return { state, result: 'stuck' };
  const newState = { pos: next, dir: state.dir };
  if (cell === 'trap') return { state: newState, result: 'trap' };
  if (cell === 'goal') return { state: newState, result: 'win' };
  return { state: newState, result: 'ok' };
}

export function executeTurn(state: RunState, turn: 'turn_left' | 'turn_right'): RunState {
  return {
    pos: state.pos,
    dir: turn === 'turn_left' ? turnLeft(state.dir) : turnRight(state.dir),
  };
}

export function executeBranch(
  level: Level,
  state: RunState,
  action: BranchAction,
): { states: RunState[]; result: StepResult } {
  let pos = { ...state.pos };
  let dir = state.dir;
  const states: RunState[] = [{ pos: { ...pos }, dir }];

  const branchDir =
    action === 'take_left'
      ? turnLeft(dir)
      : action === 'take_right'
        ? turnRight(dir)
        : dir;

  dir = branchDir;
  states.push({ pos: { ...pos }, dir });

  // Hop onto the branch pad
  const entryDelta = directionDelta(dir);
  const entryNext = { x: pos.x + entryDelta.x, y: pos.y + entryDelta.y };
  const entryCell = cellAt(level, entryNext);
  if (entryCell === 'trap') {
    pos = entryNext;
    states.push({ pos: { ...pos }, dir });
    return { states, result: 'trap' };
  }
  if (entryCell === 'goal') {
    pos = entryNext;
    states.push({ pos: { ...pos }, dir });
    return { states, result: 'win' };
  }
  if (!isWalkable(entryCell)) {
    return { states, result: 'ok' };
  }

  const cameFrom = { ...pos };
  pos = entryNext;
  states.push({ pos: { ...pos }, dir });

  // Face into the branch (away from where we came), then walk forward
  const nextDirs: Direction[] = ['up', 'right', 'down', 'left'];
  const walkableAhead = nextDirs.filter((d) => {
    const delta = directionDelta(d);
    const next = { x: pos.x + delta.x, y: pos.y + delta.y };
    if (next.x === cameFrom.x && next.y === cameFrom.y) return false;
    return isWalkable(cellAt(level, next));
  });

  if (walkableAhead.length > 0) {
    // Prefer continuing in the original facing direction, then branch entry direction
    const preferred = [state.dir, branchDir, turnLeft(branchDir), turnRight(branchDir)];
    dir = preferred.find((d) => walkableAhead.includes(d)) ?? walkableAhead[0]!;
    states.push({ pos: { ...pos }, dir });
  }

  for (let step = 0; step < 30; step++) {
    const delta = directionDelta(dir);
    const next = { x: pos.x + delta.x, y: pos.y + delta.y };
    const cell = cellAt(level, next);
    if (cell === 'trap') {
      pos = next;
      states.push({ pos: { ...pos }, dir });
      return { states, result: 'trap' };
    }
    if (cell === 'goal') {
      pos = next;
      states.push({ pos: { ...pos }, dir });
      return { states, result: 'win' };
    }
    if (!isWalkable(cell)) break;
    pos = next;
    states.push({ pos: { ...pos }, dir });
  }

  if (pos.x === level.goal.x && pos.y === level.goal.y) {
    return { states, result: 'win' };
  }
  return { states, result: 'ok' };
}

export function resolveBlockAction(
  level: Level,
  block: ProgramBlock,
  state: RunState,
): { states: RunState[]; result: StepResult } | null {
  const spec = resolveBlockSpec(block);

  if (spec.kind === 'cmd' && spec.command) {
    if (spec.command === 'hop') {
      const { state: next, result } = executeHop(level, state);
      return { states: [next], result };
    }
    const next = executeTurn(state, spec.command);
    return { states: [next], result: 'ok' };
  }

  if (spec.kind === 'if' && spec.condition && spec.then) {
    // Simple IF path block: toggle picks direction — always go that way
    if (isPathEditable(block.templateId)) {
      return executeBranch(level, state, spec.then);
    }
    const action = evaluateCondition(level, spec.condition, state.pos, state.dir) ? spec.then : null;
    if (!action) return { states: [state], result: 'ok' };
    return executeBranch(level, state, action);
  }

  if (spec.kind === 'if_else' && spec.condition && spec.then && spec.else) {
    const action = evaluateCondition(level, spec.condition, state.pos, state.dir) ? spec.then : spec.else;
    return executeBranch(level, state, action);
  }

  if (
    spec.kind === 'if_elseif_else' &&
    spec.condition &&
    spec.then &&
    spec.condition2 &&
    spec.then2 &&
    spec.else
  ) {
    let action: BranchAction;
    if (evaluateCondition(level, spec.condition, state.pos, state.dir)) action = spec.then;
    else if (evaluateCondition(level, spec.condition2, state.pos, state.dir)) action = spec.then2;
    else action = spec.else;
    return executeBranch(level, state, action);
  }

  return null;
}

export interface ExpandedStep {
  block: ProgramBlock;
  programIndex: number;
}

/** Flatten program — expand routine calls inline */
export function expandProgram(
  program: ProgramBlock[],
  routineA: ProgramBlock[] | null,
  routineB: ProgramBlock[] | null,
): ExpandedStep[] {
  const out: ExpandedStep[] = [];
  for (let i = 0; i < program.length; i++) {
    const b = program[i]!;
    if (b.templateId === 'call_routine_a' && routineA?.length) {
      for (const rb of routineA) out.push({ block: rb, programIndex: i });
    } else if (b.templateId === 'call_routine_b' && routineB?.length) {
      for (const rb of routineB) out.push({ block: rb, programIndex: i });
    } else if (b.templateId !== 'call_routine_a' && b.templateId !== 'call_routine_b') {
      out.push({ block: b, programIndex: i });
    }
  }
  return out;
}
