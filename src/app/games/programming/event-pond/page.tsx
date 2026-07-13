'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

type Command = 'forward' | 'left' | 'right';
type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

interface Level {
  id: number;
  name: string;
  gridSize: number;
  frogStart: Position;
  frogDirection: Direction;
  goal: Position;
  obstacles: Position[];
  path: Position[];
  /** Reed bells — landing here runs the bell handler (event). */
  bells: Position[];
  maxCommands: number;
  maxBellCommands: number;
  hint: string;
  tutorial?: string;
}

interface ProgramBlock {
  id: string;
  command: Command;
}

const commandIcons: Record<Command, { icon: string; label: string; color: string }> = {
  forward: { icon: '🐸', label: 'Hop', color: '#22c55e' },
  left: { icon: '↩️', label: 'Turn left', color: '#84cc16' },
  right: { icon: '↪️', label: 'Turn right', color: '#14b8a6' },
};

const levels: Level[] = [
  {
    id: 1,
    name: 'Main path only',
    gridSize: 5,
    frogStart: { x: 0, y: 4 },
    frogDirection: 'right',
    goal: { x: 4, y: 4 },
    obstacles: [],
    path: [
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ],
    bells: [],
    maxCommands: 8,
    maxBellCommands: 6,
    tutorial: 'Next levels add 🔔 bell pads. For now, hop straight to the fly!',
    hint: 'Four hops to the right.',
  },
  {
    id: 2,
    name: 'First bell',
    gridSize: 5,
    frogStart: { x: 0, y: 4 },
    frogDirection: 'right',
    goal: { x: 4, y: 4 },
    obstacles: [],
    path: [
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ],
    bells: [{ x: 1, y: 4 }],
    maxCommands: 6,
    maxBellCommands: 4,
    tutorial: 'When you land on a bell, your bell script runs once — like code that reacts to an event!',
    hint: 'Main: three hops. Bell handler: one extra hop — your first step lands on the bell at (1,4).',
  },
  {
    id: 3,
    name: 'Bell turns the corner',
    gridSize: 5,
    frogStart: { x: 0, y: 4 },
    frogDirection: 'right',
    goal: { x: 4, y: 0 },
    obstacles: [],
    path: [
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 3 },
      { x: 4, y: 2 },
      { x: 4, y: 1 },
      { x: 4, y: 0 },
    ],
    bells: [{ x: 3, y: 4 }],
    maxCommands: 8,
    maxBellCommands: 5,
    hint: 'Reach the bell before the corner; the handler can turn and hop up so the main script stays short.',
  },
  {
    id: 4,
    name: 'Two bells, one handler',
    gridSize: 6,
    frogStart: { x: 0, y: 5 },
    frogDirection: 'right',
    goal: { x: 5, y: 0 },
    obstacles: [{ x: 2, y: 3 }, { x: 3, y: 3 }],
    path: [
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 2, y: 5 },
      { x: 2, y: 4 },
      { x: 1, y: 4 },
      { x: 1, y: 3 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 4, y: 1 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
    ],
    bells: [
      { x: 1, y: 5 },
      { x: 2, y: 2 },
    ],
    maxCommands: 9,
    maxBellCommands: 4,
    tutorial: 'Same bell script runs for every bell — like one callback wired to two buttons!',
    hint: 'Use a small handler that always makes sense when you hit any bell on this route.',
  },
  {
    id: 5,
    name: 'Rock and ring',
    gridSize: 6,
    frogStart: { x: 0, y: 5 },
    frogDirection: 'up',
    goal: { x: 5, y: 0 },
    obstacles: [],
    path: [
      { x: 0, y: 5 },
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
    ],
    bells: [{ x: 0, y: 4 }],
    maxCommands: 10,
    maxBellCommands: 5,
    hint: 'Start facing up. The first cell has a bell — plan the handler so you zig toward the fly.',
  },
  {
    id: 6,
    name: 'Long main, tiny events',
    gridSize: 7,
    frogStart: { x: 0, y: 6 },
    frogDirection: 'right',
    goal: { x: 6, y: 0 },
    obstacles: [{ x: 3, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 3 }],
    path: [
      { x: 0, y: 6 },
      { x: 1, y: 6 },
      { x: 2, y: 6 },
      { x: 2, y: 5 },
      { x: 2, y: 4 },
      { x: 2, y: 3 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 5, y: 2 },
      { x: 5, y: 1 },
      { x: 5, y: 0 },
      { x: 6, y: 0 },
    ],
    bells: [{ x: 2, y: 5 }],
    maxCommands: 8,
    maxBellCommands: 6,
    hint: 'Let the bell nudge you past the tight spot so the main script stays under the limit.',
  },
  {
    id: 7,
    name: 'Bell alley',
    gridSize: 7,
    frogStart: { x: 0, y: 6 },
    frogDirection: 'right',
    goal: { x: 6, y: 6 },
    obstacles: [
      { x: 2, y: 4 },
      { x: 2, y: 5 },
      { x: 4, y: 1 },
      { x: 4, y: 2 },
    ],
    path: [
      { x: 0, y: 6 },
      { x: 1, y: 6 },
      { x: 1, y: 5 },
      { x: 1, y: 4 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 3, y: 4 },
      { x: 3, y: 5 },
      { x: 3, y: 6 },
      { x: 4, y: 6 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
    ],
    bells: [{ x: 1, y: 5 }],
    maxCommands: 9,
    maxBellCommands: 5,
    hint: 'The bell sits on the narrow strip — handler adjusts heading while main walks the long way.',
  },
  {
    id: 8,
    name: 'Grand splash finale',
    gridSize: 8,
    frogStart: { x: 0, y: 7 },
    frogDirection: 'right',
    goal: { x: 7, y: 0 },
    obstacles: [],
    path: [
      { x: 0, y: 7 },
      { x: 1, y: 7 },
      { x: 2, y: 7 },
      { x: 2, y: 6 },
      { x: 2, y: 5 },
      { x: 3, y: 5 },
      { x: 4, y: 5 },
      { x: 4, y: 4 },
      { x: 4, y: 3 },
      { x: 5, y: 3 },
      { x: 6, y: 3 },
      { x: 6, y: 2 },
      { x: 6, y: 1 },
      { x: 6, y: 0 },
      { x: 7, y: 0 },
    ],
    bells: [
      { x: 2, y: 7 },
      { x: 4, y: 5 },
    ],
    maxCommands: 10,
    maxBellCommands: 6,
    hint: 'Chain main moves with a reusable bell reaction — two bells, one handler mindset.',
  },
];

function getDirectionDelta(direction: Direction): Position {
  switch (direction) {
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

function turnLeft(direction: Direction): Direction {
  const turns: Record<Direction, Direction> = { up: 'left', left: 'down', down: 'right', right: 'up' };
  return turns[direction];
}

function turnRight(direction: Direction): Direction {
  const turns: Record<Direction, Direction> = { up: 'right', right: 'down', down: 'left', left: 'up' };
  return turns[direction];
}

function getRotation(direction: Direction): number {
  const rotations: Record<Direction, number> = { up: 0, right: 90, down: 180, left: 270 };
  return rotations[direction];
}

function isBellAt(level: Level, pos: Position): boolean {
  return level.bells.some((b) => b.x === pos.x && b.y === pos.y);
}

export default function BellLilyPondPage() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();
  const blockIdRef = useRef(0);

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [mainProgram, setMainProgram] = useState<ProgramBlock[]>([]);
  const [bellProgram, setBellProgram] = useState<ProgramBlock[]>([]);
  const [editBell, setEditBell] = useState(false);
  const [frogPos, setFrogPos] = useState<Position>({ x: 0, y: 0 });
  const [frogDir, setFrogDir] = useState<Direction>('right');
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [executingMainIndex, setExecutingMainIndex] = useState(-1);
  const [executingBell, setExecutingBell] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hitObstacle, setHitObstacle] = useState(false);

  const level = levels[currentLevelIndex];
  const hasBells = level.bells.length > 0;

  const resetLevel = useCallback(() => {
    if (level) {
      setFrogPos(level.frogStart);
      setFrogDir(level.frogDirection);
      setMainProgram([]);
      setBellProgram([]);
      setEditBell(false);
      setIsRunning(false);
      setIsComplete(false);
      setExecutingMainIndex(-1);
      setExecutingBell(false);
      setShowHint(false);
      setHitObstacle(false);
    }
  }, [level]);

  useEffect(() => {
    resetLevel();
  }, [resetLevel, currentLevelIndex]);

  useEffect(() => {
    if (!hitObstacle) return;
    const t = setTimeout(() => setHitObstacle(false), 3200);
    return () => clearTimeout(t);
  }, [hitObstacle]);

  const addCommand = (command: Command) => {
    if (isRunning) return;
    if (editBell) {
      if (bellProgram.length < level.maxBellCommands) {
        blockIdRef.current += 1;
        setBellProgram((prev) => [...prev, { id: `b-${blockIdRef.current}`, command }]);
      }
    } else if (mainProgram.length < level.maxCommands) {
      blockIdRef.current += 1;
      setMainProgram((prev) => [...prev, { id: `m-${blockIdRef.current}`, command }]);
    }
  };

  const removeBlock = (id: string, fromBell: boolean) => {
    if (isRunning) return;
    if (fromBell) setBellProgram((p) => p.filter((x) => x.id !== id));
    else setMainProgram((p) => p.filter((x) => x.id !== id));
  };

  const clearMain = () => {
    if (!isRunning) setMainProgram([]);
  };

  const clearBell = () => {
    if (!isRunning) setBellProgram([]);
  };

  const executeCommands = async () => {
    if (mainProgram.length === 0 || isRunning) return;
    if (hasBells && bellProgram.length === 0) return;

    setIsRunning(true);
    setHitObstacle(false);
    let pos = { ...level.frogStart };
    let dir = level.frogDirection;

    const winAndStop = () => {
      setIsComplete(true);
      setShowConfetti(true);
      const levelScore = Math.max(18, 52 - mainProgram.length * 3 - bellProgram.length * 2);
      setScore((prev) => prev + levelScore);
      addStars(4);
      recordAnswer(true);
      incrementGamesPlayed();
      setTimeout(() => setShowConfetti(false), 3000);
      setExecutingMainIndex(-1);
      setExecutingBell(false);
      setIsRunning(false);
    };

    type StepResult = 'win' | 'ok' | 'crash';

    const runOne = async (cmd: Command): Promise<StepResult> => {
      if (cmd === 'left') {
        dir = turnLeft(dir);
        setFrogDir(dir);
      } else if (cmd === 'right') {
        dir = turnRight(dir);
        setFrogDir(dir);
      } else if (cmd === 'forward') {
        const delta = getDirectionDelta(dir);
        const newPos = { x: pos.x + delta.x, y: pos.y + delta.y };
        if (
          newPos.x < 0 ||
          newPos.x >= level.gridSize ||
          newPos.y < 0 ||
          newPos.y >= level.gridSize
        ) {
          setHitObstacle(true);
          return 'crash';
        }
        if (level.obstacles.some((o) => o.x === newPos.x && o.y === newPos.y)) {
          setHitObstacle(true);
          return 'crash';
        }
        pos = newPos;
        setFrogPos({ ...pos });
      }
      if (pos.x === level.goal.x && pos.y === level.goal.y) return 'win';
      return 'ok';
    };

    const runBellHandler = async (): Promise<boolean> => {
      if (!hasBells || bellProgram.length === 0 || !isBellAt(level, pos)) return false;
      setExecutingBell(true);
      for (let k = 0; k < bellProgram.length; k++) {
        await new Promise((r) => setTimeout(r, 220));
        const step = await runOne(bellProgram[k]!.command);
        if (step === 'win') {
          setExecutingBell(false);
          return true;
        }
        if (step === 'crash') {
          setExecutingBell(false);
          setIsRunning(false);
          setExecutingMainIndex(-1);
          recordAnswer(false);
          return false;
        }
      }
      setExecutingBell(false);
      if (pos.x === level.goal.x && pos.y === level.goal.y) return true;
      return false;
    };

    for (let i = 0; i < mainProgram.length; i++) {
      setExecutingMainIndex(i);
      await new Promise((r) => setTimeout(r, 260));

      const cmd = mainProgram[i]!.command;
      const step = await runOne(cmd);
      if (step === 'win') {
        winAndStop();
        return;
      }
      if (step === 'crash') {
        setExecutingMainIndex(-1);
        setIsRunning(false);
        recordAnswer(false);
        return;
      }

      if (hasBells && isBellAt(level, pos) && bellProgram.length > 0) {
        let guard = 0;
        while (isBellAt(level, pos) && bellProgram.length > 0 && guard < 12) {
          guard += 1;
          const won = await runBellHandler();
          if (won) {
            winAndStop();
            return;
          }
          if (!isRunning) return;
          if (!isBellAt(level, pos)) break;
        }
      }

      if (pos.x === level.goal.x && pos.y === level.goal.y) {
        winAndStop();
        return;
      }
    }

    setExecutingMainIndex(-1);
    setExecutingBell(false);
    setIsRunning(false);
    if (pos.x !== level.goal.x || pos.y !== level.goal.y) {
      recordAnswer(false);
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex((p) => p + 1);
    } else {
      router.push('/games/programming');
    }
  };

  if (!level) return null;

  const cellSize = level.gridSize <= 6 ? 50 : level.gridSize <= 7 ? 44 : 38;

  const canRun =
    mainProgram.length > 0 && (!hasBells || bellProgram.length > 0) && !isRunning && !isComplete;

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-4 md:p-6 relative overflow-hidden bg-gradient-to-b from-violet-950 via-indigo-950/90 to-slate-950">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.1] z-0"
        style={{
          backgroundImage: 'radial-gradient(ellipse 70% 45% at 50% 100%, #a78bfa 0%, transparent 55%)',
        }}
      />
      <Confetti show={showConfetti} />

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <motion.button
            onClick={() => router.push('/games/programming')}
            className="glass px-3 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors text-sm min-h-[44px] touch-target border border-violet-500/25"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Code Quest
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="glass px-3 py-1.5 rounded-xl text-center border border-violet-500/20">
              <div className="text-xs text-violet-300/80">Pond</div>
              <div className="text-lg font-bold text-white">
                {currentLevelIndex + 1}/{levels.length}
              </div>
            </div>
            <div className="glass px-3 py-1.5 rounded-xl text-center border border-amber-500/20">
              <div className="text-xs text-amber-200/70">Flies</div>
              <div className="text-lg font-bold text-amber-300">🪰 {score}</div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div className="text-center mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-violet-300 text-xs font-semibold tracking-wide uppercase mb-1">
            🔔 Bell Lily Pond
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{level.name}</h1>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Learn <span className="text-violet-300">event-driven</span> code: when the frog lands on a{' '}
            <span className="text-amber-200">bell pad</span>, a second mini-program runs — like apps
            reacting to taps or keys.
          </p>
          {level.tutorial && (
            <p className="text-violet-200/90 text-xs mt-2 glass inline-block px-3 py-1.5 rounded-full border border-violet-500/30">
              💡 {level.tutorial}
            </p>
          )}
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-4 w-full lg:w-auto border border-violet-500/20"
          >
            <h3 className="text-white font-semibold mb-3 text-center">🫧 Pond toolkit</h3>

            <div className="mb-3 pb-3 border-b border-violet-500/20">
              <p className="text-amber-200/90 text-xs mb-2 text-center font-semibold">
                {editBell ? 'Editing bell handler' : 'Building main script'}
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  type="button"
                  onClick={() => setEditBell(false)}
                  disabled={isRunning || !hasBells}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    !editBell
                      ? 'bg-violet-600 text-white border-violet-400'
                      : 'bg-white/5 text-gray-400 border-white/10'
                  } disabled:opacity-40`}
                >
                  Main script
                </button>
                <button
                  type="button"
                  onClick={() => setEditBell(true)}
                  disabled={isRunning || !hasBells}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    editBell
                      ? 'bg-amber-600/90 text-white border-amber-400'
                      : 'bg-white/5 text-gray-400 border-white/10'
                  } disabled:opacity-40`}
                >
                  🔔 Bell handler
                </button>
              </div>
              {!hasBells && (
                <p className="text-gray-500 text-[10px] text-center mt-2">No bells on this level.</p>
              )}
            </div>

            <div className="flex lg:flex-col gap-2 flex-wrap justify-center">
              {(['forward', 'left', 'right'] as Command[]).map((cmd) => (
                <motion.button
                  key={cmd}
                  type="button"
                  onClick={() => addCommand(cmd)}
                  disabled={
                    isRunning ||
                    (editBell
                      ? bellProgram.length >= level.maxBellCommands
                      : mainProgram.length >= level.maxCommands)
                  }
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-2 rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2 min-w-[100px] justify-center"
                  style={{
                    backgroundColor: `${commandIcons[cmd].color}20`,
                    border: `2px solid ${commandIcons[cmd].color}`,
                  }}
                >
                  <span className="text-lg">{commandIcons[cmd].icon}</span>
                  <span className="text-xs">{commandIcons[cmd].label}</span>
                </motion.button>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-3 text-center">
              {editBell
                ? `${bellProgram.length}/${level.maxBellCommands} in bell handler`
                : `${mainProgram.length}/${level.maxCommands} in main script`}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-4 border border-indigo-500/25"
          >
            <div className="flex justify-center gap-3 mb-3 flex-wrap text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500/35 border border-emerald-400/50" />
                <span className="text-gray-300">Lily</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-500/25 border border-amber-400/50" />
                <span className="text-gray-300">Fly</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-base leading-none">🔔</span>
                <span className="text-gray-300">Bell</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-base leading-none">🪨</span>
                <span className="text-gray-300">Rock</span>
              </div>
            </div>
            <div
              className="grid gap-1 mx-auto"
              style={{
                gridTemplateColumns: `repeat(${level.gridSize}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${level.gridSize}, ${cellSize}px)`,
              }}
            >
              {Array.from({ length: level.gridSize * level.gridSize }).map((_, idx) => {
                const x = idx % level.gridSize;
                const y = Math.floor(idx / level.gridSize);
                const isGoal = x === level.goal.x && y === level.goal.y;
                const isObstacle = level.obstacles.some((o) => o.x === x && o.y === y);
                const isFrog = x === frogPos.x && y === frogPos.y;
                const isPath = level.path.some((p) => p.x === x && p.y === y);
                const isBell = isBellAt(level, { x, y });
                const isStart = x === level.frogStart.x && y === level.frogStart.y;

                return (
                  <motion.div
                    key={idx}
                    className={`rounded-lg flex items-center justify-center relative ${
                      isObstacle
                        ? 'bg-stone-900/65 border-2 border-stone-500/45'
                        : isGoal
                          ? 'bg-amber-500/25 border-2 border-amber-400/55'
                          : isBell && !isFrog
                            ? 'bg-amber-900/35 border-2 border-amber-500/50'
                            : isStart && !isFrog
                              ? 'bg-cyan-500/20 border-2 border-cyan-400/45'
                              : isPath
                                ? 'bg-emerald-500/20 border border-emerald-400/35'
                                : 'bg-white/5 border border-white/10'
                    }`}
                    style={{ width: cellSize, height: cellSize }}
                  >
                    {isBell && !isFrog && <span className="text-sm opacity-90">🔔</span>}
                    {isGoal && (
                      <motion.span
                        className={`text-lg ${isFrog ? 'opacity-40' : ''}`}
                        animate={{ scale: [1, 1.12, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        🪰
                      </motion.span>
                    )}
                    {isObstacle && <span className="text-lg">🪨</span>}
                    {isFrog && (
                      <motion.div
                        className="text-xl drop-shadow-md z-[1]"
                        animate={{ rotate: getRotation(frogDir) }}
                        transition={{ duration: 0.25 }}
                      >
                        🐸
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-4 w-full lg:w-72 border border-violet-500/20"
          >
            <h3 className="text-white font-semibold mb-2 text-center">📝 Main script</h3>
            <div className="min-h-[100px] max-h-[160px] overflow-y-auto mb-3">
              {mainProgram.length === 0 ? (
                <p className="text-gray-500 text-center text-xs py-6">Add hops and turns here.</p>
              ) : (
                <Reorder.Group axis="y" values={mainProgram} onReorder={setMainProgram} className="space-y-1.5">
                  {mainProgram.map((b, index) => (
                    <Reorder.Item
                      key={b.id}
                      value={b}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab text-xs ${
                        executingMainIndex === index && !executingBell
                          ? 'ring-2 ring-amber-400 bg-amber-500/15'
                          : 'bg-white/5'
                      }`}
                      style={{ borderLeft: `3px solid ${commandIcons[b.command].color}` }}
                    >
                      <span className="text-gray-500 w-4">{index + 1}.</span>
                      <span>{commandIcons[b.command].icon}</span>
                      <span className="text-white flex-1">{commandIcons[b.command].label}</span>
                      {!isRunning && (
                        <button
                          type="button"
                          onClick={() => removeBlock(b.id, false)}
                          className="text-red-400"
                        >
                          ×
                        </button>
                      )}
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </div>

            <h3 className="text-white font-semibold mb-2 text-center border-t border-white/10 pt-3">
              🔔 Bell handler
            </h3>
            <p className="text-gray-500 text-[10px] text-center mb-2">
              Runs when you <span className="text-amber-200">stop on a bell</span> after a main-script
              step.
            </p>
            <div className="min-h-[80px] max-h-[140px] overflow-y-auto mb-3">
              {!hasBells ? (
                <p className="text-gray-600 text-center text-xs py-4">—</p>
              ) : bellProgram.length === 0 ? (
                <p className="text-gray-500 text-center text-xs py-4">
                  Switch to “Bell handler” and add moves.
                </p>
              ) : (
                <Reorder.Group axis="y" values={bellProgram} onReorder={setBellProgram} className="space-y-1.5">
                  {bellProgram.map((b, index) => (
                    <Reorder.Item
                      key={b.id}
                      value={b}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab text-xs ${
                        executingBell ? 'ring-2 ring-violet-400 bg-violet-500/15' : 'bg-amber-950/30'
                      }`}
                      style={{ borderLeft: `3px solid ${commandIcons[b.command].color}` }}
                    >
                      <span className="text-gray-500 w-4">{index + 1}.</span>
                      <span>{commandIcons[b.command].icon}</span>
                      <span className="text-white flex-1">{commandIcons[b.command].label}</span>
                      {!isRunning && (
                        <button
                          type="button"
                          onClick={() => removeBlock(b.id, true)}
                          className="text-red-400"
                        >
                          ×
                        </button>
                      )}
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <motion.button
                type="button"
                onClick={executeCommands}
                disabled={!canRun}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 min-w-[100px] py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-sm"
              >
                ▶️ Run
              </motion.button>
              <motion.button
                type="button"
                onClick={clearMain}
                disabled={isRunning}
                className="px-3 py-2.5 rounded-xl text-white bg-red-600/45 text-sm disabled:opacity-45"
              >
                Clear main
              </motion.button>
              <motion.button
                type="button"
                onClick={clearBell}
                disabled={isRunning || !hasBells}
                className="px-3 py-2.5 rounded-xl text-white bg-amber-700/40 text-sm disabled:opacity-45"
              >
                Clear bell
              </motion.button>
              <motion.button
                type="button"
                onClick={resetLevel}
                disabled={isRunning}
                className="px-3 py-2.5 rounded-xl text-white bg-indigo-600/45 text-sm disabled:opacity-45"
              >
                🔄
              </motion.button>
            </div>
          </motion.div>
        </div>

        <motion.div className="text-center mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!showHint ? (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="text-gray-400 hover:text-amber-300 text-sm"
            >
              💡 Need a hint?
            </button>
          ) : (
            <div className="inline-block glass px-4 py-2 rounded-xl border border-violet-500/25 max-w-lg">
              <span className="text-amber-200/95 text-sm">{level.hint}</span>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {hitObstacle && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 glass px-5 py-3 rounded-xl border border-red-500/45 z-50"
            >
              <p className="text-red-400 text-sm font-medium">💥 Splashed into a rock or the edge!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass rounded-3xl p-8 max-w-md text-center border border-violet-500/25"
              >
                <div className="text-5xl mb-3">🎉</div>
                <h2 className="text-xl font-bold text-white mb-2">Fly caught!</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Events + main script — same idea as real programs listening for clicks and messages.
                </p>
                <div className="text-2xl font-bold text-amber-300 mb-6">
                  🪰 +{Math.max(18, 52 - mainProgram.length * 3 - bellProgram.length * 2)}
                </div>
                <motion.button
                  type="button"
                  onClick={nextLevel}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn-cosmic px-8 py-3 rounded-xl text-base"
                >
                  {currentLevelIndex < levels.length - 1 ? 'Next level →' : 'Done! 🏆'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
