'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

type CellType = 'empty' | 'path' | 'wall' | 'start' | 'goal' | 'fork' | 'trap';
type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

interface CommandBlock {
  id: string;
  type: 'IF_THEN' | 'IF_THEN_ELSE' | 'IF_ELSEIF_ELSE' | 'MOVE' | 'TURN_LEFT' | 'TURN_RIGHT';
  condition1?: string;
  thenAction?: string;
  elseAction?: string;
  condition2?: string;
  elseIfAction?: string;
}

interface LevelConfig {
  id: number;
  title: string;
  description: string;
  grid: CellType[][];
  start: Position;
  startDirection: Direction;
  goal: Position;
  availableBlocks: string[];
  maxBlocks: number;
  hint: string;
}

const levels: LevelConfig[] = [
  {
    id: 1,
    title: 'IF path left THEN go left GET star',
    description: 'IF path left THEN go left GET star.',
    grid: [
      ['empty', 'goal', 'empty', 'trap', 'empty'],
      ['empty', 'path', 'empty', 'path', 'empty'],
      ['empty', 'path', 'fork', 'path', 'empty'],
      ['empty', 'empty', 'path', 'empty', 'empty'],
      ['empty', 'empty', 'start', 'empty', 'empty'],
    ],
    start: { x: 2, y: 4 },
    startDirection: 'up',
    goal: { x: 1, y: 0 },
    availableBlocks: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_THEN'],
    maxBlocks: 6,
    hint: 'Add 2 MOVE to reach the fork, then IF path left THEN go left GET star!',
  },
  {
    id: 2,
    title: 'Three paths: IF star … ELSE IF star … ELSE',
    description: 'Use MOVE to reach the fork. Then IF star left THEN go left, ELSE IF star ahead THEN go ahead, ELSE go right. One path has the star!',
    grid: [
      ['empty', 'goal', 'trap', 'trap', 'empty'],
      ['empty', 'path', 'path', 'path', 'empty'],
      ['empty', 'path', 'fork', 'path', 'empty'],
      ['empty', 'empty', 'path', 'empty', 'empty'],
      ['empty', 'empty', 'path', 'empty', 'empty'],
      ['empty', 'empty', 'start', 'empty', 'empty'],
    ],
    start: { x: 2, y: 5 },
    startDirection: 'up',
    goal: { x: 1, y: 0 },
    availableBlocks: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_ELSEIF_ELSE'],
    maxBlocks: 6,
    hint: '3 MOVE to the fork. Then IF star left THEN go left GET star (else if star ahead / else go right).',
  },
  {
    id: 3,
    title: 'Longer Walk to the Fork',
    description: 'More steps to the fork — then IF path left THEN go left.',
    grid: [
      ['empty', 'goal', 'empty', 'trap', 'empty'],
      ['empty', 'path', 'empty', 'path', 'empty'],
      ['empty', 'path', 'empty', 'path', 'empty'],
      ['empty', 'path', 'fork', 'path', 'empty'],
      ['empty', 'empty', 'path', 'empty', 'empty'],
      ['empty', 'empty', 'start', 'empty', 'empty'],
    ],
    start: { x: 2, y: 5 },
    startDirection: 'up',
    goal: { x: 1, y: 0 },
    availableBlocks: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_THEN'],
    maxBlocks: 8,
    hint: 'Add 3 MOVE to reach the fork, then IF path left THEN go left.',
  },
  {
    id: 4,
    title: 'IF path left THEN … ELSE …',
    description: 'Use IF path left THEN go left, ELSE go right. One path has the star!',
    grid: [
      ['empty', 'goal', 'empty', 'trap', 'empty'],
      ['empty', 'path', 'empty', 'path', 'empty'],
      ['empty', 'path', 'fork', 'path', 'empty'],
      ['empty', 'empty', 'path', 'empty', 'empty'],
      ['empty', 'empty', 'start', 'empty', 'empty'],
    ],
    start: { x: 2, y: 4 },
    startDirection: 'up',
    goal: { x: 1, y: 0 },
    availableBlocks: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_THEN', 'IF_THEN_ELSE'],
    maxBlocks: 6,
    hint: '2 MOVE to fork. IF path left THEN go left ELSE go right. Left leads to star!',
  },
  {
    id: 5,
    title: 'Choose the Safe Path',
    description: 'Left = trap, right = star. Use IF and ELSE to go the right way.',
    grid: [
      ['empty', 'trap', 'empty', 'goal', 'empty'],
      ['empty', 'path', 'empty', 'path', 'empty'],
      ['empty', 'path', 'fork', 'path', 'empty'],
      ['empty', 'empty', 'path', 'empty', 'empty'],
      ['empty', 'empty', 'start', 'empty', 'empty'],
    ],
    start: { x: 2, y: 4 },
    startDirection: 'up',
    goal: { x: 3, y: 0 },
    availableBlocks: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_THEN', 'IF_THEN_ELSE'],
    maxBlocks: 6,
    hint: 'IF path right THEN go right ELSE go left. The star is on the right!',
  },
];

const conditionLabels: Record<string, string> = {
  pathLeft: 'path left',
  pathRight: 'path right',
  pathAhead: 'path ahead',
  starLeft: 'star left',
  starRight: 'star right',
  starAhead: 'star ahead',
};
const actionLabels: Record<string, string> = {
  moveForward: 'move forward',
  goAhead: 'go ahead',
  turnLeft: 'go left',
  turnRight: 'go right',
};

export default function UnderOneConditionGame() {
  const router = useRouter();
  const { addStars, recordAnswer, incrementGamesPlayed } = useGameStore();
  const [phase, setPhase] = useState<'intro' | 'weather' | 'level'>('intro');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>('day');
  const [weatherChoice, setWeatherChoice] = useState<'raining' | 'snowing' | 'sunny'>('raining');
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);

  const level = levels[currentLevelIndex];
  const [robotPos, setRobotPos] = useState<Position>(level?.start ?? { x: 0, y: 0 });
  const [robotDir, setRobotDir] = useState<Direction>(level?.startDirection ?? 'up');
  const [program, setProgram] = useState<CommandBlock[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [executingIndex, setExecutingIndex] = useState(-1);
  const [selectedBlockType, setSelectedBlockType] = useState<string | null>(null);
  const [condition1, setCondition1] = useState('pathLeft');
  const [thenAction, setThenAction] = useState('turnLeft');
  const [elseAction, setElseAction] = useState('turnRight');
  const [condition2, setCondition2] = useState('pathAhead');
  const [elseIfAction, setElseIfAction] = useState('moveForward');

  useEffect(() => {
    const l = levels[currentLevelIndex];
    if (l) {
      setRobotPos(l.start);
      setRobotDir(l.startDirection);
      setProgram([]);
      setIsRunning(false);
      setIsComplete(false);
      setIsFailed(false);
      setExecutingIndex(-1);
      if (l.id === 2) {
        setCondition1('starLeft');
        setCondition2('starAhead');
        setThenAction('turnLeft');
        setElseIfAction('moveForward');
        setElseAction('turnRight');
      }
    }
  }, [currentLevelIndex]);

  const getDirectionDelta = (dir: Direction): Position => {
    switch (dir) {
      case 'up': return { x: 0, y: -1 };
      case 'down': return { x: 0, y: 1 };
      case 'left': return { x: -1, y: 0 };
      case 'right': return { x: 1, y: 0 };
    }
  };

  const turnLeft = (dir: Direction): Direction => {
    const dirs: Direction[] = ['up', 'left', 'down', 'right'];
    return dirs[(dirs.indexOf(dir) + 1) % 4];
  };
  const turnRight = (dir: Direction): Direction => {
    const dirs: Direction[] = ['up', 'right', 'down', 'left'];
    return dirs[(dirs.indexOf(dir) + 1) % 4];
  };

  const getCellAt = (pos: Position, dir: Direction, offset: 'ahead' | 'left' | 'right'): CellType | null => {
    let checkDir = dir;
    if (offset === 'left') checkDir = turnLeft(dir);
    if (offset === 'right') checkDir = turnRight(dir);
    const delta = getDirectionDelta(checkDir);
    const nx = pos.x + delta.x, ny = pos.y + delta.y;
    if (nx < 0 || nx >= level.grid[0].length || ny < 0 || ny >= level.grid.length) return null;
    return level.grid[ny][nx];
  };

  const pathLeadsToGoal = (startPos: Position, startDir: Direction): boolean => {
    let p = { ...startPos }, d = startDir;
    for (let step = 0; step < 30; step++) {
      if (p.x === level.goal.x && p.y === level.goal.y) return true;
      const delta = getDirectionDelta(d);
      const nx = p.x + delta.x, ny = p.y + delta.y;
      if (nx < 0 || nx >= level.grid[0].length || ny < 0 || ny >= level.grid.length) return false;
      const cell = level.grid[ny][nx];
      if (cell === 'trap') return false;
      if (cell !== 'empty' && cell !== 'wall') {
        p = { x: nx, y: ny };
        if (cell === 'goal') return true;
      } else {
        d = turnRight(d);
      }
    }
    return false;
  };

  const evaluateCondition = (cond: string, pos: Position, dir: Direction, levelId?: number): boolean => {
    // Level 2: treat path conditions as star conditions (which way leads to goal?)
    const useStar =
      levelId === 2 &&
      (cond === 'pathLeft' || cond === 'pathRight' || cond === 'pathAhead');
    const effectiveCond = useStar
      ? (cond === 'pathLeft' ? 'starLeft' : cond === 'pathRight' ? 'starRight' : 'starAhead')
      : cond;

    if (effectiveCond === 'starLeft' || effectiveCond === 'starRight' || effectiveCond === 'starAhead') {
      const offset = effectiveCond === 'starLeft' ? 'left' : effectiveCond === 'starRight' ? 'right' : 'ahead';
      const cell = getCellAt(pos, dir, offset);
      if (cell === 'goal') return true;
      if (cell !== 'path' && cell !== 'fork') return false;
      const checkDir = offset === 'left' ? turnLeft(dir) : offset === 'right' ? turnRight(dir) : dir;
      const delta = getDirectionDelta(checkDir);
      const nx = pos.x + delta.x, ny = pos.y + delta.y;
      return pathLeadsToGoal({ x: nx, y: ny }, checkDir);
    }
    const cell = effectiveCond === 'pathLeft' ? getCellAt(pos, dir, 'left')
      : effectiveCond === 'pathRight' ? getCellAt(pos, dir, 'right')
      : getCellAt(pos, dir, 'ahead');
    return cell !== null && cell !== 'empty' && cell !== 'wall';
  };

  const executeAction = (action: string, pos: Position, dir: Direction): { pos: Position; dir: Direction; failed: boolean } => {
    let newPos = { ...pos }, newDir = dir, failed = false;
    if (action === 'moveForward') {
      const delta = getDirectionDelta(dir);
      const nx = pos.x + delta.x, ny = pos.y + delta.y;
      if (nx >= 0 && nx < level.grid[0].length && ny >= 0 && ny < level.grid.length) {
        const cell = level.grid[ny][nx];
        if (cell !== 'empty' && cell !== 'wall') {
          newPos = { x: nx, y: ny };
          if (cell === 'trap') failed = true;
        }
      }
    } else if (action === 'turnLeft') newDir = turnLeft(dir);
    else if (action === 'turnRight') newDir = turnRight(dir);
    return { pos: newPos, dir: newDir, failed };
  };

  const runProgram = async () => {
    if (program.length === 0 || isRunning) return;
    setIsRunning(true);
    setIsFailed(false);
    setIsComplete(false);
    let pos = { ...level.start };
    let dir = level.startDirection;
    setRobotPos(pos);
    setRobotDir(dir);

    const runGoAction = async (goAction: 'turnLeft' | 'turnRight' | 'moveForward'): Promise<{ pos: Position; dir: Direction; failed: boolean }> => {
      let p = { ...pos }, d = dir;
      if (goAction !== 'moveForward') {
        const result = executeAction(goAction, p, d);
        d = result.dir;
        setRobotDir(d);
        await new Promise(r => setTimeout(r, 300));
      }
      const maxSteps = 30;
      for (let step = 0; step < maxSteps; step++) {
        const moveResult = executeAction('moveForward', p, d);
        if (moveResult.pos.x !== p.x || moveResult.pos.y !== p.y) {
          p = moveResult.pos;
          setRobotPos(p);
          await new Promise(r => setTimeout(r, 400));
          if (moveResult.failed) return { pos: p, dir: d, failed: true };
          if (p.x === level.goal.x && p.y === level.goal.y) return { pos: p, dir: d, failed: false };
        } else {
          d = turnRight(d);
          setRobotDir(d);
          await new Promise(r => setTimeout(r, 200));
        }
      }
      return { pos: p, dir: d, failed: false };
    };

    for (let i = 0; i < program.length; i++) {
      setExecutingIndex(i);
      await new Promise(r => setTimeout(r, 500));
      const block = program[i];
      let action: string | null = null;
      if (block.type === 'MOVE') action = 'moveForward';
      else if (block.type === 'TURN_LEFT') action = 'turnLeft';
      else if (block.type === 'TURN_RIGHT') action = 'turnRight';
      else if (block.type === 'IF_THEN') {
        if (evaluateCondition(block.condition1!, pos, dir, level.id)) action = block.thenAction!;
      } else if (block.type === 'IF_THEN_ELSE') {
        action = evaluateCondition(block.condition1!, pos, dir, level.id) ? block.thenAction! : block.elseAction!;
      } else if (block.type === 'IF_ELSEIF_ELSE') {
        if (evaluateCondition(block.condition1!, pos, dir, level.id)) action = block.thenAction!;
        else if (evaluateCondition(block.condition2!, pos, dir, level.id)) action = block.elseIfAction!;
        else action = block.elseAction!;
      }
      if (action) {
        const isPathFollow = action === 'turnLeft' || action === 'turnRight' || action === 'moveForward';
        const fromMoveBlock = block.type === 'MOVE';
        // MOVE block = one step only. IF branch (go left / go ahead / go right) = follow path to goal/trap.
        if (fromMoveBlock) {
          const result = executeAction(action, pos, dir);
          pos = result.pos;
          dir = result.dir;
          setRobotPos(pos);
          setRobotDir(dir);
          await new Promise(r => setTimeout(r, 400));
          if (result.failed) {
            setIsFailed(true);
            setIsRunning(false);
            setExecutingIndex(-1);
            recordAnswer(false);
            return;
          }
          if (pos.x === level.goal.x && pos.y === level.goal.y) {
            setIsComplete(true);
            setShowConfetti(true);
            addStars(2);
            recordAnswer(true);
            incrementGamesPlayed();
            setTimeout(() => setShowConfetti(false), 3000);
            setIsRunning(false);
            setExecutingIndex(-1);
            return;
          }
        } else if (isPathFollow) {
          const result = await runGoAction(action as 'turnLeft' | 'turnRight' | 'moveForward');
          pos = result.pos;
          dir = result.dir;
          if (result.failed) {
            setIsFailed(true);
            setIsRunning(false);
            setExecutingIndex(-1);
            recordAnswer(false);
            return;
          }
          if (pos.x === level.goal.x && pos.y === level.goal.y) {
            setIsComplete(true);
            setShowConfetti(true);
            addStars(2);
            recordAnswer(true);
            incrementGamesPlayed();
            setTimeout(() => setShowConfetti(false), 3000);
            setIsRunning(false);
            setExecutingIndex(-1);
            return;
          }
        } else {
          const result = executeAction(action, pos, dir);
          pos = result.pos;
          dir = result.dir;
          setRobotPos(pos);
          setRobotDir(dir);
          if (result.failed) {
            setIsFailed(true);
            setIsRunning(false);
            setExecutingIndex(-1);
            recordAnswer(false);
            return;
          }
          if (pos.x === level.goal.x && pos.y === level.goal.y) {
            setIsComplete(true);
            setShowConfetti(true);
            addStars(2);
            recordAnswer(true);
            incrementGamesPlayed();
            setTimeout(() => setShowConfetti(false), 3000);
            setIsRunning(false);
            setExecutingIndex(-1);
            return;
          }
        }
      }
    }
    setIsRunning(false);
    setExecutingIndex(-1);
    if (pos.x === level.goal.x && pos.y === level.goal.y) {
      setIsComplete(true);
      setShowConfetti(true);
      addStars(2);
      recordAnswer(true);
      incrementGamesPlayed();
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const addBlock = (blockType?: string) => {
    const toAdd = blockType || selectedBlockType;
    if (!toAdd || program.length >= level.maxBlocks) return;
    const newBlock: CommandBlock = {
      id: `${Date.now()}-${Math.random()}`,
      type: toAdd as CommandBlock['type'],
    };
    if (toAdd === 'IF_THEN' || toAdd === 'IF_THEN_ELSE') {
      newBlock.condition1 = condition1;
      newBlock.thenAction = thenAction;
      if (toAdd === 'IF_THEN_ELSE') newBlock.elseAction = elseAction;
    }
    if (toAdd === 'IF_ELSEIF_ELSE') {
      newBlock.condition1 = condition1;
      newBlock.thenAction = thenAction;
      newBlock.condition2 = condition2;
      newBlock.elseIfAction = elseIfAction;
      newBlock.elseAction = elseAction;
    }
    setProgram(prev => [...prev, newBlock]);
    setSelectedBlockType(null);
  };

  const removeBlock = (id: string) => {
    if (!isRunning) setProgram(prev => prev.filter(b => b.id !== id));
  };

  const resetLevel = () => {
    if (!level) return;
    setRobotPos(level.start);
    setRobotDir(level.startDirection);
    setProgram([]);
    setIsRunning(false);
    setIsComplete(false);
    setIsFailed(false);
    setExecutingIndex(-1);
  };

  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex((i) => i + 1);
    } else {
      router.push('/dashboard');
    }
  };

  const getBlockDisplay = (block: CommandBlock): string => {
    if (block.type === 'MOVE') return '⬆️ Move';
    if (block.type === 'TURN_LEFT') return '↩️ Go Left';
    if (block.type === 'TURN_RIGHT') return '↪️ Go Right';
    if (block.type === 'IF_THEN') return `IF ${conditionLabels[block.condition1!]} THEN ${actionLabels[block.thenAction!]}`;
    if (block.type === 'IF_THEN_ELSE') return `IF ${conditionLabels[block.condition1!]} THEN ${actionLabels[block.thenAction!]} ELSE ${actionLabels[block.elseAction!]}`;
    if (block.type === 'IF_ELSEIF_ELSE') {
      const ta = block.thenAction === 'moveForward' ? 'go ahead' : actionLabels[block.thenAction!];
      const ea = block.elseIfAction === 'moveForward' ? 'go ahead' : actionLabels[block.elseIfAction!];
      const el = block.elseAction === 'moveForward' ? 'go ahead' : actionLabels[block.elseAction!];
      return `IF ${conditionLabels[block.condition1!]} THEN ${ta} ELSE IF ${conditionLabels[block.condition2!]} THEN ${ea} ELSE ${el}`;
    }
    return block.type;
  };

  if (phase === 'intro') {
    return (
      <main
        className={`min-h-screen min-h-[100dvh] transition-colors duration-700 ${
          timeOfDay === 'night'
            ? 'bg-gradient-to-b from-slate-950 via-indigo-950/90 to-slate-950'
            : 'bg-gradient-to-b from-sky-200 via-blue-100 to-sky-300'
        }`}
      >
        <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-10">
          <motion.button
            onClick={() => router.push('/dashboard')}
            className={`mb-4 sm:mb-6 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] touch-target ${
              timeOfDay === 'night' ? 'bg-white/10 text-gray-300 hover:text-white' : 'bg-black/10 text-gray-700 hover:bg-black/20'
            }`}
          >
            ← Back
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4 sm:mb-6"
          >
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-2 ${timeOfDay === 'night' ? 'text-white' : 'text-slate-800'}`}>
              Under One Condition
            </h1>
            <p className={`text-sm mb-1 ${timeOfDay === 'night' ? 'text-gray-400' : 'text-slate-600'}`}>
              Opening — not a level, just to teach
            </p>
            <p className={timeOfDay === 'night' ? 'text-gray-400' : 'text-slate-600'}>
              Programs use <strong>if</strong>, <strong>then</strong>, and <strong>else</strong> to choose.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 ${
              timeOfDay === 'night' ? 'bg-white/5 border border-white/10' : 'bg-white/60 border border-white/80'
            }`}
          >
            <h2 className={`text-lg font-semibold mb-2 ${timeOfDay === 'night' ? 'text-cyan-300' : 'text-slate-700'}`}>
              All conditions: if → then, else
            </h2>
            <p className={`text-sm mb-3 ${timeOfDay === 'night' ? 'text-gray-400' : 'text-slate-600'}`}>
              <strong>If</strong> something is true, do one thing. <strong>Else</strong>, do another. Example: the sky.
            </p>
            <p className={`text-sm mb-4 ${timeOfDay === 'night' ? 'text-gray-400' : 'text-slate-600'}`}>
              <strong>If</strong> night → screen and clouds go dark. <strong>Else</strong> (day) → screen and clouds go light. Try it:
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label className={timeOfDay === 'night' ? 'text-gray-300' : 'text-slate-600'}>
                {timeOfDay === 'day' ? 'IF' : 'ELSE'}
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value as 'day' | 'night')}
                className={`px-4 py-2 rounded-xl font-medium focus:ring-2 focus:ring-cyan-400 outline-none ${
                  timeOfDay === 'night'
                    ? 'bg-slate-800 text-white border border-slate-600'
                    : 'bg-white text-slate-800 border border-slate-300'
                }`}
              >
                <option value="day">Day</option>
                <option value="night">Night</option>
              </select>
            </div>
          </motion.div>

          {/* Sky / cloud area - reacts to dropdown */}
          <motion.div
            layout
            className={`relative rounded-2xl overflow-hidden min-h-[180px] flex items-center justify-center ${
              timeOfDay === 'night' ? 'bg-slate-900/80' : 'bg-sky-300/80'
            }`}
          >
            <AnimatePresence mode="wait">
              {timeOfDay === 'night' ? (
                <motion.div
                  key="night"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-6xl">🌙</span>
                  <span className="absolute text-4xl left-1/4 top-1/3 opacity-80">✨</span>
                  <span className="absolute text-3xl right-1/4 top-1/4 opacity-70">✨</span>
                </motion.div>
              ) : (
                <motion.div
                  key="day"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-7xl">☀️</span>
                  <span className="absolute text-4xl right-1/4 top-1/3 opacity-90">☁️</span>
                  <span className="absolute text-3xl left-1/3 top-1/4 opacity-80">☁️</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`text-center text-sm mt-2 ${timeOfDay === 'night' ? 'text-gray-500' : 'text-slate-500'}`}
          >
            {timeOfDay === 'night' ? 'Screen and clouds are dark (night).' : 'Screen and clouds are light (day).'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex flex-col items-center gap-3"
          >
            <motion.button
              onClick={() => setPhase('weather')}
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg hover:from-cyan-400 hover:to-blue-500 min-h-[48px] touch-target w-full sm:w-auto"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Next →
            </motion.button>
            <button
              type="button"
              onClick={() => setPhase('level')}
              className={`text-sm underline ${timeOfDay === 'night' ? 'text-gray-500 hover:text-gray-400' : 'text-slate-500 hover:text-slate-600'}`}
            >
              Skip to Level 1
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  if (phase === 'weather') {
    const isRaining = weatherChoice === 'raining';
    const isSnowing = weatherChoice === 'snowing';
    const isSunny = weatherChoice === 'sunny';
    return (
      <main
        className={`min-h-screen transition-colors duration-700 overflow-hidden ${
          isSunny
            ? 'bg-gradient-to-b from-sky-200 via-blue-100 to-sky-300'
            : isRaining
              ? 'bg-gradient-to-b from-slate-400 via-slate-500 to-slate-600'
              : 'bg-gradient-to-b from-slate-300 via-slate-200 to-slate-400'
        }`}
      >
        <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-10 relative z-10">
          <motion.button
            onClick={() => setPhase('intro')}
            className={`mb-6 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isSunny ? 'bg-black/10 text-gray-700 hover:bg-black/20' : 'bg-white/20 text-slate-800 hover:bg-white/30'
            }`}
          >
            ← Back
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${isSunny ? 'text-slate-800' : 'text-slate-900'}`}>
              If … else if … else
            </h1>
            <p className={`text-sm ${isSunny ? 'text-slate-600' : 'text-slate-700'}`}>
              Different conditions lead to different actions. Try each one:
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl p-6 mb-6 ${
              isSunny ? 'bg-white/60 border border-white/80' : 'bg-white/70 border border-white/90'
            }`}
          >
            <p className="text-sm mb-2 font-medium text-slate-700">Choose the weather:</p>
            <ul className="text-sm text-slate-600 mb-4 space-y-1">
              <li><strong>If raining</strong> → take an umbrella</li>
              <li><strong>Else if snow falling</strong> → take a jacket</li>
              <li><strong>Else</strong> (do nothing) → sun shining</li>
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-slate-700 font-medium">Show:</label>
              <select
                value={weatherChoice}
                onChange={(e) => setWeatherChoice(e.target.value as 'raining' | 'snowing' | 'sunny')}
                className="px-4 py-2 rounded-xl font-medium bg-white text-slate-800 border border-slate-300 focus:ring-2 focus:ring-cyan-400 outline-none"
              >
                <option value="raining">If raining — take umbrella</option>
                <option value="snowing">Else if snow — take jacket</option>
                <option value="sunny">Else — do nothing (sun)</option>
              </select>
            </div>
          </motion.div>

          {/* Visual area: rain / snow / sun */}
          <motion.div
            layout
            className={`relative rounded-2xl overflow-hidden min-h-[220px] flex items-center justify-center ${
              isSunny ? 'bg-sky-300/80' : isRaining ? 'bg-slate-500/90' : 'bg-slate-400/90'
            }`}
          >
            {/* Rain streaks */}
            {isRaining && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="rain-streak"
                    style={{
                      left: `${(i * 100) / 41}%`,
                      animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                      animationDelay: `${(i % 8) * 0.05}s`,
                    }}
                  />
                ))}
              </div>
            )}
            {/* Snowflakes */}
            {isSnowing && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className="snow-flake"
                    style={{
                      left: `${(i * 100) / 36}%`,
                      animationDuration: `${2.5 + (i % 4) * 0.8}s`,
                      animationDelay: `${(i % 10) * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <AnimatePresence mode="wait">
              {isRaining && (
                <motion.div
                  key="rain-action"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute flex flex-col items-center justify-center gap-2 z-10"
                >
                  <span className="text-6xl">☂️</span>
                  <span className="text-slate-800 font-bold">Take an umbrella</span>
                </motion.div>
              )}
              {isSnowing && (
                <motion.div
                  key="snow-action"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute flex flex-col items-center justify-center gap-2 z-10"
                >
                  <span className="text-6xl">🧥</span>
                  <span className="text-slate-800 font-bold">Take a jacket</span>
                </motion.div>
              )}
              {isSunny && (
                <motion.div
                  key="sun-action"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute flex flex-col items-center justify-center gap-2 z-10"
                >
                  <span className="text-7xl">☀️</span>
                  <span className="text-slate-700 font-bold">Do nothing — sun is shining</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex flex-col items-center gap-3"
          >
            <motion.button
              onClick={() => setPhase('level')}
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg hover:from-cyan-400 hover:to-blue-500 min-h-[48px] touch-target w-full sm:w-auto"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="hidden sm:inline">Start Level 1 (two routes, block code) →</span>
              <span className="sm:hidden">Start Level 1 →</span>
            </motion.button>
          </motion.div>
        </div>
      </main>
    );
  }

  // --- Level phase: block coding, two routes ---
  const cellColor = (cell: CellType): string => {
    switch (cell) {
      case 'empty': return 'bg-slate-800';
      case 'path': return 'bg-slate-600';
      case 'wall': return 'bg-slate-900';
      case 'start': return 'bg-blue-600';
      case 'goal': return 'bg-amber-500';
      case 'fork': return 'bg-purple-600';
      case 'trap': return 'bg-red-600';
      default: return 'bg-slate-700';
    }
  };

  const cellEmoji: Record<CellType, string> = {
    empty: '', path: '', wall: '🧱', start: '', goal: '⭐', fork: '🔀', trap: '🔥',
  };

  return (
    <main className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-4 md:p-6">
      <Confetti show={showConfetti} />

      <header className="max-w-4xl mx-auto mb-3 sm:mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
        <motion.button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:text-white text-sm min-h-[44px] touch-target order-2 sm:order-1 w-full sm:w-auto"
        >
          ← Back
        </motion.button>
        <div className="flex items-center gap-2 justify-between sm:justify-end order-1 sm:order-2 min-w-0">
          <span className="text-gray-400 text-xs sm:text-sm flex-shrink-0">Level</span>
          <select
            value={currentLevelIndex}
            onChange={(e) => setCurrentLevelIndex(Number(e.target.value))}
            className="bg-white/10 border border-white/20 rounded-xl px-2 sm:px-3 py-2 text-white font-bold focus:ring-2 focus:ring-cyan-400 outline-none cursor-pointer min-h-[44px] touch-target max-w-[70vw] sm:max-w-none text-sm sm:text-base"
            title="Testing: jump to any level"
          >
            {levels.map((l, idx) => (
              <option key={l.id} value={idx} className="bg-slate-800 text-white">
                {idx + 1} — {l.title}
              </option>
            ))}
          </select>
          <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0">/ {levels.length}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        <motion.div className="text-center mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Under One Condition</h1>
          <p className="text-cyan-400 text-xs sm:text-sm">Block code: two routes</p>
        </motion.div>

        <motion.div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white mb-0.5 sm:mb-1">{level.title}</h2>
          <p className="text-gray-400 text-xs sm:text-sm leading-snug">{level.description}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          {/* Grid */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 sm:p-4 flex justify-center md:justify-start overflow-x-auto">
            <div className="inline-grid gap-0 border-2 border-slate-600 rounded-lg overflow-hidden flex-shrink-0" style={{ gridTemplateColumns: `repeat(${level.grid[0].length}, 1fr)` }}>
              {level.grid.map((row, ry) =>
                row.map((cell, cx) => {
                  const isRobot = robotPos.x === cx && robotPos.y === ry;
                  return (
                    <div
                      key={`${cx}-${ry}`}
                      className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center border border-slate-700 ${cellColor(cell)}`}
                    >
                      {isRobot ? (
                        <motion.span
                          className="text-xl sm:text-2xl"
                          style={{ transform: `rotate(${robotDir === 'up' ? 0 : robotDir === 'right' ? 90 : robotDir === 'down' ? 180 : 270}deg)` }}
                        >
                          🤖
                        </motion.span>
                      ) : (
                        <span className="text-base sm:text-xl">{cellEmoji[cell]}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Program + blocks */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 sm:p-4 min-w-0">
            <h3 className="text-white font-bold mb-2 text-sm sm:text-base">Your program</h3>
            {currentLevelIndex === 0 && (
              <div className="mb-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-mono bg-cyan-900/30 text-cyan-300 border border-cyan-500/40">
                IF path left THEN go left GET star
              </div>
            )}
            <div className="space-y-1 mb-3 min-h-[80px] sm:min-h-[120px]">
              {program.map((block, idx) => (
                <motion.div
                  key={block.id}
                  layout
                  className={`flex items-center justify-between gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-mono ${
                    executingIndex === idx ? 'bg-cyan-500/30 ring-1 ring-cyan-400' : 'bg-slate-800'
                  }`}
                >
                  <span className="text-gray-200 break-words min-w-0 flex-1">{getBlockDisplay(block)}</span>
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    disabled={isRunning}
                    className="text-red-400 hover:text-red-300 disabled:opacity-50 flex-shrink-0 min-w-[44px] min-h-[44px] touch-target flex items-center justify-center -m-1"
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
              {level.availableBlocks.map((type) => {
                const isSimple = type === 'MOVE' || type === 'TURN_LEFT' || type === 'TURN_RIGHT';
                return (
                  <button
                    key={type}
                    onClick={() => {
                      if (isSimple) addBlock(type);
                      else setSelectedBlockType(type === selectedBlockType ? null : type);
                    }}
                    disabled={program.length >= level.maxBlocks}
                    className={`px-2 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-mono disabled:opacity-50 min-h-[44px] touch-target ${
                      selectedBlockType === type ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {type === 'IF_THEN' ? 'IF … THEN' : type === 'IF_THEN_ELSE' ? 'IF … ELSE' : type === 'IF_ELSEIF_ELSE' ? 'IF … ELSE IF … ELSE' : type.replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>

            {selectedBlockType && (selectedBlockType === 'IF_THEN' || selectedBlockType === 'IF_THEN_ELSE') && (
              <div className="bg-slate-800 rounded-lg p-3 mb-3 text-xs sm:text-sm">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-gray-400">IF</span>
                  <select
                    value={condition1}
                    onChange={(e) => setCondition1(e.target.value)}
                    className="bg-slate-700 text-white rounded px-2 py-1.5 min-h-[40px] sm:min-h-0 flex-1 min-w-0 max-w-[140px] sm:max-w-none"
                  >
                    <option value="pathLeft">path left</option>
                    <option value="pathRight">path right</option>
                    <option value="pathAhead">path ahead</option>
                    <option value="starLeft">star left</option>
                    <option value="starRight">star right</option>
                    <option value="starAhead">star ahead</option>
                  </select>
                  <span className="text-gray-400">THEN</span>
                  <select
                    value={thenAction}
                    onChange={(e) => setThenAction(e.target.value)}
                    className="bg-slate-700 text-white rounded px-2 py-1.5 min-h-[40px] sm:min-h-0 flex-1 min-w-0 max-w-[120px] sm:max-w-none"
                  >
                    <option value="turnLeft">go left</option>
                    <option value="turnRight">go right</option>
                    <option value="moveForward">go ahead</option>
                  </select>
                </div>
                {selectedBlockType === 'IF_THEN_ELSE' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-400">ELSE</span>
                    <select
                      value={elseAction}
                      onChange={(e) => setElseAction(e.target.value)}
                      className="bg-slate-700 text-white rounded px-2 py-1.5 min-h-[40px] sm:min-h-0 flex-1 min-w-0 max-w-[120px] sm:max-w-none"
                    >
                      <option value="turnLeft">go left</option>
                      <option value="turnRight">go right</option>
                      <option value="moveForward">go ahead</option>
                    </select>
                  </div>
                )}
                <button type="button" onClick={() => addBlock()} className="mt-2 px-3 py-2 bg-cyan-600 rounded text-white text-xs min-h-[40px] touch-target">
                  Add block
                </button>
              </div>
            )}

            {selectedBlockType === 'IF_ELSEIF_ELSE' && (
              <div className="bg-slate-800 rounded-lg p-3 mb-3 text-xs sm:text-sm space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-400">IF</span>
                  <select value={condition1} onChange={(e) => setCondition1(e.target.value)} className="bg-slate-700 text-white rounded px-2 py-1.5 min-h-[40px] sm:min-h-0 flex-1 min-w-0 max-w-[130px] sm:max-w-none">
                    <option value="pathLeft">path left</option>
                    <option value="pathRight">path right</option>
                    <option value="pathAhead">path ahead</option>
                    <option value="starLeft">star left</option>
                    <option value="starRight">star right</option>
                    <option value="starAhead">star ahead</option>
                  </select>
                  <span className="text-gray-400">THEN</span>
                  <select value={thenAction} onChange={(e) => setThenAction(e.target.value)} className="bg-slate-700 text-white rounded px-2 py-1.5 min-h-[40px] sm:min-h-0 flex-1 min-w-0 max-w-[120px] sm:max-w-none">
                    <option value="turnLeft">go left</option>
                    <option value="turnRight">go right</option>
                    <option value="moveForward">go ahead</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-400">ELSE IF</span>
                  <select value={condition2} onChange={(e) => setCondition2(e.target.value)} className="bg-slate-700 text-white rounded px-2 py-1.5 min-h-[40px] sm:min-h-0 flex-1 min-w-0 max-w-[130px] sm:max-w-none">
                    <option value="pathLeft">path left</option>
                    <option value="pathRight">path right</option>
                    <option value="pathAhead">path ahead</option>
                    <option value="starLeft">star left</option>
                    <option value="starRight">star right</option>
                    <option value="starAhead">star ahead</option>
                  </select>
                  <span className="text-gray-400">THEN</span>
                  <select value={elseIfAction} onChange={(e) => setElseIfAction(e.target.value)} className="bg-slate-700 text-white rounded px-2 py-1">
                    <option value="turnLeft">go left</option>
                    <option value="turnRight">go right</option>
                    <option value="moveForward">go ahead</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-400">ELSE</span>
                  <select value={elseAction} onChange={(e) => setElseAction(e.target.value)} className="bg-slate-700 text-white rounded px-2 py-1">
                    <option value="turnLeft">go left</option>
                    <option value="turnRight">go right</option>
                    <option value="moveForward">go ahead</option>
                  </select>
                </div>
                <button type="button" onClick={() => addBlock()} className="mt-2 px-3 py-1 bg-cyan-600 rounded text-white text-xs">
                  Add block
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <motion.button
                onClick={runProgram}
                disabled={isRunning || program.length === 0}
                className="flex-1 py-2 rounded-xl bg-cyan-600 text-white font-bold disabled:opacity-50"
              >
                {isRunning ? 'Running…' : '▶ Run'}
              </motion.button>
              <motion.button
                onClick={resetLevel}
                disabled={isRunning}
                className="px-4 py-2 rounded-xl bg-slate-700 text-gray-300 disabled:opacity-50"
              >
                Reset
              </motion.button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
          <span className="text-amber-500 text-xs sm:text-sm">💡 </span>
          <span className="text-gray-400 text-xs sm:text-sm">{level.hint}</span>
        </div>

        <AnimatePresence>
          {(isComplete || isFailed) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-xl p-4 sm:p-6 text-center mb-4 ${isComplete ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}
            >
              {isComplete ? (
                <>
                  <div className="text-3xl sm:text-4xl mb-2">🎉</div>
                  <div className="text-green-400 font-bold text-base sm:text-lg">You reached the star!</div>
                  <motion.button
                    onClick={nextLevel}
                    className="mt-4 px-6 py-3 rounded-xl bg-green-600 text-white font-bold min-h-[48px] touch-target"
                  >
                    {currentLevelIndex < levels.length - 1 ? 'Next Level' : 'Done'}
                  </motion.button>
                </>
              ) : (
                <>
                  <div className="text-3xl sm:text-4xl mb-2">💥</div>
                  <div className="text-red-400 font-bold text-sm sm:text-base">Hit a trap. Adjust your blocks and try again!</div>
                  <motion.button onClick={resetLevel} className="mt-4 px-6 py-3 rounded-xl bg-slate-600 text-white min-h-[48px] touch-target">
                    Try again
                  </motion.button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
