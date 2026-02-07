'use client';

import { useState, useEffect, useCallback } from 'react';
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
  robotStart: Position;
  robotDirection: Direction;
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
  forward: { icon: '⬆️', label: 'Move Forward', color: '#3b82f6' },
  forward2: { icon: '⏫', label: 'Move 2', color: '#6366f1' },
  left: { icon: '↩️', label: 'Turn Left', color: '#f59e0b' },
  right: { icon: '↪️', label: 'Turn Right', color: '#10b981' },
};

const levels: Level[] = [
  // Beginner levels
  {
    id: 1,
    name: 'First Steps',
    gridSize: 4,
    robotStart: { x: 0, y: 3 },
    robotDirection: 'right',
    goal: { x: 3, y: 3 },
    obstacles: [],
    path: [{ x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
    maxCommands: 5,
    hint: 'Move forward 3 times to reach the star!',
  },
  {
    id: 2,
    name: 'Going Up',
    gridSize: 4,
    robotStart: { x: 0, y: 3 },
    robotDirection: 'up',
    goal: { x: 0, y: 0 },
    obstacles: [],
    path: [{ x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 0 }],
    maxCommands: 5,
    hint: 'The robot faces up - move forward!',
  },
  {
    id: 3,
    name: 'Turn Around',
    gridSize: 4,
    robotStart: { x: 0, y: 3 },
    robotDirection: 'right',
    goal: { x: 2, y: 1 },
    obstacles: [],
    path: [{ x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 1 }],
    maxCommands: 6,
    hint: 'Go right, then turn left and go up!',
  },
  {
    id: 4,
    name: 'L-Shape',
    gridSize: 5,
    robotStart: { x: 0, y: 4 },
    robotDirection: 'right',
    goal: { x: 4, y: 0 },
    obstacles: [],
    path: [
      { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
      { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 4, y: 0 }
    ],
    maxCommands: 10,
    hint: 'Go right to the edge, then turn and go up!',
  },
  // Intermediate levels with obstacles
  {
    id: 5,
    name: 'First Wall',
    gridSize: 5,
    robotStart: { x: 0, y: 4 },
    robotDirection: 'right',
    goal: { x: 4, y: 0 },
    obstacles: [{ x: 2, y: 2 }],
    path: [
      { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
      { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 4, y: 0 }
    ],
    maxCommands: 10,
    hint: 'Avoid the wall by going around the edge!',
  },
  {
    id: 6,
    name: 'Wall Maze',
    gridSize: 5,
    robotStart: { x: 0, y: 2 },
    robotDirection: 'right',
    goal: { x: 4, y: 2 },
    obstacles: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
    path: [
      { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 },
      { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 2 }
    ],
    maxCommands: 12,
    hint: 'Go around the wall from below!',
  },
  {
    id: 7,
    name: 'Zigzag',
    gridSize: 5,
    robotStart: { x: 0, y: 4 },
    robotDirection: 'up',
    goal: { x: 4, y: 0 },
    obstacles: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }],
    path: [
      { x: 0, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 0 },
      { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }
    ],
    maxCommands: 10,
    hint: 'Go up to the top, then turn right!',
  },
  // Advanced levels
  {
    id: 8,
    name: 'Snake Path',
    gridSize: 6,
    robotStart: { x: 0, y: 5 },
    robotDirection: 'right',
    goal: { x: 5, y: 0 },
    obstacles: [{ x: 2, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 3, y: 4 }],
    path: [
      { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 2, y: 4 },
      { x: 1, y: 4 }, { x: 1, y: 3 }, { x: 1, y: 2 }, { x: 1, y: 1 },
      { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 5, y: 0 }
    ],
    maxCommands: 16,
    hint: 'Follow the winding path carefully!',
  },
  {
    id: 9,
    name: 'Double Wall',
    gridSize: 6,
    robotStart: { x: 0, y: 3 },
    robotDirection: 'right',
    goal: { x: 5, y: 3 },
    obstacles: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }],
    path: [
      { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 },
      { x: 3, y: 4 }, { x: 3, y: 3 }, { x: 3, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 0 },
      { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }
    ],
    maxCommands: 18,
    hint: 'Navigate through the maze carefully!',
  },
  {
    id: 10,
    name: 'Complex Maze',
    gridSize: 6,
    robotStart: { x: 0, y: 5 },
    robotDirection: 'up',
    goal: { x: 5, y: 0 },
    obstacles: [
      { x: 1, y: 4 }, { x: 1, y: 3 },
      { x: 3, y: 2 }, { x: 3, y: 1 },
      { x: 4, y: 4 }, { x: 4, y: 3 },
    ],
    path: [
      { x: 0, y: 5 }, { x: 0, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }, { x: 0, y: 0 },
      { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
    ],
    maxCommands: 14,
    hint: 'Go up along the left edge first!',
  },
  {
    id: 11,
    name: 'Spiral',
    gridSize: 7,
    robotStart: { x: 0, y: 6 },
    robotDirection: 'right',
    goal: { x: 3, y: 3 },
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
      { x: 0, y: 4 }, { x: 2, y: 4 }, { x: 2, y: 3 },
    ],
    maxCommands: 25,
    hint: 'This is a spiral - go around the edges!',
  },
  {
    id: 12,
    name: 'Master Challenge',
    gridSize: 7,
    robotStart: { x: 0, y: 6 },
    robotDirection: 'right',
    goal: { x: 6, y: 0 },
    obstacles: [
      { x: 2, y: 4 }, { x: 2, y: 5 },
      { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 },
      { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 },
    ],
    path: [
      { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 },
      { x: 4, y: 5 }, { x: 4, y: 4 }, { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 4, y: 0 },
      { x: 5, y: 0 }, { x: 6, y: 0 }
    ],
    maxCommands: 16,
    hint: 'Find the path through the obstacles!',
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

export default function RobotGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();
  
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [commands, setCommands] = useState<CommandBlock[]>([]);
  const [robotPos, setRobotPos] = useState<Position>({ x: 0, y: 0 });
  const [robotDir, setRobotDir] = useState<Direction>('right');
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
      setRobotPos(level.robotStart);
      setRobotDir(level.robotDirection);
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

  const addCommand = (command: Command) => {
    if (commands.length < level.maxCommands && !isRunning) {
      setCommands(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, command }]);
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
    let pos = { ...level.robotStart };
    let dir = level.robotDirection;

    for (let i = 0; i < commands.length; i++) {
      setExecutingIndex(i);
      const cmd = commands[i].command;
      
      await new Promise(resolve => setTimeout(resolve, 400));

      if (cmd === 'left') {
        dir = turnLeft(dir);
        setRobotDir(dir);
      } else if (cmd === 'right') {
        dir = turnRight(dir);
        setRobotDir(dir);
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
          setRobotPos({ ...pos });
          
          if (step < steps - 1) {
            await new Promise(resolve => setTimeout(resolve, 250));
          }
        }
      }

      if (pos.x === level.goal.x && pos.y === level.goal.y) {
        setIsComplete(true);
        setShowConfetti(true);
        const levelScore = Math.max(10, 30 - (commands.length - 3) * 3);
        setScore(prev => prev + levelScore);
        addStars(2);
        recordAnswer(true);
        incrementGamesPlayed();
        setTimeout(() => setShowConfetti(false), 3000);
        break;
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
      router.push('/games/programming');
    }
  };

  if (!level) return null;

  const cellSize = level.gridSize <= 5 ? 60 : level.gridSize <= 6 ? 50 : 45;

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-4 md:p-6 relative overflow-hidden">
      <FloatingShapes />
      <Confetti show={showConfetti} />

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <motion.button
            onClick={() => router.push('/games/programming')}
            className="glass px-3 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors text-sm min-h-[44px] touch-target"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back
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
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">🤖 {level.name}</h1>
          <p className="text-gray-400 text-sm">Help the robot reach the star!</p>
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
                <div className="w-4 h-4 rounded bg-green-500/30 border border-green-400/50" />
                <span className="text-gray-300">Path</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-blue-500/30 border border-blue-400/50" />
                <span className="text-gray-300">Start</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-400/50" />
                <span className="text-gray-300">Goal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-red-900/50 border border-red-500/50" />
                <span className="text-gray-300">Wall</span>
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
                const isRobot = x === robotPos.x && y === robotPos.y;
                const isPath = level.path.some(p => p.x === x && p.y === y);
                const isStart = x === level.robotStart.x && y === level.robotStart.y;

                return (
                  <motion.div
                    key={idx}
                    className={`rounded-lg flex items-center justify-center relative ${
                      isObstacle 
                        ? 'bg-red-900/50 border-2 border-red-500/50' 
                        : isGoal
                          ? 'bg-yellow-500/30 border-2 border-yellow-400/60'
                          : isStart && !isRobot
                            ? 'bg-blue-500/30 border-2 border-blue-400/50'
                            : isPath
                              ? 'bg-green-500/25 border-2 border-green-400/40'
                              : 'bg-white/5 border border-white/10'
                    }`}
                    style={{ width: cellSize, height: cellSize }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.005 }}
                  >
                    {isPath && !isGoal && !isRobot && !isStart && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-400/50" />
                      </div>
                    )}
                    {isGoal && !isRobot && (
                      <motion.span 
                        className="text-xl md:text-2xl"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ⭐
                      </motion.span>
                    )}
                    {isObstacle && (
                      <span className="text-xl">🧱</span>
                    )}
                    {isRobot && (
                      <motion.div
                        className="text-2xl md:text-3xl"
                        animate={{ rotate: getRotation(robotDir) }}
                        transition={{ duration: 0.3 }}
                      >
                        🤖
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
                  Add commands to program the robot!
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
              <p className="text-red-400 font-semibold">💥 Oops! Try again!</p>
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


