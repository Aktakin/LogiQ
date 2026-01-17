'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

type CellType = 'empty' | 'path' | 'wall' | 'start' | 'goal' | 'fork' | 'gem' | 'trap';
type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

interface ConditionBlock {
  id: string;
  type: 'IF' | 'AND' | 'OR';
  condition: 'pathAhead' | 'pathLeft' | 'pathRight' | 'gemAhead' | 'trapAhead' | 'atFork';
  action?: 'moveForward' | 'turnLeft' | 'turnRight';
  thenAction?: 'moveForward' | 'turnLeft' | 'turnRight';
  elseAction?: 'moveForward' | 'turnLeft' | 'turnRight';
}

interface CommandBlock {
  id: string;
  type: 'IF_THEN' | 'IF_THEN_ELSE' | 'AND' | 'OR' | 'MOVE' | 'TURN_LEFT' | 'TURN_RIGHT';
  condition1?: string;
  condition2?: string;
  operator?: 'AND' | 'OR';
  thenAction?: string;
  elseAction?: string;
}

interface Level {
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

const levels: Level[] = [
  {
    id: 1,
    title: 'First Fork',
    description: 'Use IF to choose the right path! Only one way leads to the star.',
    grid: [
      ['empty', 'empty', 'goal', 'empty', 'empty'],
      ['empty', 'empty', 'path', 'empty', 'empty'],
      ['empty', 'wall', 'fork', 'wall', 'empty'],
      ['empty', 'empty', 'path', 'empty', 'empty'],
      ['empty', 'empty', 'start', 'empty', 'empty'],
    ],
    start: { x: 2, y: 4 },
    startDirection: 'up',
    goal: { x: 2, y: 0 },
    availableBlocks: ['MOVE', 'IF_THEN'],
    maxBlocks: 5,
    hint: 'IF path ahead, THEN move forward!',
  },
  {
    id: 2,
    title: 'Left or Right?',
    description: 'The path splits! Check which direction has a path.',
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
    hint: 'At the fork, check IF path left, THEN turn left!',
  },
  {
    id: 3,
    title: 'Avoid the Trap',
    description: 'One path has a trap! Use IF to check for danger.',
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
    availableBlocks: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_THEN_ELSE'],
    maxBlocks: 6,
    hint: 'IF trap ahead after turning left, ELSE turn right!',
  },
  {
    id: 4,
    title: 'Double Check',
    description: 'Use IF-THEN-ELSE to handle both outcomes!',
    grid: [
      ['goal', 'empty', 'empty', 'empty', 'trap'],
      ['path', 'empty', 'empty', 'empty', 'path'],
      ['path', 'path', 'fork', 'path', 'path'],
      ['empty', 'empty', 'path', 'empty', 'empty'],
      ['empty', 'empty', 'start', 'empty', 'empty'],
    ],
    start: { x: 2, y: 4 },
    startDirection: 'up',
    goal: { x: 0, y: 0 },
    availableBlocks: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_THEN_ELSE'],
    maxBlocks: 8,
    hint: 'IF path right has trap, THEN turn left, ELSE turn right',
  },
  {
    id: 5,
    title: 'AND Logic',
    description: 'Both conditions must be true! Path AND no trap.',
    grid: [
      ['empty', 'empty', 'goal', 'empty', 'empty'],
      ['empty', 'trap', 'path', 'trap', 'empty'],
      ['empty', 'path', 'fork', 'path', 'empty'],
      ['empty', 'empty', 'path', 'empty', 'empty'],
      ['empty', 'empty', 'start', 'empty', 'empty'],
    ],
    start: { x: 2, y: 4 },
    startDirection: 'up',
    goal: { x: 2, y: 0 },
    availableBlocks: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_THEN', 'AND'],
    maxBlocks: 6,
    hint: 'IF path ahead AND no trap, THEN move forward!',
  },
  {
    id: 6,
    title: 'OR Logic',
    description: 'Either condition can be true! Gem OR safe path.',
    grid: [
      ['empty', 'goal', 'empty', 'gem', 'empty'],
      ['empty', 'path', 'empty', 'path', 'empty'],
      ['empty', 'path', 'fork', 'path', 'empty'],
      ['empty', 'empty', 'path', 'empty', 'empty'],
      ['empty', 'empty', 'start', 'empty', 'empty'],
    ],
    start: { x: 2, y: 4 },
    startDirection: 'up',
    goal: { x: 1, y: 0 },
    availableBlocks: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_THEN', 'OR'],
    maxBlocks: 7,
    hint: 'Go left to the goal, OR right to collect a gem first!',
  },
  {
    id: 7,
    title: 'Maze Runner',
    description: 'Navigate through multiple forks using conditions!',
    grid: [
      ['goal', 'path', 'path', 'trap', 'empty'],
      ['empty', 'empty', 'fork', 'path', 'empty'],
      ['empty', 'path', 'path', 'empty', 'empty'],
      ['empty', 'fork', 'empty', 'empty', 'empty'],
      ['empty', 'start', 'empty', 'empty', 'empty'],
    ],
    start: { x: 1, y: 4 },
    startDirection: 'up',
    goal: { x: 0, y: 0 },
    availableBlocks: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_THEN', 'IF_THEN_ELSE'],
    maxBlocks: 10,
    hint: 'At each fork, check the paths and choose wisely!',
  },
  {
    id: 8,
    title: 'Complex Path',
    description: 'Combine AND, OR, and IF-THEN-ELSE!',
    grid: [
      ['trap', 'path', 'goal', 'path', 'gem'],
      ['empty', 'path', 'path', 'path', 'empty'],
      ['empty', 'empty', 'fork', 'empty', 'empty'],
      ['empty', 'empty', 'path', 'empty', 'empty'],
      ['empty', 'empty', 'start', 'empty', 'empty'],
    ],
    start: { x: 2, y: 4 },
    startDirection: 'up',
    goal: { x: 2, y: 0 },
    availableBlocks: ['MOVE', 'TURN_LEFT', 'TURN_RIGHT', 'IF_THEN', 'IF_THEN_ELSE', 'AND', 'OR'],
    maxBlocks: 8,
    hint: 'Check for traps before turning!',
  },
];

const cellColors: Record<CellType, string> = {
  empty: '#1e293b',
  path: '#334155',
  wall: '#0f172a',
  start: '#3b82f6',
  goal: '#fbbf24',
  fork: '#8b5cf6',
  gem: '#10b981',
  trap: '#ef4444',
};

const cellEmojis: Record<CellType, string> = {
  empty: '',
  path: '',
  wall: '🧱',
  start: '',
  goal: '⭐',
  fork: '🔀',
  gem: '💎',
  trap: '🔥',
};

const conditionLabels: Record<string, string> = {
  pathAhead: 'path ahead',
  pathLeft: 'path left',
  pathRight: 'path right',
  noTrapAhead: 'no trap ahead',
  noTrapLeft: 'no trap left',
  noTrapRight: 'no trap right',
  gemAhead: 'gem ahead',
  atFork: 'at fork',
};

const actionLabels: Record<string, string> = {
  moveForward: 'move forward',
  turnLeft: 'turn left',
  turnRight: 'turn right',
};

export default function ConditionsGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [robotPos, setRobotPos] = useState<Position>({ x: 0, y: 0 });
  const [robotDir, setRobotDir] = useState<Direction>('up');
  const [program, setProgram] = useState<CommandBlock[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [executingIndex, setExecutingIndex] = useState(-1);
  const [showHint, setShowHint] = useState(false);
  const [gemsCollected, setGemsCollected] = useState(0);
  
  // Block builder state
  const [selectedBlockType, setSelectedBlockType] = useState<string | null>(null);
  const [condition1, setCondition1] = useState('pathAhead');
  const [condition2, setCondition2] = useState('noTrapAhead');
  const [operator, setOperator] = useState<'AND' | 'OR'>('AND');
  const [thenAction, setThenAction] = useState('moveForward');
  const [elseAction, setElseAction] = useState('turnRight');

  const level = levels[currentLevelIndex];

  const resetLevel = useCallback(() => {
    if (level) {
      setRobotPos({ ...level.start });
      setRobotDir(level.startDirection);
      setProgram([]);
      setIsRunning(false);
      setIsComplete(false);
      setIsFailed(false);
      setExecutingIndex(-1);
      setShowHint(false);
      setGemsCollected(0);
      setSelectedBlockType(null);
    }
  }, [level]);

  useEffect(() => {
    resetLevel();
  }, [resetLevel, currentLevelIndex]);

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
    const idx = dirs.indexOf(dir);
    return dirs[(idx + 1) % 4];
  };

  const turnRight = (dir: Direction): Direction => {
    const dirs: Direction[] = ['up', 'right', 'down', 'left'];
    const idx = dirs.indexOf(dir);
    return dirs[(idx + 1) % 4];
  };

  const getCellAt = (pos: Position, dir: Direction, offset: 'ahead' | 'left' | 'right' = 'ahead'): CellType | null => {
    let checkDir = dir;
    if (offset === 'left') checkDir = turnLeft(dir);
    if (offset === 'right') checkDir = turnRight(dir);
    
    const delta = getDirectionDelta(checkDir);
    const newX = pos.x + delta.x;
    const newY = pos.y + delta.y;
    
    if (newX < 0 || newX >= level.grid[0].length || newY < 0 || newY >= level.grid.length) {
      return null;
    }
    return level.grid[newY][newX];
  };

  const evaluateCondition = (condition: string, pos: Position, dir: Direction): boolean => {
    switch (condition) {
      case 'pathAhead': {
        const cell = getCellAt(pos, dir, 'ahead');
        return cell !== null && cell !== 'empty' && cell !== 'wall';
      }
      case 'pathLeft': {
        const cell = getCellAt(pos, dir, 'left');
        return cell !== null && cell !== 'empty' && cell !== 'wall';
      }
      case 'pathRight': {
        const cell = getCellAt(pos, dir, 'right');
        return cell !== null && cell !== 'empty' && cell !== 'wall';
      }
      case 'noTrapAhead': {
        const cell = getCellAt(pos, dir, 'ahead');
        return cell !== 'trap';
      }
      case 'noTrapLeft': {
        const cell = getCellAt(pos, dir, 'left');
        return cell !== 'trap';
      }
      case 'noTrapRight': {
        const cell = getCellAt(pos, dir, 'right');
        return cell !== 'trap';
      }
      case 'gemAhead': {
        const cell = getCellAt(pos, dir, 'ahead');
        return cell === 'gem';
      }
      case 'atFork': {
        return level.grid[pos.y][pos.x] === 'fork';
      }
      default:
        return false;
    }
  };

  const executeAction = async (action: string, currentPos: Position, currentDir: Direction): Promise<{ pos: Position; dir: Direction; failed: boolean }> => {
    let newPos = { ...currentPos };
    let newDir = currentDir;
    let failed = false;

    switch (action) {
      case 'moveForward': {
        const delta = getDirectionDelta(currentDir);
        const nextX = currentPos.x + delta.x;
        const nextY = currentPos.y + delta.y;
        
        if (nextX >= 0 && nextX < level.grid[0].length && nextY >= 0 && nextY < level.grid.length) {
          const nextCell = level.grid[nextY][nextX];
          if (nextCell !== 'empty' && nextCell !== 'wall') {
            newPos = { x: nextX, y: nextY };
            if (nextCell === 'trap') {
              failed = true;
            }
            if (nextCell === 'gem') {
              setGemsCollected(prev => prev + 1);
            }
          }
        }
        break;
      }
      case 'turnLeft':
        newDir = turnLeft(currentDir);
        break;
      case 'turnRight':
        newDir = turnRight(currentDir);
        break;
    }

    return { pos: newPos, dir: newDir, failed };
  };

  const runProgram = async () => {
    if (program.length === 0 || isRunning) return;
    
    setIsRunning(true);
    setIsFailed(false);
    setIsComplete(false);
    
    let currentPos = { ...level.start };
    let currentDir = level.startDirection;
    setRobotPos(currentPos);
    setRobotDir(currentDir);

    for (let i = 0; i < program.length; i++) {
      setExecutingIndex(i);
      await new Promise(resolve => setTimeout(resolve, 600));

      const block = program[i];
      let actionToExecute: string | null = null;

      switch (block.type) {
        case 'MOVE':
          actionToExecute = 'moveForward';
          break;
        case 'TURN_LEFT':
          actionToExecute = 'turnLeft';
          break;
        case 'TURN_RIGHT':
          actionToExecute = 'turnRight';
          break;
        case 'IF_THEN': {
          let conditionResult = evaluateCondition(block.condition1!, currentPos, currentDir);
          if (block.operator === 'AND' && block.condition2) {
            conditionResult = conditionResult && evaluateCondition(block.condition2, currentPos, currentDir);
          } else if (block.operator === 'OR' && block.condition2) {
            conditionResult = conditionResult || evaluateCondition(block.condition2, currentPos, currentDir);
          }
          if (conditionResult) {
            actionToExecute = block.thenAction!;
          }
          break;
        }
        case 'IF_THEN_ELSE': {
          let conditionResult = evaluateCondition(block.condition1!, currentPos, currentDir);
          if (block.operator === 'AND' && block.condition2) {
            conditionResult = conditionResult && evaluateCondition(block.condition2, currentPos, currentDir);
          } else if (block.operator === 'OR' && block.condition2) {
            conditionResult = conditionResult || evaluateCondition(block.condition2, currentPos, currentDir);
          }
          actionToExecute = conditionResult ? block.thenAction! : block.elseAction!;
          break;
        }
      }

      if (actionToExecute) {
        const result = await executeAction(actionToExecute, currentPos, currentDir);
        currentPos = result.pos;
        currentDir = result.dir;
        setRobotPos(currentPos);
        setRobotDir(currentDir);

        if (result.failed) {
          setIsFailed(true);
          setIsRunning(false);
          setExecutingIndex(-1);
          recordAnswer(false);
          return;
        }

        // Check goal
        if (currentPos.x === level.goal.x && currentPos.y === level.goal.y) {
          setIsComplete(true);
          setShowConfetti(true);
          addStars(3);
          recordAnswer(true);
          incrementGamesPlayed();
          setTimeout(() => setShowConfetti(false), 3000);
          setIsRunning(false);
          setExecutingIndex(-1);
          return;
        }
      }
    }

    setIsRunning(false);
    setExecutingIndex(-1);
    
    // Check if at goal after all commands
    if (currentPos.x === level.goal.x && currentPos.y === level.goal.y) {
      setIsComplete(true);
      setShowConfetti(true);
      addStars(3);
      recordAnswer(true);
      incrementGamesPlayed();
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const addBlock = () => {
    if (!selectedBlockType || program.length >= level.maxBlocks) return;

    const newBlock: CommandBlock = {
      id: `${Date.now()}-${Math.random()}`,
      type: selectedBlockType as CommandBlock['type'],
    };

    if (selectedBlockType === 'IF_THEN' || selectedBlockType === 'IF_THEN_ELSE') {
      newBlock.condition1 = condition1;
      if (operator && condition2 && level.availableBlocks.includes(operator)) {
        newBlock.operator = operator;
        newBlock.condition2 = condition2;
      }
      newBlock.thenAction = thenAction;
      if (selectedBlockType === 'IF_THEN_ELSE') {
        newBlock.elseAction = elseAction;
      }
    }

    setProgram(prev => [...prev, newBlock]);
    setSelectedBlockType(null);
  };

  const removeBlock = (id: string) => {
    if (!isRunning) {
      setProgram(prev => prev.filter(b => b.id !== id));
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
    } else {
      router.push('/games/programming');
    }
  };

  const getBlockDisplay = (block: CommandBlock): string => {
    switch (block.type) {
      case 'MOVE': return '⬆️ Move Forward';
      case 'TURN_LEFT': return '↩️ Turn Left';
      case 'TURN_RIGHT': return '↪️ Turn Right';
      case 'IF_THEN': {
        let cond = conditionLabels[block.condition1!];
        if (block.operator && block.condition2) {
          cond += ` ${block.operator} ${conditionLabels[block.condition2]}`;
        }
        return `🔀 IF ${cond} THEN ${actionLabels[block.thenAction!]}`;
      }
      case 'IF_THEN_ELSE': {
        let cond = conditionLabels[block.condition1!];
        if (block.operator && block.condition2) {
          cond += ` ${block.operator} ${conditionLabels[block.condition2]}`;
        }
        return `🔀 IF ${cond} THEN ${actionLabels[block.thenAction!]} ELSE ${actionLabels[block.elseAction!]}`;
      }
      default: return block.type;
    }
  };

  const getBlockColor = (type: string): string => {
    switch (type) {
      case 'MOVE': return '#3b82f6';
      case 'TURN_LEFT': return '#f59e0b';
      case 'TURN_RIGHT': return '#f59e0b';
      case 'IF_THEN': return '#8b5cf6';
      case 'IF_THEN_ELSE': return '#ec4899';
      case 'AND': return '#10b981';
      case 'OR': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const getRobotEmoji = (dir: Direction): string => {
    switch (dir) {
      case 'up': return '🤖';
      case 'down': return '🤖';
      case 'left': return '🤖';
      case 'right': return '🤖';
    }
  };

  const getRobotRotation = (dir: Direction): number => {
    switch (dir) {
      case 'up': return 0;
      case 'right': return 90;
      case 'down': return 180;
      case 'left': return 270;
    }
  };

  if (!level) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 p-4 md:p-6">
      <Confetti show={showConfetti} />

      {/* Header */}
      <header className="max-w-6xl mx-auto mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <motion.button
            onClick={() => router.push('/games/programming')}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:text-white transition-all text-sm backdrop-blur"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Back
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 border border-white/20">
              <span className="text-gray-400 text-sm">Level </span>
              <span className="text-white font-bold">{currentLevelIndex + 1}/{levels.length}</span>
            </div>
            {gemsCollected > 0 && (
              <div className="bg-emerald-500/20 backdrop-blur rounded-xl px-4 py-2 border border-emerald-500/30">
                <span className="text-emerald-400">💎 {gemsCollected}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        {/* Level Info */}
        <motion.div
          className="mb-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-white mb-1">{level.title}</h1>
          <p className="text-gray-400">{level.description}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grid */}
          <motion.div
            className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">🗺️ Map</h2>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500"></span> Fork</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500"></span> Goal</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"></span> Trap</span>
              </div>
            </div>
            
            <div 
              className="grid gap-1 mx-auto"
              style={{ 
                gridTemplateColumns: `repeat(${level.grid[0].length}, 1fr)`,
                maxWidth: `${level.grid[0].length * 60}px`
              }}
            >
              {level.grid.map((row, y) =>
                row.map((cell, x) => {
                  const isRobot = robotPos.x === x && robotPos.y === y;
                  const isGoal = level.goal.x === x && level.goal.y === y;
                  
                  return (
                    <motion.div
                      key={`${x}-${y}`}
                      className="aspect-square rounded-lg flex items-center justify-center relative text-2xl"
                      style={{ 
                        backgroundColor: cellColors[cell],
                        border: isGoal ? '2px solid #fbbf24' : cell === 'fork' ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)'
                      }}
                      animate={isRobot ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {isRobot ? (
                        <motion.div
                          animate={{ rotate: getRobotRotation(robotDir) }}
                          transition={{ duration: 0.2 }}
                          className="text-2xl"
                        >
                          🤖
                        </motion.div>
                      ) : (
                        cellEmojis[cell]
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Status */}
            <div className="mt-4 text-center">
              {isFailed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-red-400 font-semibold"
                >
                  🔥 Hit a trap! Try again.
                </motion.div>
              )}
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-yellow-400 font-semibold"
                >
                  ⭐ Level Complete! +3 Stars
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Program Panel */}
          <motion.div
            className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">📝 Program</h2>
              <span className="text-xs text-gray-500">{program.length}/{level.maxBlocks} blocks</span>
            </div>

            {/* Program Blocks */}
            <div className="min-h-[150px] bg-black/20 rounded-xl p-3 mb-4 space-y-2">
              {program.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-4">Add blocks below...</div>
              ) : (
                <Reorder.Group values={program} onReorder={setProgram} className="space-y-2">
                  {program.map((block, idx) => (
                    <Reorder.Item key={block.id} value={block}>
                      <motion.div
                        className={`px-3 py-2 rounded-lg text-white text-sm font-medium flex items-center justify-between ${
                          executingIndex === idx ? 'ring-2 ring-yellow-400' : ''
                        }`}
                        style={{ backgroundColor: `${getBlockColor(block.type)}40`, border: `2px solid ${getBlockColor(block.type)}` }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <span className="flex-1 truncate">{getBlockDisplay(block)}</span>
                        {!isRunning && (
                          <button 
                            onClick={() => removeBlock(block.id)}
                            className="ml-2 text-gray-400 hover:text-red-400"
                          >
                            ×
                          </button>
                        )}
                      </motion.div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </div>

            {/* Block Builder */}
            <div className="space-y-3">
              <div className="text-xs text-gray-500 mb-2">ADD BLOCK</div>
              
              {/* Block Type Selection */}
              <div className="flex flex-wrap gap-2">
                {level.availableBlocks.filter(b => !['AND', 'OR'].includes(b)).map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedBlockType(type)}
                    disabled={program.length >= level.maxBlocks || isRunning}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                      selectedBlockType === type ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ 
                      backgroundColor: `${getBlockColor(type)}30`,
                      border: `2px solid ${getBlockColor(type)}`,
                      color: getBlockColor(type)
                    }}
                  >
                    {type === 'MOVE' && '⬆️ Move'}
                    {type === 'TURN_LEFT' && '↩️ Left'}
                    {type === 'TURN_RIGHT' && '↪️ Right'}
                    {type === 'IF_THEN' && '🔀 IF-THEN'}
                    {type === 'IF_THEN_ELSE' && '🔀 IF-ELSE'}
                  </button>
                ))}
              </div>

              {/* Condition Builder */}
              <AnimatePresence>
                {(selectedBlockType === 'IF_THEN' || selectedBlockType === 'IF_THEN_ELSE') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-black/20 rounded-xl p-3 space-y-3"
                  >
                    {/* Condition 1 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-purple-400 font-bold text-sm">IF</span>
                      <select
                        value={condition1}
                        onChange={(e) => setCondition1(e.target.value)}
                        className="bg-purple-500/20 border border-purple-500/50 rounded px-2 py-1 text-white text-sm"
                      >
                        <option value="pathAhead">path ahead</option>
                        <option value="pathLeft">path left</option>
                        <option value="pathRight">path right</option>
                        <option value="noTrapAhead">no trap ahead</option>
                        <option value="noTrapLeft">no trap left</option>
                        <option value="noTrapRight">no trap right</option>
                        <option value="gemAhead">gem ahead</option>
                        <option value="atFork">at fork</option>
                      </select>
                    </div>

                    {/* AND/OR Operator */}
                    {(level.availableBlocks.includes('AND') || level.availableBlocks.includes('OR')) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={operator}
                          onChange={(e) => setOperator(e.target.value as 'AND' | 'OR')}
                          className="bg-emerald-500/20 border border-emerald-500/50 rounded px-2 py-1 text-white text-sm"
                        >
                          {level.availableBlocks.includes('AND') && <option value="AND">AND</option>}
                          {level.availableBlocks.includes('OR') && <option value="OR">OR</option>}
                        </select>
                        <select
                          value={condition2}
                          onChange={(e) => setCondition2(e.target.value)}
                          className="bg-purple-500/20 border border-purple-500/50 rounded px-2 py-1 text-white text-sm"
                        >
                          <option value="pathAhead">path ahead</option>
                          <option value="pathLeft">path left</option>
                          <option value="pathRight">path right</option>
                          <option value="noTrapAhead">no trap ahead</option>
                          <option value="noTrapLeft">no trap left</option>
                          <option value="noTrapRight">no trap right</option>
                          <option value="gemAhead">gem ahead</option>
                          <option value="atFork">at fork</option>
                        </select>
                      </div>
                    )}

                    {/* THEN Action */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-green-400 font-bold text-sm">THEN</span>
                      <select
                        value={thenAction}
                        onChange={(e) => setThenAction(e.target.value)}
                        className="bg-green-500/20 border border-green-500/50 rounded px-2 py-1 text-white text-sm"
                      >
                        <option value="moveForward">move forward</option>
                        <option value="turnLeft">turn left</option>
                        <option value="turnRight">turn right</option>
                      </select>
                    </div>

                    {/* ELSE Action */}
                    {selectedBlockType === 'IF_THEN_ELSE' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-pink-400 font-bold text-sm">ELSE</span>
                        <select
                          value={elseAction}
                          onChange={(e) => setElseAction(e.target.value)}
                          className="bg-pink-500/20 border border-pink-500/50 rounded px-2 py-1 text-white text-sm"
                        >
                          <option value="moveForward">move forward</option>
                          <option value="turnLeft">turn left</option>
                          <option value="turnRight">turn right</option>
                        </select>
                      </div>
                    )}

                    <button
                      onClick={addBlock}
                      className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm"
                    >
                      Add Block
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick add for simple blocks */}
              {selectedBlockType && !['IF_THEN', 'IF_THEN_ELSE'].includes(selectedBlockType) && (
                <button
                  onClick={addBlock}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm"
                >
                  Add {selectedBlockType.replace('_', ' ')}
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={runProgram}
                disabled={program.length === 0 || isRunning}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold transition-colors"
              >
                ▶ Run
              </button>
              <button
                onClick={resetLevel}
                disabled={isRunning}
                className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:text-white transition-colors"
              >
                🔄
              </button>
            </div>

            {/* Hint */}
            <div className="mt-3 text-center">
              {!showHint ? (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-gray-500 hover:text-yellow-400 text-sm transition-colors"
                >
                  💡 Need a hint?
                </button>
              ) : (
                <div className="text-yellow-400 text-sm bg-yellow-500/10 rounded-lg px-3 py-2">
                  💡 {level.hint}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Success Modal */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 border border-purple-500/50 rounded-2xl p-8 max-w-md text-center"
              >
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-white mb-2">Level Complete!</h2>
                <p className="text-gray-400 mb-4">
                  You navigated the path using conditional logic!
                </p>
                {gemsCollected > 0 && (
                  <p className="text-emerald-400 mb-4">💎 Collected {gemsCollected} gem(s)!</p>
                )}
                <div className="text-3xl font-bold text-yellow-400 mb-6">⭐ +3 Stars!</div>
                <button
                  onClick={nextLevel}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold"
                >
                  {currentLevelIndex < levels.length - 1 ? 'Next Level →' : 'Complete! 🏆'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
