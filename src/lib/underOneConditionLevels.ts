import { MAZE_LEVELS } from './underOneConditionMazeLevels';
import { mazeLevel } from './mazeBuilder';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type Cell = 'water' | 'pad' | 'fork' | 'goal' | 'trap' | 'rock';

export interface Position {
  x: number;
  y: number;
}

export type Condition =
  | 'path_left'
  | 'path_right'
  | 'path_ahead'
  | 'star_left'
  | 'star_right'
  | 'star_ahead';

export type BranchAction = 'take_left' | 'take_right' | 'go_ahead';
export type Command = 'hop' | 'turn_left' | 'turn_right';

export type BlockTemplateId =
  | 'hop'
  | 'turn_left'
  | 'turn_right'
  | 'if_path'
  | 'if_path_else'
  | 'if_star_left_else_if_ahead_else_right'
  | 'if_path_ahead_go_ahead'
  | 'call_routine_a'
  | 'call_routine_b';

/** Blocks allowed inside lily routines */
export type RoutineTemplateId = 'hop' | 'if_path' | 'if_path_else';

export interface ProgramBlock {
  id: string;
  templateId: BlockTemplateId;
  /** Editable check direction for path-based IF blocks */
  checkDir?: 'left' | 'right';
}

export interface Level {
  id: number;
  name: string;
  subtitle: string;
  grid: Cell[][];
  start: Position;
  direction: Direction;
  goal: Position;
  hint: string;
  maxBlocks: number;
  palette: BlockTemplateId[];
  teach?: string;
  /** Challenge zone - tight par, harder puzzles */
  challenge?: boolean;
  /** Target block count for bonus stars */
  parBlocks?: number;
  /** Allow saving lily routines A / B */
  routinesEnabled?: boolean;
  maxRoutineBlocks?: number;
  /** Distinct corridor routes to the goal (for maze levels) */
  pathWays?: number;
}

export const CONDITION_LABELS: Record<Condition, string> = {
  path_left: 'path on left',
  path_right: 'path on right',
  path_ahead: 'path ahead',
  star_left: 'star on left',
  star_right: 'star on right',
  star_ahead: 'star ahead',
};

export const ACTION_LABELS: Record<BranchAction, string> = {
  take_left: 'go left',
  take_right: 'go right',
  go_ahead: 'go ahead',
};

export const BLOCK_TEMPLATES: Record<
  BlockTemplateId,
  {
    label: string;
    shortLabel: string;
    color: string;
    icon: string;
    kind: 'cmd' | 'if' | 'if_else' | 'if_elseif_else';
    command?: Command;
    condition?: Condition;
    then?: BranchAction;
    else?: BranchAction;
    condition2?: Condition;
    then2?: BranchAction;
  }
> = {
  hop: { label: 'Hop forward', shortLabel: 'Hop', color: '#34d399', icon: '🐸', kind: 'cmd', command: 'hop' },
  turn_left: { label: 'Turn left', shortLabel: 'Turn left', color: '#2dd4bf', icon: '↩️', kind: 'cmd', command: 'turn_left' },
  turn_right: { label: 'Turn right', shortLabel: 'Turn right', color: '#10b981', icon: '↪️', kind: 'cmd', command: 'turn_right' },
  if_path: {
    label: 'Go left or right at junction',
    shortLabel: 'Go left/right',
    color: '#f59e0b',
    icon: '🔀',
    kind: 'if',
    condition: 'path_left',
    then: 'take_left',
  },
  if_path_else: {
    label: 'IF path on ... -> go that way  ELSE -> other way',
    shortLabel: 'IF path ELSE',
    color: '#f97316',
    icon: '🌓',
    kind: 'if_else',
    condition: 'path_left',
    then: 'take_left',
    else: 'take_right',
  },
  if_star_left_else_if_ahead_else_right: {
    label: 'IF star left -> left  ELSE IF star ahead -> ahead  ELSE -> right',
    shortLabel: 'IF / ELSE IF / ELSE',
    color: '#a855f7',
    icon: '⭐',
    kind: 'if_elseif_else',
    condition: 'star_left',
    then: 'take_left',
    condition2: 'star_ahead',
    then2: 'go_ahead',
    else: 'take_right',
  },
  if_path_ahead_go_ahead: {
    label: 'IF path ahead -> go ahead',
    shortLabel: 'IF ahead -> ahead',
    color: '#eab308',
    icon: '⬆️',
    kind: 'if',
    condition: 'path_ahead',
    then: 'go_ahead',
  },
  call_routine_a: {
    label: 'Call Routine 🪷 A',
    shortLabel: 'Call 🪷 A',
    color: '#34d399',
    icon: '🪷',
    kind: 'cmd',
  },
  call_routine_b: {
    label: 'Call Routine 🍃 B',
    shortLabel: 'Call 🍃 B',
    color: '#2dd4bf',
    icon: '🍃',
    kind: 'cmd',
  },
};

export const ROUTINE_PALETTE: RoutineTemplateId[] = ['hop', 'if_path', 'if_path_else'];

export const ROUTINE_META = {
  a: { label: 'Routine A', emoji: '🪷', color: '#34d399' },
  b: { label: 'Routine B', emoji: '🍃', color: '#2dd4bf' },
} as const;

export function isRoutineTemplate(id: BlockTemplateId): id is RoutineTemplateId {
  return id === 'hop' || id === 'if_path' || id === 'if_path_else';
}

export function isPathEditable(templateId: BlockTemplateId): boolean {
  const tpl = BLOCK_TEMPLATES[templateId];
  return tpl.kind === 'if' || tpl.kind === 'if_else'
    ? (tpl.condition?.startsWith('path_') && tpl.condition !== 'path_ahead') ?? false
    : false;
}

export function getPathCheckDir(block: ProgramBlock): 'left' | 'right' {
  if (block.checkDir) return block.checkDir;
  const cond = BLOCK_TEMPLATES[block.templateId].condition;
  return cond === 'path_right' ? 'right' : 'left';
}

export interface ResolvedBlockSpec {
  kind: 'cmd' | 'if' | 'if_else' | 'if_elseif_else';
  command?: Command;
  condition?: Condition;
  then?: BranchAction;
  else?: BranchAction;
  condition2?: Condition;
  then2?: BranchAction;
}

export function resolveBlockSpec(block: ProgramBlock): ResolvedBlockSpec {
  const tpl = BLOCK_TEMPLATES[block.templateId];
  const spec: ResolvedBlockSpec = { kind: tpl.kind, command: tpl.command };

  if (isPathEditable(block.templateId)) {
    const side = getPathCheckDir(block);
    const other: 'left' | 'right' = side === 'left' ? 'right' : 'left';
    spec.condition = side === 'left' ? 'path_left' : 'path_right';
    spec.then = side === 'left' ? 'take_left' : 'take_right';
    if (tpl.kind === 'if_else') {
      spec.else = other === 'left' ? 'take_left' : 'take_right';
    }
    return spec;
  }

  spec.condition = tpl.condition;
  spec.then = tpl.then;
  spec.else = tpl.else;
  spec.condition2 = tpl.condition2;
  spec.then2 = tpl.then2;
  return spec;
}

export function formatBlockLabel(block: ProgramBlock): string {
  const spec = resolveBlockSpec(block);
  const tpl = BLOCK_TEMPLATES[block.templateId];

  if (tpl.kind === 'cmd') return tpl.label;
  if (block.templateId === 'if_path' && spec.then) {
    const side = spec.then === 'take_left' ? 'left' : 'right';
    return `Go ${side}`;
  }
  if (block.templateId === 'call_routine_a') return 'Call 🪷 A';
  if (block.templateId === 'call_routine_b') return 'Call 🍃 B';
  if (spec.kind === 'if' && spec.condition && spec.then) {
    return `IF ${CONDITION_LABELS[spec.condition]} -> ${ACTION_LABELS[spec.then]}`;
  }
  if (spec.kind === 'if_else' && spec.condition && spec.then && spec.else) {
    return `IF ${CONDITION_LABELS[spec.condition]} -> ${ACTION_LABELS[spec.then]}  ELSE -> ${ACTION_LABELS[spec.else]}`;
  }
  if (spec.kind === 'if_elseif_else') return tpl.label;
  return tpl.label;
}

export const LEVELS: Level[] = [
  // TUTORIAL (levels 1-2)
  {
    id: 1,
    name: 'Lily Cruise',
    subtitle: 'Hop to the bend, then pick left or right with your IF block.',
    grid: [
      ['water', 'water', 'goal', 'water', 'water'],
      ['water', 'water', 'pad', 'water', 'water'],
      ['water', 'water', 'pad', 'pad', 'water'],
      ['water', 'water', 'water', 'pad', 'water'],
      ['water', 'water', 'water', 'pad', 'water'],
    ],
    start: { x: 3, y: 4 },
    direction: 'up',
    goal: { x: 2, y: 0 },
    hint: 'Hop twice to the bend. Tap IF block -> left - one turn reaches the lily!',
    maxBlocks: 5,
    palette: ['hop', 'if_path'],
    teach: 'Tap left or right on the IF block - your frog goes that way at corners!',
  },
  mazeLevel(
    2,
    'Safe Side',
    'map both corridors - only one fits your block limit',
    { width: 15, height: 11, startX: 7, goalX: 7, spineX: 7, branches: [
      { side: 'left', splitY: 7, col: 2, detour: 3 },
      { side: 'right', splitY: 4, col: 12, detour: 0 },
    ]},
    { pathWays: 2, parBlocks: 7, maxBlocks: 8 },
    {
      teach: 'Two corridors branch off! Trace the left loop and right highway before coding.',
      hint: 'Hop past the left elbow, then IF path ELSE into the right lane.',
    },
  ),

  ...MAZE_LEVELS,
];
