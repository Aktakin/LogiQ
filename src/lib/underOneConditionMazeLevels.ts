import { mazeLevel } from './mazeBuilder';

const W2 = 15;
const W3 = 15;
const W5 = 17;
const HUB = 7;

/** Challenge maze levels 3–20 - visually distinct multi-lane layouts */
export const MAZE_LEVELS = [
  // ── TWO ROUTES (levels 3–6) ──
  mazeLevel(3, 'Fork in the Road', 'map both corridors before you drop blocks', {
    width: W2, height: 11, startX: HUB, goalX: HUB, spineX: HUB,
    branches: [
      { side: 'left', splitY: 7, col: 2, detour: 3 },
      { side: 'right', splitY: 4, col: 12, detour: 0 },
    ],
  }, { pathWays: 2, parBlocks: 7, maxBlocks: 8 }, { teach: 'Trace the left loop AND the right highway before you code.' }),

  mazeLevel(4, 'Twin Corridors', 'the winding left path looks tempting - count its blocks', {
    width: W2, height: 12, startX: HUB, goalX: HUB, spineX: HUB,
    branches: [
      { side: 'left', splitY: 8, col: 2, detour: 3 },
      { side: 'right', splitY: 5, col: 12, detour: 0 },
    ],
  }, { pathWays: 2, parBlocks: 7, maxBlocks: 8 }),

  mazeLevel(5, 'Thorn Corridor', 'sketch the shortcut vs the scenic loop - block budget is tight', {
    width: W2, height: 12, startX: HUB, goalX: HUB, spineX: HUB,
    branches: [
      { side: 'left', splitY: 8, col: 2, detour: 5 },
      { side: 'right', splitY: 5, col: 12, detour: 0 },
    ],
  }, { pathWays: 2, parBlocks: 8, maxBlocks: 8 }, {
    hint: 'Hop past the left elbow, then IF ... ELSE into the right highway. The left loop needs way more blocks!',
  }),

  mazeLevel(6, 'Split Decision', 'two clear corridors - plan the whole program before you run', {
    width: W2, height: 13, startX: HUB, goalX: HUB, spineX: HUB,
    branches: [
      { side: 'left', splitY: 9, col: 2, detour: 5 },
      { side: 'right', splitY: 5, col: 12, detour: 0 },
    ],
  }, { pathWays: 2, parBlocks: 8, maxBlocks: 8 }),

  // ── THREE ROUTES (levels 7–15) - left lane + center spine + right lane ──
  mazeLevel(7, 'Triple Path', 'left detour, right bend, or straight up the middle', {
    width: W3, height: 12, startX: HUB, goalX: HUB, spineX: HUB,
    branches: [
      { side: 'left', splitY: 8, col: 2, detour: 4 },
      { side: 'right', splitY: 5, col: 12, detour: 2 },
    ],
  }, { pathWays: 3, parBlocks: 9, maxBlocks: 9 }, {
    teach: 'Three visible routes: left loop, center spine, right lane. Count blocks on each!',
    routinesEnabled: true, maxRoutineBlocks: 4,
  }),

  mazeLevel(8, 'Three Doors', 'each corridor has a different length - find the one that fits', {
    width: W3, height: 12, startX: HUB, goalX: HUB, spineX: HUB,
    branches: [
      { side: 'left', splitY: 8, col: 2, detour: 4 },
      { side: 'right', splitY: 6, col: 12, detour: 2 },
    ],
  }, { pathWays: 3, parBlocks: 9, maxBlocks: 9 }),

  mazeLevel(9, 'Triangle Maze', 'three branches peel off at different heights', {
    width: W3, height: 13, startX: HUB, goalX: HUB, spineX: HUB,
    branches: [
      { side: 'left', splitY: 9, col: 2, detour: 5 },
      { side: 'right', splitY: 5, col: 12, detour: 1 },
    ],
  }, { pathWays: 3, parBlocks: 10, maxBlocks: 10 }),

  mazeLevel(10, 'Weave Three', 'map left, center, and right - only one is short enough', {
    width: W3, height: 13, startX: HUB, goalX: HUB, spineX: HUB,
    branches: [
      { side: 'left', splitY: 9, col: 3, detour: 4 },
      { side: 'right', splitY: 6, col: 11, detour: 2 },
    ],
  }, { pathWays: 3, parBlocks: 10, maxBlocks: 10 }, { routinesEnabled: true, maxRoutineBlocks: 4 }),

  mazeLevel(11, 'Labyrinth II', 'three corridors merge at the top - trace each first', {
    width: W3, height: 14, startX: HUB, goalX: HUB, spineX: HUB,
    branches: [
      { side: 'left', splitY: 10, col: 2, detour: 5 },
      { side: 'right', splitY: 6, col: 12, detour: 3 },
    ],
  }, { pathWays: 3, parBlocks: 11, maxBlocks: 11 }),

  mazeLevel(12, 'Mirror Maze', 'symmetric corridors - different lengths hiding inside', {
    width: W3, height: 14, startX: HUB, goalX: HUB, spineX: HUB,
    branches: [
      { side: 'left', splitY: 10, col: 2, detour: 5 },
      { side: 'right', splitY: 5, col: 12, detour: 2 },
    ],
  }, { pathWays: 3, parBlocks: 11, maxBlocks: 11 }),

  mazeLevel(13, 'Routine Weave', 'three paths - compress the winning route into a routine', {
    width: W3, height: 14, startX: HUB, goalX: HUB, spineX: HUB,
    branches: [
      { side: 'left', splitY: 9, col: 3, detour: 4 },
      { side: 'right', splitY: 6, col: 11, detour: 3 },
    ],
  }, { pathWays: 3, parBlocks: 10, maxBlocks: 11 }, { routinesEnabled: true, maxRoutineBlocks: 5 }),

  mazeLevel(14, 'Deep Den', 'a deep maze with three exits - plan the full trip', {
    width: 17, height: 15, startX: 8, goalX: 8, spineX: 8,
    branches: [
      { side: 'left', splitY: 11, col: 2, detour: 5 },
      { side: 'right', splitY: 6, col: 14, detour: 3 },
    ],
  }, { pathWays: 3, parBlocks: 12, maxBlocks: 12 }, { routinesEnabled: true, maxRoutineBlocks: 5 }),

  mazeLevel(15, 'Trapfield', 'three corridors - wrong picks waste precious blocks', {
    width: 17, height: 15, startX: 8, goalX: 8, spineX: 8,
    branches: [
      { side: 'left', splitY: 11, col: 2, detour: 5 },
      { side: 'right', splitY: 7, col: 14, detour: 3 },
    ],
  }, { pathWays: 3, parBlocks: 12, maxBlocks: 12 }),

  // ── FIVE ROUTES (levels 16–20) ──
  mazeLevel(16, 'Pentagon Paths', 'five corridors - map every single one before coding', {
    width: W5, height: 14, startX: 8, goalX: 8, spineX: 8,
    branches: [
      { side: 'left', splitY: 10, col: 1, detour: 5 },
      { side: 'left', splitY: 9, col: 4, detour: 4 },
      { side: 'right', splitY: 5, col: 12, detour: 1 },
      { side: 'right', splitY: 8, col: 15, detour: 3 },
    ],
  }, { pathWays: 5, parBlocks: 11, maxBlocks: 11 }, {
    teach: 'Five lanes: far-left, left, center spine, right, far-right. Center is shortest!',
  }),

  mazeLevel(17, 'Mind Maze', 'five routes, one block budget - think like a planner', {
    width: W5, height: 14, startX: 8, goalX: 8, spineX: 8,
    branches: [
      { side: 'left', splitY: 10, col: 1, detour: 5 },
      { side: 'left', splitY: 8, col: 4, detour: 4 },
      { side: 'right', splitY: 5, col: 12, detour: 2 },
      { side: 'right', splitY: 9, col: 15, detour: 3 },
    ],
  }, { pathWays: 5, parBlocks: 11, maxBlocks: 11 }, { routinesEnabled: true, maxRoutineBlocks: 5 }),

  mazeLevel(18, 'Champion Corridor', 'the ultimate mapping challenge - five ways to the lily', {
    width: W5, height: 15, startX: 8, goalX: 8, spineX: 8,
    branches: [
      { side: 'left', splitY: 11, col: 1, detour: 5 },
      { side: 'left', splitY: 9, col: 4, detour: 4 },
      { side: 'right', splitY: 5, col: 12, detour: 2 },
      { side: 'right', splitY: 8, col: 15, detour: 4 },
    ],
  }, { pathWays: 5, parBlocks: 12, maxBlocks: 12 }, { routinesEnabled: true, maxRoutineBlocks: 6 }),

  mazeLevel(19, 'Final Twist', 'five corridors twist and merge - only one is short enough', {
    width: W5, height: 15, startX: 8, goalX: 8, spineX: 8,
    branches: [
      { side: 'left', splitY: 11, col: 2, detour: 5 },
      { side: 'left', splitY: 9, col: 4, detour: 4 },
      { side: 'right', splitY: 6, col: 12, detour: 2 },
      { side: 'right', splitY: 10, col: 15, detour: 3 },
    ],
  }, { pathWays: 5, parBlocks: 12, maxBlocks: 12 }, { routinesEnabled: true, maxRoutineBlocks: 6 }),

  mazeLevel(20, 'Golden Labyrinth', 'five routes, tight par - prove you mapped it all', {
    width: W5, height: 15, startX: 8, goalX: 8, spineX: 8,
    branches: [
      { side: 'left', splitY: 11, col: 1, detour: 5 },
      { side: 'left', splitY: 8, col: 4, detour: 4 },
      { side: 'right', splitY: 5, col: 12, detour: 2 },
      { side: 'right', splitY: 9, col: 15, detour: 4 },
    ],
  }, { pathWays: 5, parBlocks: 12, maxBlocks: 12 }, { routinesEnabled: true, maxRoutineBlocks: 8 }),
];
