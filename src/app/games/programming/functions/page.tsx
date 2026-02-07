'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';

type BaseCommand = 'forward' | 'left' | 'right';
type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

interface CustomFunction {
  id: string;
  name: string;
  emoji: string;
  color: string;
  commands: BaseCommand[];
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
  maxFunctionCommands: number;
  predefinedFunctions?: CustomFunction[];
  hint: string;
  tutorial?: string;
}

interface CommandBlock {
  id: string;
  type: 'command' | 'function';
  command?: BaseCommand;
  functionId?: string;
}

const commandIcons: Record<BaseCommand, { icon: string; label: string; color: string }> = {
  forward: { icon: '⬆️', label: 'Forward', color: '#3b82f6' },
  left: { icon: '↩️', label: 'Left', color: '#f59e0b' },
  right: { icon: '↪️', label: 'Right', color: '#10b981' },
};

const functionColors = ['#ec4899', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
const functionEmojis = ['🚀', '⚡', '🌟', '💫', '🔥', '💎', '🎯', '🎨'];

const levels: Level[] = [
  {
    id: 1,
    name: 'Create Your First Function',
    gridSize: 5,
    robotStart: { x: 0, y: 4 },
    robotDirection: 'right',
    goal: { x: 4, y: 4 },
    obstacles: [],
    path: [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }],
    maxCommands: 3,
    maxFunctionCommands: 4,
    hint: 'Create a function with "Forward, Forward" and call it twice!',
    tutorial: 'Functions let you save a sequence of commands and reuse them!',
  },
  {
    id: 2,
    name: 'Turn Corner Function',
    gridSize: 5,
    robotStart: { x: 0, y: 4 },
    robotDirection: 'right',
    goal: { x: 4, y: 0 },
    obstacles: [],
    path: [
      { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
      { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 4, y: 0 }
    ],
    maxCommands: 4,
    maxFunctionCommands: 5,
    hint: 'Create two functions: one for moving straight, one for turning and moving!',
  },
  {
    id: 3,
    name: 'Spiral Function',
    gridSize: 5,
    robotStart: { x: 2, y: 2 },
    robotDirection: 'up',
    goal: { x: 0, y: 0 },
    obstacles: [],
    path: [
      { x: 2, y: 2 }, { x: 2, y: 1 },
      { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 },
      { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 2 }, { x: 1, y: 1 }, { x: 1, y: 0 },
      { x: 0, y: 0 }
    ],
    maxCommands: 5,
    maxFunctionCommands: 4,
    hint: 'Create a "turn corner" function: Forward, Right, Forward!',
  },
  {
    id: 4,
    name: 'Multiple Functions',
    gridSize: 6,
    robotStart: { x: 0, y: 5 },
    robotDirection: 'right',
    goal: { x: 5, y: 0 },
    obstacles: [{ x: 2, y: 3 }, { x: 3, y: 3 }],
    path: [
      { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 },
      { x: 2, y: 4 }, { x: 1, y: 4 }, { x: 1, y: 3 }, { x: 1, y: 2 },
      { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 },
      { x: 4, y: 1 }, { x: 4, y: 0 }, { x: 5, y: 0 }
    ],
    maxCommands: 6,
    maxFunctionCommands: 4,
    hint: 'Create different functions for different patterns in the path!',
  },
  {
    id: 5,
    name: 'Predefined Helper',
    gridSize: 6,
    robotStart: { x: 0, y: 5 },
    robotDirection: 'up',
    goal: { x: 5, y: 0 },
    obstacles: [],
    path: [
      { x: 0, y: 5 }, { x: 0, y: 4 },
      { x: 1, y: 4 }, { x: 1, y: 3 },
      { x: 2, y: 3 }, { x: 2, y: 2 },
      { x: 3, y: 2 }, { x: 3, y: 1 },
      { x: 4, y: 1 }, { x: 4, y: 0 }, { x: 5, y: 0 }
    ],
    maxCommands: 8,
    maxFunctionCommands: 3,
    predefinedFunctions: [
      { id: 'stair', name: 'Stair Step', emoji: '📶', color: '#8b5cf6', commands: ['forward', 'right', 'forward', 'left'] }
    ],
    hint: 'Use the pre-made Stair Step function multiple times!',
  },
  {
    id: 6,
    name: 'Complex Patterns',
    gridSize: 7,
    robotStart: { x: 0, y: 6 },
    robotDirection: 'right',
    goal: { x: 6, y: 0 },
    obstacles: [{ x: 3, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 3 }],
    path: [
      { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 2, y: 5 },
      { x: 2, y: 4 }, { x: 2, y: 3 }, { x: 2, y: 2 },
      { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
      { x: 5, y: 1 }, { x: 5, y: 0 }, { x: 6, y: 0 }
    ],
    maxCommands: 6,
    maxFunctionCommands: 5,
    hint: 'Identify repeating patterns and create functions for them!',
  },
  {
    id: 7,
    name: 'Reuse Master',
    gridSize: 7,
    robotStart: { x: 0, y: 6 },
    robotDirection: 'right',
    goal: { x: 6, y: 6 },
    obstacles: [
      { x: 2, y: 4 }, { x: 2, y: 5 },
      { x: 4, y: 1 }, { x: 4, y: 2 },
    ],
    path: [
      { x: 0, y: 6 }, { x: 1, y: 6 },
      { x: 1, y: 5 }, { x: 1, y: 4 }, { x: 1, y: 3 },
      { x: 2, y: 3 }, { x: 3, y: 3 },
      { x: 3, y: 4 }, { x: 3, y: 5 }, { x: 3, y: 6 },
      { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }
    ],
    maxCommands: 7,
    maxFunctionCommands: 4,
    hint: 'Create a function for the up-down pattern!',
  },
  {
    id: 8,
    name: 'Function Combo',
    gridSize: 8,
    robotStart: { x: 0, y: 7 },
    robotDirection: 'right',
    goal: { x: 7, y: 0 },
    obstacles: [],
    path: [
      { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 2, y: 7 },
      { x: 2, y: 6 }, { x: 2, y: 5 },
      { x: 3, y: 5 }, { x: 4, y: 5 },
      { x: 4, y: 4 }, { x: 4, y: 3 },
      { x: 5, y: 3 }, { x: 6, y: 3 },
      { x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 },
      { x: 7, y: 0 }
    ],
    maxCommands: 8,
    maxFunctionCommands: 4,
    predefinedFunctions: [
      { id: 'move2', name: 'Move 2x', emoji: '⏩', color: '#3b82f6', commands: ['forward', 'forward'] }
    ],
    hint: 'Combine the Move 2x function with your own custom functions!',
  },
  {
    id: 9,
    name: 'Advanced Functions',
    gridSize: 8,
    robotStart: { x: 0, y: 7 },
    robotDirection: 'up',
    goal: { x: 7, y: 0 },
    obstacles: [
      { x: 2, y: 5 }, { x: 2, y: 6 },
      { x: 5, y: 2 }, { x: 5, y: 3 },
    ],
    path: [
      { x: 0, y: 7 }, { x: 0, y: 6 }, { x: 0, y: 5 },
      { x: 1, y: 5 }, { x: 1, y: 4 }, { x: 1, y: 3 },
      { x: 2, y: 3 }, { x: 3, y: 3 },
      { x: 3, y: 2 }, { x: 3, y: 1 },
      { x: 4, y: 1 }, { x: 4, y: 0 },
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }
    ],
    maxCommands: 8,
    maxFunctionCommands: 5,
    hint: 'Create functions that handle the tricky corners!',
  },
  {
    id: 10,
    name: 'Function Factory Master',
    gridSize: 8,
    robotStart: { x: 0, y: 7 },
    robotDirection: 'right',
    goal: { x: 4, y: 4 },
    obstacles: [
      { x: 2, y: 5 }, { x: 2, y: 6 },
      { x: 4, y: 6 }, { x: 5, y: 6 },
      { x: 6, y: 4 }, { x: 6, y: 5 },
    ],
    path: [
      { x: 0, y: 7 }, { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 },
      { x: 3, y: 6 }, { x: 3, y: 5 }, { x: 3, y: 4 },
      { x: 4, y: 4 }
    ],
    maxCommands: 6,
    maxFunctionCommands: 5,
    hint: 'You\'re a function master! Find the optimal solution!',
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

export default function FunctionsGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();
  
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [commands, setCommands] = useState<CommandBlock[]>([]);
  const [customFunctions, setCustomFunctions] = useState<CustomFunction[]>([]);
  const [editingFunction, setEditingFunction] = useState<CustomFunction | null>(null);
  const [robotPos, setRobotPos] = useState<Position>({ x: 0, y: 0 });
  const [robotDir, setRobotDir] = useState<Direction>('right');
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [executingIndex, setExecutingIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hitObstacle, setHitObstacle] = useState(false);
  const [showFunctionEditor, setShowFunctionEditor] = useState(false);

  const level = levels[currentLevelIndex];
  const allFunctions = [...(level.predefinedFunctions || []), ...customFunctions];

  const resetLevel = useCallback(() => {
    if (level) {
      setRobotPos(level.robotStart);
      setRobotDir(level.robotDirection);
      setCommands([]);
      setCustomFunctions([]);
      setIsRunning(false);
      setIsComplete(false);
      setExecutingIndex(-1);
      setShowHint(false);
      setHitObstacle(false);
      setShowFunctionEditor(false);
      setEditingFunction(null);
    }
  }, [level]);

  useEffect(() => {
    resetLevel();
  }, [resetLevel, currentLevelIndex]);

  const addCommand = (command: BaseCommand) => {
    if (editingFunction) {
      if (editingFunction.commands.length < level.maxFunctionCommands) {
        setEditingFunction({
          ...editingFunction,
          commands: [...editingFunction.commands, command]
        });
      }
    } else if (commands.length < level.maxCommands && !isRunning) {
      setCommands(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, type: 'command', command }]);
    }
  };

  const addFunctionCall = (funcId: string) => {
    if (commands.length < level.maxCommands && !isRunning) {
      setCommands(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, type: 'function', functionId: funcId }]);
    }
  };

  const createNewFunction = () => {
    const newFunc: CustomFunction = {
      id: `func-${Date.now()}`,
      name: `My Function ${customFunctions.length + 1}`,
      emoji: functionEmojis[customFunctions.length % functionEmojis.length],
      color: functionColors[customFunctions.length % functionColors.length],
      commands: []
    };
    setEditingFunction(newFunc);
    setShowFunctionEditor(true);
  };

  const saveFunction = () => {
    if (editingFunction && editingFunction.commands.length > 0) {
      setCustomFunctions(prev => {
        const existing = prev.findIndex(f => f.id === editingFunction.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = editingFunction;
          return updated;
        }
        return [...prev, editingFunction];
      });
    }
    setEditingFunction(null);
    setShowFunctionEditor(false);
  };

  const removeCommand = (id: string) => {
    if (!isRunning) {
      setCommands(prev => prev.filter(c => c.id !== id));
    }
  };

  const removeFromFunction = (index: number) => {
    if (editingFunction) {
      setEditingFunction({
        ...editingFunction,
        commands: editingFunction.commands.filter((_, i) => i !== index)
      });
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

    const expandedCommands: { command: BaseCommand; originalIndex: number }[] = [];
    commands.forEach((cmd, index) => {
      if (cmd.type === 'command' && cmd.command) {
        expandedCommands.push({ command: cmd.command, originalIndex: index });
      } else if (cmd.type === 'function' && cmd.functionId) {
        const func = allFunctions.find(f => f.id === cmd.functionId);
        if (func) {
          func.commands.forEach(c => {
            expandedCommands.push({ command: c, originalIndex: index });
          });
        }
      }
    });

    for (let j = 0; j < expandedCommands.length; j++) {
      setExecutingIndex(expandedCommands[j].originalIndex);
      const cmdType = expandedCommands[j].command;
      
      await new Promise(resolve => setTimeout(resolve, 250));

      if (cmdType === 'left') {
        dir = turnLeft(dir);
        setRobotDir(dir);
      } else if (cmdType === 'right') {
        dir = turnRight(dir);
        setRobotDir(dir);
      } else if (cmdType === 'forward') {
        const delta = getDirectionDelta(dir);
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
      }

      if (pos.x === level.goal.x && pos.y === level.goal.y) {
        setIsComplete(true);
        setShowConfetti(true);
        const levelScore = Math.max(20, 50 - commands.length * 4);
        setScore(prev => prev + levelScore);
        addStars(4);
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

  const cellSize = level.gridSize <= 6 ? 50 : 40;

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-4 md:p-6 relative overflow-hidden">
      <FloatingShapes />
      <Confetti show={showConfetti} />

      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <motion.button onClick={() => router.push('/games/programming')} className="glass px-3 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors text-sm min-h-[44px] touch-target" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>← Back</motion.button>
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
        <motion.div className="text-center mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">📦 {level.name}</h1>
          <p className="text-gray-400 text-sm">Create functions to solve puzzles efficiently!</p>
          {level.tutorial && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-emerald-400 text-xs mt-2 glass inline-block px-3 py-1 rounded-full">
              💡 {level.tutorial}
            </motion.p>
          )}
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">
          {/* Blocks Panel */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-4 w-full lg:w-auto">
            <h3 className="text-white font-semibold mb-3 text-center">📦 Blocks</h3>
            
            {/* Functions */}
            <div className="mb-3 pb-3 border-b border-white/10">
              <p className="text-emerald-400 text-xs mb-2 text-center font-semibold">📦 Functions</p>
              <div className="flex lg:flex-col gap-2 flex-wrap justify-center">
                {allFunctions.map(func => (
                  <motion.button
                    key={func.id}
                    onClick={() => !editingFunction && addFunctionCall(func.id)}
                    disabled={commands.length >= level.maxCommands || isRunning || !!editingFunction}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-2 rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2 justify-center min-w-[100px]"
                    style={{ backgroundColor: `${func.color}20`, border: `2px solid ${func.color}` }}
                  >
                    <span>{func.emoji}</span>
                    <span className="text-xs">{func.name}</span>
                  </motion.button>
                ))}
                <motion.button
                  onClick={createNewFunction}
                  disabled={isRunning || !!editingFunction || customFunctions.length >= 2}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-2 rounded-xl font-semibold text-emerald-400 transition-all disabled:opacity-50 flex items-center gap-2 justify-center border-2 border-dashed border-emerald-400/50 hover:border-emerald-400 min-w-[100px]"
                >
                  <span>➕</span>
                  <span className="text-xs">New Function</span>
                </motion.button>
              </div>
            </div>

            {/* Basic Commands */}
            <div className="flex lg:flex-col gap-2 flex-wrap justify-center">
              {(['forward', 'left', 'right'] as BaseCommand[]).map((cmd) => (
                <motion.button
                  key={cmd}
                  onClick={() => addCommand(cmd)}
                  disabled={(!editingFunction && commands.length >= level.maxCommands) || isRunning}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-2 rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2 min-w-[100px] justify-center"
                  style={{ backgroundColor: `${commandIcons[cmd].color}20`, border: `2px solid ${commandIcons[cmd].color}` }}
                >
                  <span className="text-lg">{commandIcons[cmd].icon}</span>
                  <span className="text-xs">{commandIcons[cmd].label}</span>
                </motion.button>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-3 text-center">{commands.length}/{level.maxCommands} blocks</p>
          </motion.div>

          {/* Grid */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-4">
            <div className="flex justify-center gap-3 mb-3 flex-wrap text-xs">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500/30 border border-green-400/50" /><span className="text-gray-300">Path</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-400/50" /><span className="text-gray-300">Goal</span></div>
            </div>
            <div className="grid gap-1 mx-auto" style={{ gridTemplateColumns: `repeat(${level.gridSize}, ${cellSize}px)`, gridTemplateRows: `repeat(${level.gridSize}, ${cellSize}px)` }}>
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
                      isObstacle ? 'bg-red-900/50 border-2 border-red-500/50' 
                      : isGoal ? 'bg-yellow-500/30 border-2 border-yellow-400/60'
                      : isStart && !isRobot ? 'bg-blue-500/30 border-2 border-blue-400/50'
                      : isPath ? 'bg-green-500/25 border-2 border-green-400/40'
                      : 'bg-white/5 border border-white/10'
                    }`}
                    style={{ width: cellSize, height: cellSize }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.003 }}
                  >
                    {isPath && !isGoal && !isRobot && !isStart && <div className="w-1.5 h-1.5 rounded-full bg-green-400/50" />}
                    {isGoal && !isRobot && <motion.span className="text-lg" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>⭐</motion.span>}
                    {isObstacle && <span className="text-lg">🧱</span>}
                    {isRobot && <motion.div className="text-xl" animate={{ rotate: getRotation(robotDir) }} transition={{ duration: 0.3 }}>🤖</motion.div>}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Program Panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-4 w-full lg:w-64">
            <h3 className="text-white font-semibold mb-3 text-center">📝 Your Program</h3>
            
            <div className="min-h-[150px] max-h-[250px] overflow-y-auto mb-3">
              {commands.length === 0 ? (
                <div className="text-gray-500 text-center py-8 text-xs">Add blocks or call functions!</div>
              ) : (
                <div className="space-y-1">
                  {commands.map((cmd, index) => {
                    const func = cmd.type === 'function' ? allFunctions.find(f => f.id === cmd.functionId) : null;
                    return (
                      <motion.div
                        key={cmd.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${
                          executingIndex === index ? 'ring-2 ring-yellow-400 bg-yellow-500/20' : 'bg-white/5'
                        }`}
                        style={{ borderLeft: func ? `3px solid ${func.color}` : `3px solid ${commandIcons[cmd.command!].color}` }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        {func ? (
                          <>
                            <span>{func.emoji}</span>
                            <span className="text-white text-xs flex-1">{func.name}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-base">{commandIcons[cmd.command!].icon}</span>
                            <span className="text-white text-xs flex-1">{commandIcons[cmd.command!].label}</span>
                          </>
                        )}
                        {!isRunning && (
                          <button onClick={() => removeCommand(cmd.id)} className="text-red-400 hover:text-red-300 text-sm">×</button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <motion.button onClick={executeCommands} disabled={commands.length === 0 || isRunning || isComplete} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 py-2 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 text-sm">▶️ Run</motion.button>
              <motion.button onClick={clearCommands} disabled={isRunning} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-3 py-2 rounded-xl text-white bg-red-600/50 text-sm">🗑️</motion.button>
              <motion.button onClick={resetLevel} disabled={isRunning} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-3 py-2 rounded-xl text-white bg-blue-600/50 text-sm">🔄</motion.button>
            </div>
          </motion.div>
        </div>

        <motion.div className="text-center mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {!showHint ? (
            <button onClick={() => setShowHint(true)} className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">💡 Need a hint?</button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-block glass px-4 py-2 rounded-xl">
              <span className="text-yellow-400 text-sm">💡 {level.hint}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Function Editor Modal */}
        <AnimatePresence>
          {showFunctionEditor && editingFunction && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold text-white mb-4 text-center">✨ Create Function</h3>
                
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">{editingFunction.emoji}</span>
                    <input
                      type="text"
                      value={editingFunction.name}
                      onChange={(e) => setEditingFunction({ ...editingFunction, name: e.target.value })}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                      maxLength={20}
                    />
                  </div>
                  
                  <p className="text-gray-400 text-xs mb-2">Add commands to your function ({editingFunction.commands.length}/{level.maxFunctionCommands}):</p>
                  
                  <div className="flex gap-2 mb-4 justify-center">
                    {(['forward', 'left', 'right'] as BaseCommand[]).map((cmd) => (
                      <motion.button
                        key={cmd}
                        onClick={() => addCommand(cmd)}
                        disabled={editingFunction.commands.length >= level.maxFunctionCommands}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-2 rounded-lg text-white text-sm disabled:opacity-50"
                        style={{ backgroundColor: `${commandIcons[cmd].color}30`, border: `2px solid ${commandIcons[cmd].color}` }}
                      >
                        {commandIcons[cmd].icon}
                      </motion.button>
                    ))}
                  </div>

                  <div className="min-h-[80px] bg-white/5 rounded-lg p-3">
                    {editingFunction.commands.length === 0 ? (
                      <p className="text-gray-500 text-center text-xs">Click commands above to add them</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {editingFunction.commands.map((cmd, index) => (
                          <motion.div
                            key={index}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg"
                            style={{ backgroundColor: `${commandIcons[cmd].color}30`, border: `1px solid ${commandIcons[cmd].color}` }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <span>{commandIcons[cmd].icon}</span>
                            <span className="text-white text-xs">{commandIcons[cmd].label}</span>
                            <button onClick={() => removeFromFunction(index)} className="text-red-400 text-sm ml-1">×</button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={() => { setEditingFunction(null); setShowFunctionEditor(false); }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2 rounded-xl text-gray-300 bg-white/10 text-sm"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={saveFunction}
                    disabled={editingFunction.commands.length === 0}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2 rounded-xl text-white bg-emerald-600 disabled:opacity-50 text-sm"
                  >
                    Save Function
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hitObstacle && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed bottom-20 left-1/2 -translate-x-1/2 glass px-6 py-3 rounded-xl border border-red-500/50">
              <p className="text-red-400 font-semibold text-sm">💥 Oops! Try again!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isComplete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="glass rounded-3xl p-8 max-w-md text-center">
                <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-6xl mb-4">🎉</motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Function Master!</h2>
                <p className="text-gray-300 mb-4 text-sm">Solved with {commands.length} blocks!</p>
                <div className="text-3xl font-bold text-yellow-400 mb-6">⭐ +{Math.max(20, 50 - commands.length * 4)}</div>
                <motion.button onClick={nextLevel} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-cosmic px-8 py-4 rounded-xl text-lg">
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


