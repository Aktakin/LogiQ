export type BaseCommand = 'forward' | 'left' | 'right';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface FunctionStep {
  type: 'command' | 'function';
  command?: BaseCommand;
  functionId?: string;
}

export interface CustomFunction {
  id: string;
  name: string;
  emoji: string;
  color: string;
  steps: FunctionStep[];
  /** Flat form for predefined helpers (also mirrored into steps). */
  commands?: BaseCommand[];
}

export interface Level {
  id: number;
  name: string;
  concept: string;
  gridSize: number;
  robotStart: Position;
  robotDirection: Direction;
  goal: Position;
  obstacles: Position[];
  path: Position[];
  maxCommands: number;
  maxFunctionCommands: number;
  maxCustomFunctions?: number;
  allowNesting?: boolean;
  predefinedFunctions?: CustomFunction[];
  hint: string;
  tutorial?: string;
}

function fn(
  id: string,
  name: string,
  emoji: string,
  color: string,
  commands: BaseCommand[]
): CustomFunction {
  return {
    id,
    name,
    emoji,
    color,
    commands,
    steps: commands.map((c) => ({ type: 'command' as const, command: c })),
  };
}

/**
 * Frog Function Pond 2 — harder nesting & composition.
 * Motifs are repeating so solutions stay under the command caps.
 */
export const frogFunctionPond2Levels: Level[] = [
  {
    id: 1,
    name: 'Compose Two Hops',
    concept: 'Call a helper from your own function',
    gridSize: 6,
    robotStart: { x: 0, y: 5 },
    robotDirection: 'right',
    goal: { x: 5, y: 5 },
    obstacles: [],
    path: [
      { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 },
      { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
    ],
    maxCommands: 3,
    maxFunctionCommands: 4,
    maxCustomFunctions: 2,
    allowNesting: true,
    predefinedFunctions: [fn('hop2', 'Hop ×2', '🐸', '#3b82f6', ['forward', 'forward'])],
    hint: 'Make a function that calls Hop ×2, then call your function three times.',
    tutorial: 'Nesting: put another function inside yours to build longer hops from short ones.',
  },
  {
    id: 2,
    name: 'Stair Constructor',
    concept: 'Wrap hop helpers into a stair unit',
    gridSize: 6,
    robotStart: { x: 0, y: 5 },
    robotDirection: 'up',
    goal: { x: 4, y: 1 },
    obstacles: [],
    // Zig: up,right,up,right ... ending at (4,1)
    path: [
      { x: 0, y: 5 }, { x: 0, y: 4 },
      { x: 1, y: 4 }, { x: 1, y: 3 },
      { x: 2, y: 3 }, { x: 2, y: 2 },
      { x: 3, y: 2 }, { x: 3, y: 1 },
      { x: 4, y: 1 },
    ],
    maxCommands: 5,
    maxFunctionCommands: 5,
    maxCustomFunctions: 2,
    allowNesting: true,
    predefinedFunctions: [
      fn('zig', 'Zig', '🪷', '#a78bfa', ['forward', 'right', 'forward', 'left']),
    ],
    hint: 'Call Zig repeatedly. Wrap 2 Zigs in your own function to stay under the main-script cap.',
  },
  {
    id: 3,
    name: 'Corner Kit',
    concept: 'Nest Hop ×3 inside corner routines',
    gridSize: 7,
    robotStart: { x: 0, y: 6 },
    robotDirection: 'right',
    goal: { x: 6, y: 0 },
    obstacles: [{ x: 3, y: 3 }, { x: 3, y: 4 }],
    path: [
      { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 },
      { x: 3, y: 5 },
      { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 },
      { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 },
    ],
    maxCommands: 5,
    maxFunctionCommands: 5,
    maxCustomFunctions: 3,
    allowNesting: true,
    predefinedFunctions: [
      fn('hop3', 'Hop ×3', '🍃', '#22c55e', ['forward', 'forward', 'forward']),
    ],
    hint: 'Build a “lane” that uses Hop ×3, and a “turn left, hop” corner — nest the lane inside bigger moves.',
  },
  {
    id: 4,
    name: 'Dry Corridor',
    concept: 'Compress long straights with nested reuse',
    gridSize: 8,
    robotStart: { x: 0, y: 7 },
    robotDirection: 'right',
    goal: { x: 7, y: 0 },
    obstacles: [
      { x: 2, y: 5 }, { x: 2, y: 6 },
      { x: 5, y: 2 }, { x: 5, y: 3 },
    ],
    path: [
      { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 },
      { x: 3, y: 6 }, { x: 3, y: 5 }, { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 },
      { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }, { x: 7, y: 0 },
    ],
    maxCommands: 6,
    maxFunctionCommands: 5,
    maxCustomFunctions: 3,
    allowNesting: true,
    hint: 'Spot the 3-hop straights. Nest them inside a “hall + turn” routine.',
  },
  {
    id: 5,
    name: 'Zigzag Engine',
    concept: 'Treat Zig as a primitive and wrap it',
    gridSize: 7,
    robotStart: { x: 0, y: 6 },
    robotDirection: 'up',
    goal: { x: 5, y: 1 },
    obstacles: [{ x: 3, y: 3 }],
    path: [
      { x: 0, y: 6 }, { x: 0, y: 5 },
      { x: 1, y: 5 }, { x: 1, y: 4 },
      { x: 2, y: 4 }, { x: 2, y: 3 },
      { x: 2, y: 2 },
      { x: 3, y: 2 }, { x: 4, y: 2 },
      { x: 4, y: 1 },
      { x: 5, y: 1 },
    ],
    maxCommands: 5,
    maxFunctionCommands: 4,
    maxCustomFunctions: 2,
    allowNesting: true,
    predefinedFunctions: [
      fn('zig', 'Zig', '🪷', '#a78bfa', ['forward', 'right', 'forward', 'left']),
    ],
    hint: 'Zig three times, then hop/turn to finish — wrap Zigs if the main script runs out of slots.',
  },
  {
    id: 6,
    name: 'U-Turn Factory',
    concept: 'Mirror lanes with the same Hop ×3 core',
    gridSize: 8,
    robotStart: { x: 0, y: 7 },
    robotDirection: 'right',
    goal: { x: 7, y: 7 },
    obstacles: [
      { x: 3, y: 5 }, { x: 3, y: 6 },
      { x: 4, y: 5 }, { x: 4, y: 6 },
    ],
    path: [
      { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 2, y: 7 },
      { x: 2, y: 6 }, { x: 2, y: 5 }, { x: 2, y: 4 },
      { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
      { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 },
      { x: 6, y: 7 }, { x: 7, y: 7 },
    ],
    maxCommands: 5,
    maxFunctionCommands: 6,
    maxCustomFunctions: 3,
    allowNesting: true,
    predefinedFunctions: [
      fn('hop3', 'Hop ×3', '🍃', '#22c55e', ['forward', 'forward', 'forward']),
    ],
    hint: 'Up-lane and down-lane both reuse Hop ×3 — only turns differ.',
  },
  {
    id: 7,
    name: 'Three-Layer Stack',
    concept: 'A → B → C nesting depth',
    gridSize: 8,
    robotStart: { x: 0, y: 7 },
    robotDirection: 'right',
    goal: { x: 7, y: 0 },
    obstacles: [
      { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
      { x: 4, y: 5 },
    ],
    path: [
      { x: 0, y: 7 }, { x: 1, y: 7 },
      { x: 1, y: 6 }, { x: 1, y: 5 },
      { x: 2, y: 5 }, { x: 3, y: 5 },
      { x: 3, y: 6 }, { x: 3, y: 7 },
      { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 },
      { x: 6, y: 6 }, { x: 6, y: 5 }, { x: 6, y: 4 },
      { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 },
      { x: 7, y: 0 },
    ],
    maxCommands: 5,
    maxFunctionCommands: 5,
    maxCustomFunctions: 4,
    allowNesting: true,
    predefinedFunctions: [fn('hop2', 'Hop ×2', '🐸', '#3b82f6', ['forward', 'forward'])],
    tutorial: 'Build tiny → segment → route. Nesting depth is the point.',
    hint: 'Layer 1: Hop×2. Layer 2: segment using Hop×2. Layer 3: route calling the segment.',
  },
  {
    id: 8,
    name: 'Rock Gauntlet',
    concept: 'Tight budget dodging rocks',
    gridSize: 8,
    robotStart: { x: 0, y: 7 },
    robotDirection: 'up',
    goal: { x: 7, y: 0 },
    obstacles: [
      { x: 1, y: 5 }, { x: 1, y: 6 },
      { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 },
      { x: 5, y: 1 }, { x: 5, y: 5 }, { x: 5, y: 6 },
    ],
    path: [
      { x: 0, y: 7 }, { x: 0, y: 6 }, { x: 0, y: 5 }, { x: 0, y: 4 },
      { x: 1, y: 4 }, { x: 2, y: 4 },
      { x: 2, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 1 },
      { x: 3, y: 1 }, { x: 4, y: 1 },
      { x: 4, y: 0 },
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 },
    ],
    maxCommands: 6,
    maxFunctionCommands: 5,
    maxCustomFunctions: 3,
    allowNesting: true,
    predefinedFunctions: [
      fn('hop4', 'Hop ×4', '🌿', '#14b8a6', ['forward', 'forward', 'forward', 'forward']),
    ],
    hint: 'Hop ×4 covers the first vertical corridor. Nest it into “up then side-step”.',
  },
  {
    id: 9,
    name: 'Double Helix Pads',
    concept: 'Alternating left/right modules that nest Hop ×2',
    gridSize: 8,
    robotStart: { x: 0, y: 7 },
    robotDirection: 'right',
    goal: { x: 7, y: 1 },
    obstacles: [{ x: 3, y: 4 }, { x: 4, y: 5 }],
    path: [
      { x: 0, y: 7 }, { x: 1, y: 7 },
      { x: 1, y: 6 }, { x: 1, y: 5 },
      { x: 2, y: 5 }, { x: 3, y: 5 },
      { x: 3, y: 6 }, { x: 3, y: 7 },
      { x: 4, y: 7 }, { x: 5, y: 7 },
      { x: 5, y: 6 }, { x: 5, y: 5 }, { x: 5, y: 4 },
      { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 },
      { x: 7, y: 1 },
    ],
    maxCommands: 6,
    maxFunctionCommands: 5,
    maxCustomFunctions: 3,
    allowNesting: true,
    predefinedFunctions: [fn('hop2', 'Hop ×2', '🐸', '#3b82f6', ['forward', 'forward'])],
    hint: 'Create “bump up” and “bump down” modules that both use Hop ×2.',
  },
  {
    id: 10,
    name: 'Parameter Thinking',
    concept: 'Reuse one hop helper at different counts via nesting',
    gridSize: 9,
    robotStart: { x: 0, y: 8 },
    robotDirection: 'right',
    goal: { x: 8, y: 0 },
    obstacles: [
      { x: 2, y: 6 }, { x: 2, y: 7 },
      { x: 5, y: 3 }, { x: 5, y: 4 },
      { x: 6, y: 6 },
    ],
    path: [
      { x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 },
      { x: 3, y: 7 }, { x: 3, y: 6 }, { x: 3, y: 5 },
      { x: 4, y: 5 },
      { x: 4, y: 4 }, { x: 4, y: 3 }, { x: 4, y: 2 },
      { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 },
      { x: 7, y: 1 }, { x: 7, y: 0 },
      { x: 8, y: 0 },
    ],
    maxCommands: 6,
    maxFunctionCommands: 5,
    maxCustomFunctions: 3,
    allowNesting: true,
    predefinedFunctions: [fn('hop2', 'Hop ×2', '🐸', '#3b82f6', ['forward', 'forward'])],
    hint: 'Make Hop×4 by nesting Hop×2 twice. Use Hop×4 for long corridors.',
  },
  {
    id: 11,
    name: 'Spiral Protocol',
    concept: 'Growing side lengths via nested turn units',
    gridSize: 7,
    robotStart: { x: 3, y: 3 },
    robotDirection: 'up',
    goal: { x: 0, y: 0 },
    obstacles: [],
    path: [
      { x: 3, y: 3 }, { x: 3, y: 2 },
      { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 },
      { x: 3, y: 4 }, { x: 2, y: 4 }, { x: 2, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 1 },
      { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 }, { x: 1, y: 5 },
      { x: 0, y: 5 }, { x: 0, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 0 },
    ],
    maxCommands: 7,
    maxFunctionCommands: 5,
    maxCustomFunctions: 4,
    allowNesting: true,
    predefinedFunctions: [
      fn('hop1', 'Step', '🫧', '#fbbf24', ['forward']),
      fn('hop2', 'Hop ×2', '🐸', '#3b82f6', ['forward', 'forward']),
    ],
    hint: 'Build a Corner (hop + right) then nest longer hop helpers as arms grow.',
  },
  {
    id: 12,
    name: 'Pond Kernel',
    concept: 'Final: maximal composition under a brutal main-script cap',
    gridSize: 9,
    robotStart: { x: 0, y: 8 },
    robotDirection: 'right',
    goal: { x: 4, y: 4 },
    obstacles: [
      { x: 2, y: 6 }, { x: 2, y: 7 },
      { x: 4, y: 7 }, { x: 5, y: 7 },
      { x: 6, y: 5 }, { x: 6, y: 6 },
      { x: 3, y: 3 }, { x: 5, y: 3 },
    ],
    path: [
      { x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 },
      { x: 3, y: 7 }, { x: 3, y: 6 }, { x: 3, y: 5 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ],
    maxCommands: 4,
    maxFunctionCommands: 6,
    maxCustomFunctions: 4,
    allowNesting: true,
    predefinedFunctions: [
      fn('hop2', 'Hop ×2', '🐸', '#3b82f6', ['forward', 'forward']),
      fn('hop3', 'Hop ×3', '🍃', '#22c55e', ['forward', 'forward', 'forward']),
    ],
    tutorial: 'Main script can only hold 4 blocks — almost everything must live in nested functions.',
    hint: 'Build a kernel that hops 4 right (via Hop×2 nest), then turns and runs a vertical Lane with Hop×3.',
  },
  {
    id: 13,
    name: 'Serpent Compiler',
    concept: 'Row-scan serpent — one module must recurse via nesting to cover 5 lanes',
    gridSize: 10,
    robotStart: { x: 0, y: 9 },
    robotDirection: 'right',
    goal: { x: 0, y: 4 },
    obstacles: [
      // Rocks sit on unused upper pond — path only uses rows 4–9
      { x: 1, y: 2 }, { x: 2, y: 1 }, { x: 3, y: 3 }, { x: 4, y: 0 },
      { x: 5, y: 2 }, { x: 6, y: 1 }, { x: 7, y: 3 }, { x: 8, y: 0 },
      { x: 2, y: 3 }, { x: 7, y: 2 }, { x: 4, y: 3 }, { x: 5, y: 1 },
    ],
    // Snake: y=9 L→R, y=8 R→L, y=7 L→R, y=6 R→L, y=5 L→R, then left across y=4 to (0,4)
    path: [
      // row 9 →
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 4, y: 9 },
      { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }, { x: 9, y: 9 },
      { x: 9, y: 8 },
      // row 8 ←
      { x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }, { x: 4, y: 8 },
      { x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 }, { x: 0, y: 8 },
      { x: 0, y: 7 },
      // row 7 →
      { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 },
      { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 },
      { x: 9, y: 6 },
      // row 6 ←
      { x: 8, y: 6 }, { x: 7, y: 6 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 },
      { x: 3, y: 6 }, { x: 2, y: 6 }, { x: 1, y: 6 }, { x: 0, y: 6 },
      { x: 0, y: 5 },
      // row 5 →
      { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
      { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 },
      { x: 9, y: 4 },
      // row 4 ← to goal
      { x: 8, y: 4 }, { x: 7, y: 4 }, { x: 6, y: 4 }, { x: 5, y: 4 }, { x: 4, y: 4 },
      { x: 3, y: 4 }, { x: 2, y: 4 }, { x: 1, y: 4 }, { x: 0, y: 4 },
    ],
    maxCommands: 3,
    maxFunctionCommands: 6,
    maxCustomFunctions: 5,
    allowNesting: true,
    predefinedFunctions: [
      fn('hop2', 'Hop ×2', '🐸', '#3b82f6', ['forward', 'forward']),
      fn('hop5', 'Hop ×5', '🌿', '#14b8a6', ['forward', 'forward', 'forward', 'forward', 'forward']),
    ],
    tutorial: 'Main script: 3 slots only. A full 10-wide row must live inside nested kernels.',
    hint: 'Build Row (Hop×5 + Hop×5), then Cross + turn-up + Cross + turn-up as a LanePair. Call LanePair, then finish the last arms.',
  },
  {
    id: 14,
    name: 'Fractal Switchbacks',
    concept: 'Mirrored L/R modules nested three deep around a rock labyrinth',
    gridSize: 10,
    robotStart: { x: 0, y: 9 },
    robotDirection: 'up',
    goal: { x: 9, y: 0 },
    obstacles: [
      // Walls beside the corridors — never on the path cells
      { x: 1, y: 9 }, { x: 1, y: 8 }, { x: 1, y: 7 }, { x: 1, y: 6 },
      { x: 3, y: 9 }, { x: 3, y: 8 }, { x: 3, y: 6 }, { x: 3, y: 5 }, { x: 3, y: 4 }, { x: 3, y: 3 }, { x: 3, y: 2 },
      { x: 5, y: 9 }, { x: 5, y: 8 }, { x: 5, y: 6 }, { x: 5, y: 5 }, { x: 5, y: 4 }, { x: 5, y: 3 }, { x: 5, y: 2 }, { x: 5, y: 0 },
      { x: 7, y: 9 }, { x: 7, y: 8 }, { x: 7, y: 6 }, { x: 7, y: 5 }, { x: 7, y: 4 }, { x: 7, y: 3 }, { x: 7, y: 2 }, { x: 7, y: 1 },
      { x: 2, y: 8 }, { x: 8, y: 5 }, { x: 8, y: 3 }, { x: 9, y: 5 },
    ],
    // Vertical corridors alternating with small right jogs — repeating "up-bump right" motif
    path: [
      { x: 0, y: 9 }, { x: 0, y: 8 }, { x: 0, y: 7 }, { x: 0, y: 6 }, { x: 0, y: 5 },
      { x: 1, y: 5 }, { x: 2, y: 5 },
      { x: 2, y: 4 }, { x: 2, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 1 },
      { x: 3, y: 1 }, { x: 4, y: 1 },
      { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 4, y: 7 },
      { x: 5, y: 7 }, { x: 6, y: 7 },
      { x: 6, y: 6 }, { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 },
      { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 },
    ],
    maxCommands: 3,
    maxFunctionCommands: 6,
    maxCustomFunctions: 5,
    allowNesting: true,
    predefinedFunctions: [
      fn('hop2', 'Hop ×2', '🐸', '#3b82f6', ['forward', 'forward']),
      fn('hop3', 'Hop ×3', '🍃', '#22c55e', ['forward', 'forward', 'forward']),
    ],
    tutorial: 'You have three main blocks. Every corridor and jog must be a nested kernel.',
    hint: 'Make Climb (nested Hop×3 / Hop×2), JogRight (right, hop×2, left), then Route = Climb+Jog+Climb+Jog… Call Route once.',
  },
  {
    id: 15,
    name: 'Null Pointer Pond',
    concept: 'Ultimate: max 3 main blocks, max depth nesting, dense rocks, zero waste',
    gridSize: 10,
    robotStart: { x: 0, y: 9 },
    robotDirection: 'right',
    goal: { x: 9, y: 9 },
    obstacles: [
      // Blocks channel walls; corridor x=3,5,7,9 and connectors stay clear
      { x: 2, y: 8 }, { x: 2, y: 7 }, { x: 2, y: 6 }, { x: 2, y: 5 }, { x: 2, y: 4 }, { x: 2, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 1 },
      { x: 4, y: 9 }, { x: 4, y: 8 }, { x: 4, y: 7 }, { x: 4, y: 6 }, { x: 4, y: 5 }, { x: 4, y: 4 }, { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 },
      { x: 6, y: 8 }, { x: 6, y: 6 }, { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 },
      { x: 8, y: 9 }, { x: 8, y: 8 }, { x: 8, y: 7 }, { x: 8, y: 5 }, { x: 8, y: 4 }, { x: 8, y: 3 }, { x: 8, y: 2 }, { x: 8, y: 1 },
      { x: 1, y: 4 }, { x: 1, y: 2 }, { x: 0, y: 6 }, { x: 0, y: 3 },
    ],
    // S-path through corridors: right, up lane, right, down lane, right, up, right to goal
    path: [
      { x: 0, y: 9 }, { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 },
      { x: 3, y: 8 }, { x: 3, y: 7 }, { x: 3, y: 6 }, { x: 3, y: 5 }, { x: 3, y: 4 }, { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 0 },
      { x: 4, y: 0 }, { x: 5, y: 0 },
      { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 },
      { x: 6, y: 7 }, { x: 7, y: 7 },
      { x: 7, y: 6 }, { x: 7, y: 5 }, { x: 7, y: 4 }, { x: 7, y: 3 }, { x: 7, y: 2 }, { x: 7, y: 1 }, { x: 7, y: 0 },
      { x: 8, y: 0 }, { x: 9, y: 0 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 },
      { x: 9, y: 6 }, { x: 9, y: 7 }, { x: 9, y: 8 }, { x: 9, y: 9 },
    ],
    maxCommands: 3,
    maxFunctionCommands: 7,
    maxCustomFunctions: 5,
    allowNesting: true,
    predefinedFunctions: [
      fn('hop2', 'Hop ×2', '🐸', '#3b82f6', ['forward', 'forward']),
      fn('hop3', 'Hop ×3', '🍃', '#22c55e', ['forward', 'forward', 'forward']),
      fn('hop4', 'Hop ×4', '🌿', '#14b8a6', ['forward', 'forward', 'forward', 'forward']),
    ],
    tutorial: 'Passcode bosses start here. Three slots. Nested Lane + Relays must carry the whole pond.',
    hint: 'Compose Up9 / Down7 / Across from hop helpers. One top-level Run kernel calling them in order — then call Run once (maybe twice with a turn).',
  },
];
