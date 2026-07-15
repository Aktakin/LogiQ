'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import {
  frogFunctionPond3Levels,
  type BaseCommand,
  type CustomFunction,
  type Direction,
  type FunctionStep,
  type Position,
} from '@/lib/frogFunctionPond3Levels';

interface CommandBlock {
  id: string;
  type: 'command' | 'function';
  command?: BaseCommand;
  functionId?: string;
}

const commandIcons: Record<BaseCommand, { icon: string; label: string; color: string }> = {
  forward: { icon: '🐸', label: 'Hop', color: '#6366f1' },
  left: { icon: '↩️', label: 'Turn left', color: '#8b5cf6' },
  right: { icon: '↪️', label: 'Turn right', color: '#a855f7' },
};

const functionColors = ['#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#38bdf8'];
const functionEmojis = ['⚡', '🧬', '📡', '🔧', '🧪', '💠', '🌀', '⚙️'];

function getSteps(func: CustomFunction): FunctionStep[] {
  if (func.steps?.length) return func.steps;
  if (func.commands?.length) {
    return func.commands.map((c) => ({ type: 'command' as const, command: c }));
  }
  return [];
}

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
  return { up: 0, right: 90, down: 180, left: 270 }[direction];
}

function posKey(p: Position): string {
  return `${p.x},${p.y}`;
}

function pathKeysRequired(path: Position[]): Set<string> {
  return new Set(path.map(posKey));
}

function hasVisitedAllPathTiles(visited: Set<string>, required: Set<string>): boolean {
  for (const k of required) {
    if (!visited.has(k)) return false;
  }
  return true;
}

/** Expand nested function calls into base hops (with cycle / depth guards). */
function expandToBase(
  steps: FunctionStep[],
  funcs: CustomFunction[],
  originalIndex: number,
  stack: string[] = [],
  depth = 0
): { command: BaseCommand; originalIndex: number }[] {
  if (depth > 12) return [];
  const out: { command: BaseCommand; originalIndex: number }[] = [];
  for (const step of steps) {
    if (step.type === 'command' && step.command) {
      out.push({ command: step.command, originalIndex });
    } else if (step.type === 'function' && step.functionId) {
      if (stack.includes(step.functionId)) continue; // prevent infinite recursion
      const fn = funcs.find((f) => f.id === step.functionId);
      if (!fn) continue;
      out.push(
        ...expandToBase(getSteps(fn), funcs, originalIndex, [...stack, step.functionId], depth + 1)
      );
    }
  }
  return out;
}

export default function FrogFunctionPond3() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();
  const levels = frogFunctionPond3Levels;
  const LEVEL_PASSCODE = '4311';

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
  const [pathIncomplete, setPathIncomplete] = useState(false);
  const [nestRequiredFail, setNestRequiredFail] = useState(false);
  const [showFunctionEditor, setShowFunctionEditor] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [levelPickerUnlocked, setLevelPickerUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const level = levels[currentLevelIndex];
  const allFunctions = [...(level.predefinedFunctions || []), ...customFunctions];
  const allowNesting = level.allowNesting !== false;
  const maxFuncSlots = level.maxCustomFunctions ?? 3;

  const resetLevel = useCallback(() => {
    if (!level) return;
    setRobotPos(level.robotStart);
    setRobotDir(level.robotDirection);
    setCommands([]);
    setCustomFunctions([]);
    setIsRunning(false);
    setIsComplete(false);
    setExecutingIndex(-1);
    setShowHint(false);
    setHitObstacle(false);
    setPathIncomplete(false);
    setNestRequiredFail(false);
    setShowFunctionEditor(false);
    setEditingFunction(null);
  }, [level]);

  useEffect(() => {
    resetLevel();
  }, [resetLevel, currentLevelIndex]);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('level');
    const n = Number(raw);
    if (raw && n >= 1 && n <= levels.length) setCurrentLevelIndex(n - 1);
  }, [levels.length]);

  useEffect(() => {
    if (!pathIncomplete) return;
    const t = window.setTimeout(() => setPathIncomplete(false), 5200);
    return () => clearTimeout(t);
  }, [pathIncomplete]);

  useEffect(() => {
    if (!nestRequiredFail) return;
    const t = window.setTimeout(() => setNestRequiredFail(false), 5200);
    return () => clearTimeout(t);
  }, [nestRequiredFail]);

  const openLevelPicker = () => {
    if (isRunning) return;
    setPasscodeInput('');
    setPasscodeError('');
    setShowLevelPicker(true);
  };

  const submitPasscode = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (passcodeInput === LEVEL_PASSCODE) {
      setLevelPickerUnlocked(true);
      setPasscodeError('');
    } else {
      setPasscodeError('Wrong passcode — try again');
    }
  };

  const jumpToLevel = (index: number) => {
    setCommands([]);
    setCustomFunctions([]);
    setEditingFunction(null);
    setShowFunctionEditor(false);
    setIsComplete(false);
    setCurrentLevelIndex(index);
    setShowLevelPicker(false);
  };

  const addCommand = (command: BaseCommand) => {
    // Pond 3: hops only inside kernels — main is function calls only
    if (!editingFunction) return;
    if (getSteps(editingFunction).length < level.maxFunctionCommands) {
      setEditingFunction({
        ...editingFunction,
        steps: [...getSteps(editingFunction), { type: 'command', command }],
      });
    }
  };

  const addFunctionCall = (funcId: string) => {
    if (editingFunction) {
      if (!allowNesting) return;
      if (funcId === editingFunction.id) return; // can't call self
      if (getSteps(editingFunction).length >= level.maxFunctionCommands) return;
      setEditingFunction({
        ...editingFunction,
        steps: [...getSteps(editingFunction), { type: 'function', functionId: funcId }],
      });
      return;
    }
    if (commands.length < level.maxCommands && !isRunning) {
      setCommands((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random()}`, type: 'function', functionId: funcId },
      ]);
    }
  };

  const createNewFunction = () => {
    const newFunc: CustomFunction = {
      id: `func-${Date.now()}`,
      name: `Kernel ${customFunctions.length + 1}`,
      emoji: functionEmojis[customFunctions.length % functionEmojis.length],
      color: functionColors[customFunctions.length % functionColors.length],
      steps: [],
    };
    setEditingFunction(newFunc);
    setShowFunctionEditor(true);
  };

  const saveFunction = () => {
    if (editingFunction && getSteps(editingFunction).length > 0) {
      setCustomFunctions((prev) => {
        const existing = prev.findIndex((f) => f.id === editingFunction.id);
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
    if (!isRunning) setCommands((prev) => prev.filter((c) => c.id !== id));
  };

  const removeFromFunction = (index: number) => {
    if (!editingFunction) return;
    setEditingFunction({
      ...editingFunction,
      steps: getSteps(editingFunction).filter((_, i) => i !== index),
    });
  };

  const clearCommands = () => {
    if (!isRunning) setCommands([]);
  };

  const executeCommands = async () => {
    if (commands.length === 0 || isRunning) return;

    const mainOnlyFns = commands.every((c) => c.type === 'function' && c.functionId);
    const nestedOk = customFunctions.some((f) =>
      getSteps(f).some((s) => s.type === 'function' && s.functionId)
    );
    if (!mainOnlyFns || !nestedOk) {
      setNestRequiredFail(true);
      recordAnswer(false);
      return;
    }

    setIsRunning(true);
    setHitObstacle(false);
    setPathIncomplete(false);
    setNestRequiredFail(false);
    let pos = { ...level.robotStart };
    let dir = level.robotDirection;

    const requiredPathKeys = pathKeysRequired(level.path);
    const visited = new Set<string>([posKey(pos)]);

    const expandedCommands: { command: BaseCommand; originalIndex: number }[] = [];
    commands.forEach((cmd, index) => {
      if (cmd.type === 'command' && cmd.command) {
        expandedCommands.push({ command: cmd.command, originalIndex: index });
      } else if (cmd.type === 'function' && cmd.functionId) {
        const func = allFunctions.find((f) => f.id === cmd.functionId);
        if (func) {
          expandedCommands.push(
            ...expandToBase(getSteps(func), allFunctions, index, [func.id])
          );
        }
      }
    });

    let won = false;

    for (let j = 0; j < expandedCommands.length; j++) {
      setExecutingIndex(expandedCommands[j].originalIndex);
      const cmdType = expandedCommands[j].command;

      await new Promise((resolve) => setTimeout(resolve, 220));

      if (cmdType === 'left') {
        dir = turnLeft(dir);
        setRobotDir(dir);
      } else if (cmdType === 'right') {
        dir = turnRight(dir);
        setRobotDir(dir);
      } else if (cmdType === 'forward') {
        const delta = getDirectionDelta(dir);
        const newPos = { x: pos.x + delta.x, y: pos.y + delta.y };

        if (
          newPos.x < 0 ||
          newPos.x >= level.gridSize ||
          newPos.y < 0 ||
          newPos.y >= level.gridSize
        ) {
          setHitObstacle(true);
          setIsRunning(false);
          setExecutingIndex(-1);
          return;
        }

        if (level.obstacles.some((o) => o.x === newPos.x && o.y === newPos.y)) {
          setHitObstacle(true);
          setIsRunning(false);
          setExecutingIndex(-1);
          return;
        }

        pos = newPos;
        visited.add(posKey(pos));
        setRobotPos({ ...pos });
      }

      const onGoal = pos.x === level.goal.x && pos.y === level.goal.y;
      if (onGoal) {
        if (hasVisitedAllPathTiles(visited, requiredPathKeys)) {
          won = true;
          setIsComplete(true);
          setShowConfetti(true);
          const levelScore = Math.max(25, 60 - commands.length * 5);
          setScore((prev) => prev + levelScore);
          addStars(5);
          recordAnswer(true);
          incrementGamesPlayed();
          setTimeout(() => setShowConfetti(false), 3000);
          break;
        }
        setPathIncomplete(true);
        setIsRunning(false);
        setExecutingIndex(-1);
        recordAnswer(false);
        return;
      }
    }

    setExecutingIndex(-1);
    setIsRunning(false);

    if (!won) {
      if (
        pos.x === level.goal.x &&
        pos.y === level.goal.y &&
        !hasVisitedAllPathTiles(visited, requiredPathKeys)
      ) {
        setPathIncomplete(true);
        recordAnswer(false);
      } else if (pos.x !== level.goal.x || pos.y !== level.goal.y) {
        recordAnswer(false);
      }
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCommands([]);
      setCustomFunctions([]);
      setEditingFunction(null);
      setShowFunctionEditor(false);
      setCurrentLevelIndex((prev) => prev + 1);
    } else {
      router.push('/sections/favourite');
    }
  };

  if (!level) return null;

  const cellSize =
    level.gridSize <= 6
      ? 48
      : level.gridSize <= 8
        ? 40
        : level.gridSize <= 10
          ? 34
          : level.gridSize <= 12
            ? 28
            : level.gridSize <= 14
              ? 22
              : 18;
  const nestableFuncs = editingFunction
    ? allFunctions.filter((f) => f.id !== editingFunction.id)
    : allFunctions;

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-4 md:p-6 relative overflow-hidden bg-gradient-to-b from-fuchsia-950 via-purple-950/90 to-slate-950">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.14] z-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 50% 100%, #818cf8 0%, transparent 55%)',
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
            onClick={() => router.push('/sections/favourite')}
            className="glass px-3 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors text-sm min-h-[44px] touch-target border border-indigo-500/25"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Code Quest
          </motion.button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openLevelPicker}
              disabled={isRunning}
              className="glass px-3 py-1.5 rounded-xl text-center border border-indigo-500/20 hover:border-indigo-400/50 transition-colors disabled:opacity-50"
              title="Level select (passcode)"
            >
              <div className="text-xs text-indigo-300/80">Kernel</div>
              <div className="text-lg font-bold text-white">
                {currentLevelIndex + 1}/{levels.length}
              </div>
            </button>
            <div className="glass px-3 py-1.5 rounded-xl text-center border border-amber-500/15">
              <div className="text-xs text-amber-200/70">Score</div>
              <div className="text-lg font-bold text-amber-300">{score}</div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div className="text-center mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-indigo-300 text-xs font-semibold tracking-wide uppercase mb-1">
            🐸 Frog Function Pond 3
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{level.name}</h1>
          <p className="text-violet-300/90 text-xs font-medium mb-1">{level.concept}</p>
          <p className="text-gray-400 text-sm">
            Harder than Pond 2’s finale — no free helpers, max{' '}
            <span className="text-fuchsia-300 font-semibold">3 kernels</span>, nest or fail.
          </p>
          <p className="text-indigo-200/80 text-xs mt-1.5 max-w-md mx-auto">
            Visit every <span className="text-indigo-300">lily pad</span>, then catch the{' '}
            <span className="text-amber-300">fly</span>.
          </p>
          {level.tutorial && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-violet-200 text-xs mt-2 glass inline-block px-3 py-1 rounded-full border border-violet-500/30"
            >
              💡 {level.tutorial}
            </motion.p>
          )}
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">
          {/* Toolkit */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-4 w-full lg:w-auto border border-indigo-500/20"
          >
            <h3 className="text-white font-semibold mb-3 text-center">🧰 Kernels & hops</h3>
            <p className="text-fuchsia-300/90 text-[10px] text-center mb-2 font-semibold tracking-wide uppercase">
              {customFunctions.length}/{maxFuncSlots} custom kernels
            </p>

            <div className="mb-3 pb-3 border-b border-indigo-500/20">
              <p className="text-indigo-300 text-xs mb-2 text-center font-semibold">
                Nested functions
              </p>
              <div className="flex lg:flex-col gap-2 flex-wrap justify-center">
                {allFunctions.map((func) => (
                  <motion.button
                    key={func.id}
                    onClick={() => addFunctionCall(func.id)}
                    disabled={
                      (!editingFunction && (commands.length >= level.maxCommands || isRunning)) ||
                      (!!editingFunction &&
                        (getSteps(editingFunction).length >= level.maxFunctionCommands ||
                          func.id === editingFunction.id))
                    }
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-2 rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2 justify-center min-w-[100px]"
                    style={{
                      backgroundColor: `${func.color}25`,
                      border: `2px solid ${func.color}`,
                    }}
                  >
                    <span>{func.emoji}</span>
                    <span className="text-xs">{func.name}</span>
                  </motion.button>
                ))}
                <motion.button
                  onClick={createNewFunction}
                  disabled={isRunning || !!editingFunction || customFunctions.length >= maxFuncSlots}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-2 rounded-xl font-semibold text-indigo-300 transition-all disabled:opacity-50 flex items-center gap-2 justify-center border-2 border-dashed border-indigo-400/50 hover:border-indigo-300 min-w-[100px]"
                >
                  <span>➕</span>
                  <span className="text-xs">New kernel</span>
                </motion.button>
              </div>
            </div>

            <div className="flex lg:flex-col gap-2 flex-wrap justify-center">
              {(['forward', 'left', 'right'] as BaseCommand[]).map((cmd) => (
                <motion.button
                  key={cmd}
                  onClick={() => addCommand(cmd)}
                  disabled={
                    !editingFunction || getSteps(editingFunction).length >= level.maxFunctionCommands || isRunning
                  }
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-2 rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2 min-w-[100px] justify-center"
                  style={{
                    backgroundColor: `${commandIcons[cmd].color}25`,
                    border: `2px solid ${commandIcons[cmd].color}`,
                  }}
                >
                  <span className="text-lg">{commandIcons[cmd].icon}</span>
                  <span className="text-xs">{commandIcons[cmd].label}</span>
                </motion.button>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-3 text-center">
              Open a kernel to add hops. Nest kernels inside kernels.
            </p>
            <p className="text-gray-500 text-[10px] mt-1 text-center">
              {commands.length}/{level.maxCommands} main-script blocks
            </p>
          </motion.div>

          {/* Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-4 border border-violet-500/25 shadow-lg shadow-indigo-950/50"
          >
            <div className="flex justify-center gap-3 mb-3 flex-wrap text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-indigo-500/40 border border-indigo-300/50" />
                <span className="text-gray-300">Lily pad</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-500/25 border border-amber-400/50" />
                <span className="text-gray-300">Fly</span>
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
                const isRobot = x === robotPos.x && y === robotPos.y;
                const isPath = level.path.some((p) => p.x === x && p.y === y);
                const isStart = x === level.robotStart.x && y === level.robotStart.y;

                return (
                  <div
                    key={idx}
                    className={`rounded-xl flex items-center justify-center relative ${
                      isObstacle
                        ? 'bg-slate-800/80 border-2 border-stone-600/60'
                        : isGoal
                          ? 'bg-amber-500/20 border-2 border-amber-400/55'
                          : isStart && !isRobot
                            ? 'bg-cyan-500/20 border-2 border-cyan-400/45'
                            : isPath
                              ? 'bg-indigo-600/25 border-2 border-indigo-400/45'
                              : 'bg-violet-950/40 border border-violet-800/30'
                    }`}
                    style={{ width: cellSize, height: cellSize }}
                  >
                    {isPath && !isGoal && !isRobot && !isStart && (
                      <span className="text-[8px] opacity-50">🌿</span>
                    )}
                    {isGoal && !isRobot && (
                      <motion.span
                        className="text-lg"
                        animate={{ scale: [1, 1.12, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        🪰
                      </motion.span>
                    )}
                    {isObstacle && <span className="text-lg">🪨</span>}
                    {isRobot && (
                      <motion.div
                        className="text-xl drop-shadow-md"
                        animate={{ rotate: getRotation(robotDir) }}
                        transition={{ duration: 0.25 }}
                      >
                        🐸
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Script */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-4 w-full lg:w-64 border border-indigo-500/20"
          >
            <h3 className="text-white font-semibold mb-3 text-center">📜 Main script</h3>
            <div className="min-h-[150px] max-h-[250px] overflow-y-auto mb-3">
              {commands.length === 0 ? (
                <div className="text-gray-500 text-center py-8 text-xs">
                  Tap a saved kernel to call it here — hops stay inside kernels.
                </div>
              ) : (
                <div className="space-y-1">
                  {commands.map((cmd, index) => {
                    const func =
                      cmd.type === 'function'
                        ? allFunctions.find((f) => f.id === cmd.functionId)
                        : null;
                    const commandMeta =
                      cmd.type === 'command' && cmd.command
                        ? commandIcons[cmd.command]
                        : null;
                    return (
                      <motion.div
                        key={cmd.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                          executingIndex === index
                            ? 'ring-2 ring-indigo-400 bg-indigo-500/15'
                            : 'bg-white/5'
                        }`}
                        style={{
                          borderLeft: `3px solid ${
                            func?.color || commandMeta?.color || '#f87171'
                          }`,
                        }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        {func ? (
                          <>
                            <span>{func.emoji}</span>
                            <span className="text-white text-xs flex-1">{func.name}</span>
                          </>
                        ) : commandMeta ? (
                          <>
                            <span>{commandMeta.icon}</span>
                            <span className="text-white text-xs flex-1">{commandMeta.label}</span>
                          </>
                        ) : (
                          <span className="text-red-300 text-xs flex-1">Missing</span>
                        )}
                        {!isRunning && (
                          <button
                            onClick={() => removeCommand(cmd.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            ×
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <motion.button
                onClick={executeCommands}
                disabled={commands.length === 0 || isRunning || isComplete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm"
              >
                ▶️ Run
              </motion.button>
              <motion.button
                onClick={clearCommands}
                disabled={isRunning}
                className="px-3 py-2 rounded-xl text-white bg-red-600/50 text-sm"
              >
                🗑️
              </motion.button>
              <motion.button
                onClick={resetLevel}
                disabled={isRunning}
                className="px-3 py-2 rounded-xl text-white bg-blue-600/50 text-sm"
              >
                🔄
              </motion.button>
            </div>
          </motion.div>
        </div>

        <motion.div className="text-center mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!showHint ? (
            <button
              onClick={() => setShowHint(true)}
              className="text-gray-400 hover:text-indigo-300 transition-colors text-sm"
            >
              Need a hint?
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block glass px-4 py-2 rounded-xl border border-indigo-500/25 max-w-lg"
            >
              <span className="text-indigo-200 text-sm">💡 {level.hint}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Function editor — with nesting */}
        <AnimatePresence>
          {showFunctionEditor && editingFunction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass rounded-2xl p-6 max-w-md w-full border border-indigo-500/30"
              >
                <h3 className="text-xl font-bold text-white mb-1 text-center">Create kernel</h3>
                <p className="text-violet-300 text-xs text-center mb-4">
                  Add hops here. Nest other kernels inside. Then call this from main.
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-3xl">{editingFunction.emoji}</span>
                  <input
                    type="text"
                    value={editingFunction.name}
                    onChange={(e) =>
                      setEditingFunction({ ...editingFunction, name: e.target.value })
                    }
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    maxLength={20}
                  />
                </div>

                <p className="text-gray-400 text-xs mb-2">
                  Steps ({getSteps(editingFunction).length}/{level.maxFunctionCommands}):
                </p>

                <div className="flex gap-2 mb-3 justify-center flex-wrap">
                  {(['forward', 'left', 'right'] as BaseCommand[]).map((cmd) => (
                    <motion.button
                      key={cmd}
                      onClick={() => addCommand(cmd)}
                      disabled={getSteps(editingFunction).length >= level.maxFunctionCommands}
                      className="px-3 py-2 rounded-lg text-white text-sm disabled:opacity-50"
                      style={{
                        backgroundColor: `${commandIcons[cmd].color}30`,
                        border: `2px solid ${commandIcons[cmd].color}`,
                      }}
                    >
                      {commandIcons[cmd].icon}
                    </motion.button>
                  ))}
                </div>

                {allowNesting && nestableFuncs.length > 0 && (
                  <div className="mb-3">
                    <p className="text-indigo-300 text-[10px] uppercase tracking-wide mb-1.5 text-center">
                      Nest a function
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {nestableFuncs.map((func) => (
                        <button
                          key={func.id}
                          type="button"
                          onClick={() => addFunctionCall(func.id)}
                          disabled={
                            getSteps(editingFunction).length >= level.maxFunctionCommands
                          }
                          className="px-2 py-1 rounded-lg text-xs text-white disabled:opacity-40"
                          style={{
                            backgroundColor: `${func.color}30`,
                            border: `1px solid ${func.color}`,
                          }}
                        >
                          {func.emoji} {func.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="min-h-[80px] bg-white/5 rounded-lg p-3 mb-4">
                  {getSteps(editingFunction).length === 0 ? (
                    <p className="text-gray-500 text-center text-xs">
                      Add hops or nest other kernels
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {getSteps(editingFunction).map((step, index) => {
                        if (step.type === 'command' && step.command) {
                          const meta = commandIcons[step.command];
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg"
                              style={{
                                backgroundColor: `${meta.color}30`,
                                border: `1px solid ${meta.color}`,
                              }}
                            >
                              <span>{meta.icon}</span>
                              <span className="text-white text-xs">{meta.label}</span>
                              <button
                                onClick={() => removeFromFunction(index)}
                                className="text-red-400 text-sm ml-1"
                              >
                                ×
                              </button>
                            </div>
                          );
                        }
                        const nested = allFunctions.find((f) => f.id === step.functionId);
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg"
                            style={{
                              backgroundColor: `${nested?.color || '#888'}30`,
                              border: `1px solid ${nested?.color || '#888'}`,
                            }}
                          >
                            <span>{nested?.emoji || '?'}</span>
                            <span className="text-white text-xs">{nested?.name || 'fn'}</span>
                            <button
                              onClick={() => removeFromFunction(index)}
                              className="text-red-400 text-sm ml-1"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditingFunction(null);
                      setShowFunctionEditor(false);
                    }}
                    className="flex-1 py-2 rounded-xl text-gray-300 bg-white/10 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveFunction}
                    disabled={getSteps(editingFunction).length === 0}
                    className="flex-1 py-2 rounded-xl text-white bg-indigo-600 disabled:opacity-50 text-sm"
                  >
                    Save kernel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLevelPicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowLevelPicker(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                className="glass rounded-2xl p-5 sm:p-6 max-w-md w-full border border-indigo-500/30 max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {!levelPickerUnlocked ? (
                  <>
                    <h2 className="text-lg font-bold text-white mb-1">Level select</h2>
                    <p className="text-gray-400 text-sm mb-4">Enter passcode to jump to any level.</p>
                    <form onSubmit={submitPasscode} className="space-y-3">
                      <input
                        type="password"
                        inputMode="numeric"
                        value={passcodeInput}
                        onChange={(e) => {
                          setPasscodeInput(e.target.value);
                          setPasscodeError('');
                        }}
                        placeholder="Passcode"
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/15 text-white text-center text-lg tracking-widest placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50"
                      />
                      {passcodeError && (
                        <p className="text-red-400 text-sm text-center">{passcodeError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowLevelPicker(false)}
                          className="flex-1 py-3 rounded-xl bg-white/10 text-gray-300 text-sm min-h-[44px]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 rounded-xl font-semibold text-white text-sm min-h-[44px] bg-indigo-600 hover:bg-indigo-500"
                        >
                          Unlock
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-white">Pick a level</h2>
                      <button
                        type="button"
                        onClick={() => setShowLevelPicker(false)}
                        className="text-gray-500 hover:text-white text-sm px-2 py-1"
                      >
                        Close
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {levels.map((lv, i) => (
                        <button
                          key={lv.id}
                          type="button"
                          onClick={() => jumpToLevel(i)}
                          className={`px-2 py-3 rounded-xl text-left transition-colors min-h-[64px] ${
                            i === currentLevelIndex
                              ? 'bg-indigo-500/25 border-2 border-indigo-400/50'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-indigo-300 text-xs font-bold">L{lv.id}</div>
                          <div className="text-white text-xs font-semibold line-clamp-2">{lv.name}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hitObstacle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 glass px-6 py-3 rounded-xl border border-red-500/50 z-40"
            >
              <p className="text-red-400 font-semibold text-sm">
                Splash! Hit a rock or the edge — debug your nesting.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {pathIncomplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 glass px-6 py-3 rounded-xl border border-amber-500/50 z-40 max-w-sm text-center"
            >
              <p className="text-amber-300 font-semibold text-sm">
                Visit every lily pad before the fly!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {nestRequiredFail && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 glass px-6 py-3 rounded-xl border border-fuchsia-500/50 z-40 max-w-sm text-center"
            >
              <p className="text-fuchsia-200 font-semibold text-sm">
                Main must be function calls only — and nest at least one kernel inside another.
              </p>
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
                className="glass rounded-3xl p-8 max-w-md text-center border border-indigo-500/30"
              >
                <div className="text-5xl mb-4">🐸</div>
                <h2 className="text-2xl font-bold text-white mb-2">Kernel compiled!</h2>
                <p className="text-gray-300 mb-4 text-sm">
                  Solved with {commands.length} main-script blocks via nested functions.
                </p>
                <div className="text-3xl font-bold text-amber-300 mb-6">
                  +{Math.max(25, 60 - commands.length * 5)}
                </div>
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
