'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';

type Command = 'forward' | 'left' | 'right' | 'forward2';
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
  maxCommands: number;
  hint: string;
}

interface CommandBlock {
  id: string;
  command: Command;
}

const commandIcons: Record<Command, { icon: string; label: string; color: string }> = {
  forward: { icon: '🐸', label: 'Hop forward', color: '#34d399' },
  forward2: { icon: '🐸⏫', label: 'Double hop', color: '#2dd4bf' },
  left: { icon: '↩️', label: 'Turn left', color: '#f59e0b' },
  right: { icon: '↪️', label: 'Turn right', color: '#10b981' },
};

const levels: Level[] = [
  {
    id: 1,
    name: 'First Hop',
    gridSize: 4,
    frogStart: { x: 0, y: 3 },
    frogDirection: 'right',
    goal: { x: 3, y: 3 },
    obstacles: [],
    path: [{ x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
    maxCommands: 6,
    hint: 'Hop forward three times to reach the golden lily!',
  },
  {
    id: 2,
    name: 'Upstream',
    gridSize: 4,
    frogStart: { x: 0, y: 3 },
    frogDirection: 'up',
    goal: { x: 0, y: 0 },
    obstacles: [],
    path: [{ x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 0 }],
    maxCommands: 6,
    hint: 'You face upstream — hop forward toward the lily.',
  },
  {
    id: 3,
    name: 'Soggy Corner',
    gridSize: 4,
    frogStart: { x: 3, y: 3 },
    frogDirection: 'up',
    goal: { x: 0, y: 0 },
    obstacles: [],
    path: [
      { x: 3, y: 3 },
      { x: 3, y: 2 },
      { x: 3, y: 1 },
      { x: 3, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
    ],
    maxCommands: 9,
    hint: 'Hop up the right side, then turn left and cross the top row to the lily.',
  },
  {
    id: 4,
    name: 'Pond Rim',
    gridSize: 5,
    frogStart: { x: 0, y: 4 },
    frogDirection: 'right',
    goal: { x: 4, y: 0 },
    obstacles: [],
    path: [
      { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
      { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 4, y: 0 },
    ],
    maxCommands: 12,
    hint: 'Follow the rim: hop right to the wall, turn, then hop up to the lily.',
  },
  {
    id: 5,
    name: 'Rock in the Brook',
    gridSize: 5,
    frogStart: { x: 0, y: 4 },
    frogDirection: 'right',
    goal: { x: 4, y: 0 },
    obstacles: [{ x: 2, y: 2 }],
    path: [
      { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
      { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 4, y: 0 },
    ],
    maxCommands: 12,
    hint: 'Rocks sit in the middle — stay on the outer rim of the pond.',
  },
  {
    id: 6,
    name: 'Round the Reed',
    gridSize: 5,
    frogStart: { x: 0, y: 2 },
    frogDirection: 'right',
    goal: { x: 4, y: 2 },
    obstacles: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
    path: [
      { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 },
      { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 2 },
    ],
    maxCommands: 14,
    hint: 'The reed blocks the middle — detour along the bottom edge.',
  },
  {
    id: 7,
    name: 'Dragonfly Row',
    gridSize: 5,
    frogStart: { x: 0, y: 4 },
    frogDirection: 'up',
    goal: { x: 4, y: 0 },
    obstacles: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }],
    path: [
      { x: 0, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 0 },
      { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
    ],
    maxCommands: 12,
    hint: 'Hop up the shallow side — rocks block the middle row, so use the top bank.',
  },
  {
    id: 8,
    name: 'Crooked Creek',
    gridSize: 6,
    frogStart: { x: 0, y: 5 },
    frogDirection: 'right',
    goal: { x: 5, y: 0 },
    obstacles: [{ x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 3, y: 4 }],
    path: [
      { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 2, y: 4 },
      { x: 1, y: 4 }, { x: 1, y: 3 }, { x: 1, y: 2 }, { x: 1, y: 1 },
      { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 5, y: 0 },
    ],
    maxCommands: 18,
    hint: 'Wind along the creek — one square wide in places.',
  },
  {
    id: 9,
    name: 'Twin Boulders',
    gridSize: 6,
    frogStart: { x: 0, y: 3 },
    frogDirection: 'right',
    goal: { x: 5, y: 3 },
    obstacles: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }],
    path: [
      { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 },
      { x: 3, y: 4 }, { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 0 },
      { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 },
    ],
    maxCommands: 20,
    hint: 'Slip between the two boulder columns using the bottom channel.',
  },
  {
    id: 10,
    name: 'Misty Bank',
    gridSize: 6,
    frogStart: { x: 0, y: 5 },
    frogDirection: 'up',
    goal: { x: 5, y: 0 },
    obstacles: [
      { x: 1, y: 4 }, { x: 1, y: 3 },
      { x: 3, y: 2 }, { x: 3, y: 1 },
      { x: 4, y: 4 }, { x: 4, y: 3 },
    ],
    path: [
      { x: 0, y: 5 }, { x: 0, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 0 },
      { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 },
    ],
    maxCommands: 18,
    hint: 'The left bank is clear — hop straight up, then along the top to the lily.',
  },
  {
    id: 11,
    name: 'Spiral Shell',
    gridSize: 7,
    frogStart: { x: 0, y: 6 },
    frogDirection: 'right',
    goal: { x: 2, y: 3 },
    obstacles: [
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
      { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 },
      { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 },
      { x: 1, y: 3 }, { x: 1, y: 4 },
      { x: 3, y: 3 }, { x: 3, y: 4 },
    ],
    path: [
      { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 },
      { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 },
      { x: 5, y: 0 }, { x: 4, y: 0 }, { x: 3, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 },
      { x: 2, y: 4 }, { x: 2, y: 3 },
    ],
    maxCommands: 28,
    hint: 'Spiral the outer edge inward. The golden lily is in the inner pocket — not on a rock!',
  },
  {
    id: 12,
    name: 'Deep Channel',
    gridSize: 7,
    frogStart: { x: 0, y: 6 },
    frogDirection: 'right',
    goal: { x: 6, y: 0 },
    obstacles: [
      { x: 2, y: 4 }, { x: 2, y: 5 },
      { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 },
      { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 },
    ],
    path: [
      { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 },
      { x: 4, y: 5 }, { x: 4, y: 4 }, { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 4, y: 0 },
      { x: 5, y: 0 }, { x: 6, y: 0 },
    ],
    maxCommands: 26,
    hint: 'Open water runs up column 4. Double hop onto the lily counts — you win the moment you land on it.',
  },
  {
    id: 13,
    name: 'Reed Cluster',
    gridSize: 7,
    frogStart: { x: 0, y: 6 },
    frogDirection: 'right',
    goal: { x: 6, y: 0 },
    obstacles: [
      { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
      { x: 3, y: 3 }, { x: 4, y: 3 },
    ],
    path: [
      { x: 0, y: 6 }, { x: 0, y: 5 }, { x: 0, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 0 },
      { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 },
    ],
    maxCommands: 26,
    hint: 'Thick reeds block the middle — take the shallow left edge, then hop along the top.',
  },
  {
    id: 14,
    name: 'Crosswater',
    gridSize: 7,
    frogStart: { x: 0, y: 3 },
    frogDirection: 'right',
    goal: { x: 6, y: 3 },
    obstacles: [
      { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 },
      { x: 2, y: 4 }, { x: 4, y: 4 },
      { x: 3, y: 1 },
    ],
    path: [
      { x: 0, y: 3 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
      { x: 5, y: 3 }, { x: 6, y: 3 },
    ],
    maxCommands: 22,
    hint: 'The straight line is blocked — dip north one row, cross under the gap, then drop to the lily.',
  },
  {
    id: 15,
    name: "King's Lily",
    gridSize: 8,
    frogStart: { x: 0, y: 7 },
    frogDirection: 'right',
    goal: { x: 7, y: 0 },
    obstacles: [
      { x: 3, y: 4 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
      { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 },
      { x: 2, y: 6 }, { x: 2, y: 5 }, { x: 5, y: 6 },
    ],
    path: [
      { x: 0, y: 7 }, { x: 0, y: 6 }, { x: 0, y: 5 }, { x: 0, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 0 },
      { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 },
    ],
    maxCommands: 32,
    hint: 'The great pond — hug the left bank to the top, then sprint the lily ridge. Plan double hops to save blocks.',
  },
];

function getDirectionDelta(direction: Direction): Position {
  switch (direction) {
    case 'up': return { x: 0, y: -1 };
    case 'down': return { x: 0, y: 1 };
    case 'left': return { x: -1, y: 0 };
    case 'right': return { x: 1, y: 0 };
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

export default function FrogNavigatorGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();
  const cmdIdRef = useRef(0);

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [commands, setCommands] = useState<CommandBlock[]>([]);
  const [frogPos, setFrogPos] = useState<Position>({ x: 0, y: 0 });
  const [frogDir, setFrogDir] = useState<Direction>('right');
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [executingIndex, setExecutingIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hitObstacle, setHitObstacle] = useState(false);

  const level = levels[currentLevelIndex];
  const availableCommands: Command[] = currentLevelIndex < 4 
    ? ['forward', 'left', 'right'] 
    : ['forward', 'forward2', 'left', 'right'];

  const resetLevel = useCallback(() => {
    if (level) {
      setFrogPos(level.frogStart);
      setFrogDir(level.frogDirection);
      setCommands([]);
      setIsRunning(false);
      setIsComplete(false);
      setExecutingIndex(-1);
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
    if (commands.length < level.maxCommands && !isRunning) {
      cmdIdRef.current += 1;
      setCommands((prev) => [...prev, { id: `c-${cmdIdRef.current}`, command }]);
    }
  };

  const removeCommand = (id: string) => {
    if (!isRunning) {
      setCommands(prev => prev.filter(c => c.id !== id));
    }
  };

  const clearCommands = () => {
    if (!isRunning) {
      setCommands([]);
    }
  };

  const executeCommands = async () => {
    if (commands.length === 0 || isRunning) return;
    
    setIsRunning(true);
    setHitObstacle(false);
    let pos = { ...level.frogStart };
    let dir = level.frogDirection;

    const winAndStop = () => {
      setIsComplete(true);
      setShowConfetti(true);
      const levelScore = Math.max(10, 30 - (commands.length - 3) * 3);
      setScore((prev) => prev + levelScore);
      addStars(2);
      recordAnswer(true);
      incrementGamesPlayed();
      setTimeout(() => setShowConfetti(false), 3000);
      setExecutingIndex(-1);
      setIsRunning(false);
    };

    for (let i = 0; i < commands.length; i++) {
      setExecutingIndex(i);
      const cmd = commands[i].command;
      
      await new Promise(resolve => setTimeout(resolve, 400));

      if (cmd === 'left') {
        dir = turnLeft(dir);
        setFrogDir(dir);
      } else if (cmd === 'right') {
        dir = turnRight(dir);
        setFrogDir(dir);
      } else if (cmd === 'forward' || cmd === 'forward2') {
        const delta = getDirectionDelta(dir);
        const steps = cmd === 'forward2' ? 2 : 1;
        
        for (let step = 0; step < steps; step++) {
          const newPos = { x: pos.x + delta.x, y: pos.y + delta.y };
          
          if (newPos.x < 0 || newPos.x >= level.gridSize || newPos.y < 0 || newPos.y >= level.gridSize) {
            setHitObstacle(true);
            setIsRunning(false);
            setExecutingIndex(-1);
            return;
          }
          
          if (level.obstacles.some(o => o.x === newPos.x && o.y === newPos.y)) {
            setHitObstacle(true);
            setIsRunning(false);
            setExecutingIndex(-1);
            return;
          }
          
          pos = newPos;
          setFrogPos({ ...pos });

          // Win as soon as the lily is reached (stops forward2 from taking a second step past the goal).
          if (pos.x === level.goal.x && pos.y === level.goal.y) {
            winAndStop();
            return;
          }
          
          if (step < steps - 1) {
            await new Promise(resolve => setTimeout(resolve, 250));
          }
        }
      }

      if (pos.x === level.goal.x && pos.y === level.goal.y) {
        winAndStop();
        return;
      }
    }

    setExecutingIndex(-1);
    setIsRunning(false);
    
    if (pos.x !== level.goal.x || pos.y !== level.goal.y) {
      recordAnswer(false);
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
    } else {
      router.push('/sections/favourite');
    }
  };

  if (!level) return null;

  const cellSize =
    level.gridSize <= 5 ? 60 : level.gridSize <= 6 ? 50 : level.gridSize <= 7 ? 45 : 38;

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-4 md:p-6 relative overflow-hidden bg-gradient-to-b from-emerald-950/90 via-teal-950/50 to-slate-950">
      <FloatingShapes />
      <Confetti show={showConfetti} />

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <motion.button
            onClick={() => router.push('/sections/favourite')}
            className="glass px-3 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors text-sm min-h-[44px] touch-target"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Favourites
          </motion.button>

          <div className="flex items-center gap-3">
            <div className="glass px-3 py-1.5 rounded-xl text-center">
              <div className="text-xs text-gray-400">Level</div>
              <div className="text-lg font-bold text-white">{currentLevelIndex + 1}/{levels.length}</div>
            </div>
            <div className="glass px-3 py-1.5 rounded-xl text-center">
              <div className="text-xs text-gray-400">Score</div>
              <div className="text-lg font-bold text-yellow-400">⭐ {score}</div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          className="text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">🐸 {level.name}</h1>
          <p className="text-gray-400 text-sm">Help the frog hop to the golden lily!</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-4 w-full lg:w-auto"
          >
            <h3 className="text-white font-semibold mb-3 text-center">📦 Command Blocks</h3>
            <div className="flex lg:flex-col gap-2 flex-wrap justify-center">
              {availableCommands.map((cmd) => (
                <motion.button
                  key={cmd}
                  onClick={() => addCommand(cmd)}
                  disabled={commands.length >= level.maxCommands || isRunning}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
                  style={{ 
                    backgroundColor: `${commandIcons[cmd].color}20`,
                    border: `2px solid ${commandIcons[cmd].color}`,
                  }}
                >
                  <span className="text-xl">{commandIcons[cmd].icon}</span>
                  <span className="text-sm">{commandIcons[cmd].label}</span>
                </motion.button>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-3 text-center">
              {commands.length}/{level.maxCommands} blocks
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex justify-center gap-4 mb-3 flex-wrap text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-teal-500/30 border border-teal-400/50" />
                <span className="text-gray-300">Shallow water</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-cyan-500/30 border border-cyan-400/50" />
                <span className="text-gray-300">Start pad</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-500/30 border border-amber-400/50" />
                <span className="text-gray-300">Golden lily</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-stone-800/70 border border-stone-500/50" />
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
                const isObstacle = level.obstacles.some(o => o.x === x && o.y === y);
                const isFrog = x === frogPos.x && y === frogPos.y;
                const isPath = level.path.some(p => p.x === x && p.y === y);
                const isStart = x === level.frogStart.x && y === level.frogStart.y;

                return (
                  <motion.div
                    key={idx}
                    className={`rounded-lg flex items-center justify-center relative ${
                      isObstacle
                        ? 'bg-stone-900/60 border-2 border-stone-500/45'
                        : isGoal
                          ? 'bg-amber-500/25 border-2 border-amber-400/55'
                          : isStart && !isFrog
                            ? 'bg-cyan-500/25 border-2 border-cyan-400/45'
                            : isPath
                              ? 'bg-teal-600/20 border-2 border-teal-400/35'
                              : 'bg-emerald-950/40 border border-teal-500/15'
                    }`}
                    style={{ width: cellSize, height: cellSize }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.005 }}
                  >
                    {isPath && !isGoal && !isFrog && !isStart && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-teal-400/45" />
                      </div>
                    )}
                    {isGoal && (
                      <motion.span 
                        className={`text-xl md:text-2xl ${isFrog ? 'opacity-35' : ''}`}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        🪷
                      </motion.span>
                    )}
                    {isObstacle && (
                      <span className="text-xl" title="Rock">
                        🪨
                      </span>
                    )}
                    {isFrog && (
                      <motion.div
                        className="text-2xl md:text-3xl drop-shadow-md z-[1]"
                        animate={{ rotate: getRotation(frogDir) }}
                        transition={{ duration: 0.3 }}
                        title="Your frog"
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
            className="glass rounded-2xl p-4 w-full lg:w-64"
          >
            <h3 className="text-white font-semibold mb-3 text-center">📝 Your Program</h3>
            
            <div className="min-h-[180px] max-h-[280px] overflow-y-auto mb-3">
              {commands.length === 0 ? (
                <div className="text-gray-500 text-center py-8 text-sm">
                  Tap blocks to build a hop path for the frog!
                </div>
              ) : (
                <Reorder.Group 
                  axis="y" 
                  values={commands} 
                  onReorder={setCommands}
                  className="space-y-2"
                >
                  {commands.map((cmd, index) => (
                    <Reorder.Item
                      key={cmd.id}
                      value={cmd}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-grab active:cursor-grabbing transition-all ${
                        executingIndex === index
                          ? 'ring-2 ring-yellow-400 bg-yellow-500/20'
                          : 'bg-white/5'
                      }`}
                      style={{ borderLeft: `4px solid ${commandIcons[cmd.command].color}` }}
                      whileDrag={{ scale: 1.05, zIndex: 50 }}
                    >
                      <span className="text-gray-400 text-xs w-4">{index + 1}.</span>
                      <span className="text-lg">{commandIcons[cmd.command].icon}</span>
                      <span className="text-white text-xs flex-1">{commandIcons[cmd.command].label}</span>
                      {!isRunning && (
                        <button
                          onClick={() => removeCommand(cmd.id)}
                          className="text-red-400 hover:text-red-300 text-lg"
                        >
                          ×
                        </button>
                      )}
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </div>

            <div className="flex gap-2">
              <motion.button
                onClick={executeCommands}
                disabled={commands.length === 0 || isRunning || isComplete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                ▶️ Run
              </motion.button>
              <motion.button
                onClick={clearCommands}
                disabled={isRunning}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-3 rounded-xl text-white bg-red-600/50 hover:bg-red-500/50 disabled:opacity-50"
              >
                🗑️
              </motion.button>
              <motion.button
                onClick={resetLevel}
                disabled={isRunning}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-3 rounded-xl text-white bg-blue-600/50 hover:bg-blue-500/50 disabled:opacity-50"
              >
                🔄
              </motion.button>
            </div>
          </motion.div>
        </div>

        <motion.div className="text-center mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {!showHint ? (
            <button onClick={() => setShowHint(true)} className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">
              💡 Need a hint?
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-block glass px-4 py-2 rounded-xl">
              <span className="text-yellow-400 text-sm">💡 {level.hint}</span>
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence>
          {hitObstacle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 glass px-6 py-3 rounded-xl border border-red-500/50"
            >
              <p className="text-red-400 font-semibold">💥 Splashed into a rock or the bank — try again!</p>
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
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="glass rounded-3xl p-8 max-w-md text-center"
              >
                <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-6xl mb-4">
                  🎉
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Level Complete!</h2>
                <p className="text-gray-300 mb-4 text-sm">Used {commands.length} commands</p>
                <div className="text-3xl font-bold text-yellow-400 mb-6">⭐ +{Math.max(10, 30 - (commands.length - 3) * 3)}</div>
                <motion.button
                  onClick={nextLevel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-cosmic px-8 py-4 rounded-xl text-lg"
                >
                  {currentLevelIndex < levels.length - 1 ? 'Next Level →' : 'Complete! 🏆'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}


