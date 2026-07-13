'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';
import { buildFrogHopQuest2Levels, type FrogHopQuest2Level } from '@/lib/frogHopQuest2Levels';

type Command = 'forward' | 'left' | 'right' | 'forward2';
type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

type Level = FrogHopQuest2Level;

type FnId = 'fn-a' | 'fn-b';

type ProgramBlock =
  | { id: string; kind: 'cmd'; command: Command }
  | { id: string; kind: 'call'; fnId: FnId };

const MAX_FN_COMMANDS = 8;

const FN_META: Record<FnId, { label: string; emoji: string; color: string }> = {
  'fn-a': { label: 'Routine A', emoji: '🪷', color: '#34d399' },
  'fn-b': { label: 'Routine B', emoji: '🍃', color: '#2dd4bf' },
};

const levels: Level[] = buildFrogHopQuest2Levels();

function expandProgram(
  blocks: ProgramBlock[],
  fnA: Command[] | null,
  fnB: Command[] | null,
): { programIndex: number; command: Command }[] {
  const out: { programIndex: number; command: Command }[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]!;
    if (b.kind === 'cmd') {
      out.push({ programIndex: i, command: b.command });
    } else {
      const body = b.fnId === 'fn-a' ? fnA : fnB;
      if (body?.length) {
        for (const c of body) out.push({ programIndex: i, command: c });
      }
    }
  }
  return out;
}

const commandIcons: Record<Command, { icon: string; label: string; color: string }> = {
  forward: { icon: '🐸', label: 'Hop forward', color: '#34d399' },
  forward2: { icon: '🐸⏫', label: 'Double hop', color: '#2dd4bf' },
  left: { icon: '↩️', label: 'Turn left', color: '#f59e0b' },
  right: { icon: '↪️', label: 'Turn right', color: '#10b981' },
};

function cellSizeForGrid(n: number): number {
  if (n <= 7) return 44;
  if (n <= 9) return 38;
  if (n <= 11) return 34;
  if (n <= 13) return 30;
  if (n <= 14) return 28;
  return 26;
}

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

export default function FrogHopQuest2Page() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();
  const cmdIdRef = useRef(0);

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [program, setProgram] = useState<ProgramBlock[]>([]);
  /** Optional saved hop sequences — not required to play */
  const [fnA, setFnA] = useState<Command[] | null>(null);
  const [fnB, setFnB] = useState<Command[] | null>(null);
  const [editingSlot, setEditingSlot] = useState<0 | 1 | null>(null);
  const [fnDraft, setFnDraft] = useState<Command[]>([]);
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
  const availableCommands: Command[] = ['forward', 'forward2', 'left', 'right'];

  const resetLevel = useCallback(() => {
    if (level) {
      setFrogPos(level.frogStart);
      setFrogDir(level.frogDirection);
      setProgram([]);
      setEditingSlot(null);
      setFnDraft([]);
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

  const addMove = (command: Command) => {
    if (isRunning) return;
    if (editingSlot !== null) {
      setFnDraft((d) => (d.length >= MAX_FN_COMMANDS ? d : [...d, command]));
      return;
    }
    if (program.length >= level.maxCommands) return;
    cmdIdRef.current += 1;
    setProgram((prev) => [...prev, { id: `c-${cmdIdRef.current}`, kind: 'cmd', command }]);
  };

  const addFunctionCall = (fnId: FnId) => {
    if (isRunning || editingSlot !== null || program.length >= level.maxCommands) return;
    cmdIdRef.current += 1;
    setProgram((prev) => [...prev, { id: `c-${cmdIdRef.current}`, kind: 'call', fnId }]);
  };

  const openFnEditor = (slot: 0 | 1) => {
    if (isRunning) return;
    setEditingSlot(slot);
    setFnDraft(slot === 0 ? [...(fnA ?? [])] : [...(fnB ?? [])]);
  };

  const saveFnEditor = () => {
    if (editingSlot === 0) setFnA(fnDraft.length ? [...fnDraft] : null);
    else if (editingSlot === 1) setFnB(fnDraft.length ? [...fnDraft] : null);
    setEditingSlot(null);
    setFnDraft([]);
  };

  const cancelFnEditor = () => {
    setEditingSlot(null);
    setFnDraft([]);
  };

  const clearSavedFn = (slot: 0 | 1) => {
    if (isRunning) return;
    if (slot === 0) setFnA(null);
    else setFnB(null);
  };

  const removeProgramBlock = (id: string) => {
    if (!isRunning) {
      setProgram((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const removeDraftCommand = (index: number) => {
    setFnDraft((d) => d.filter((_, i) => i !== index));
  };

  const clearProgram = () => {
    if (!isRunning) {
      setProgram([]);
    }
  };

  const executeCommands = async () => {
    if (program.length === 0 || isRunning) return;
    const expanded = expandProgram(program, fnA, fnB);
    if (expanded.length === 0) return;

    setIsRunning(true);
    setHitObstacle(false);
    let pos = { ...level.frogStart };
    let dir = level.frogDirection;

    const winAndStop = () => {
      setIsComplete(true);
      setShowConfetti(true);
      const levelScore = Math.max(10, 30 - (program.length - 3) * 3);
      setScore((prev) => prev + levelScore);
      addStars(2);
      recordAnswer(true);
      incrementGamesPlayed();
      setTimeout(() => setShowConfetti(false), 3000);
      setExecutingIndex(-1);
      setIsRunning(false);
    };

    type StepResult = 'win' | 'ok' | 'crash';
    const runOneCommand = async (cmd: Command): Promise<StepResult> => {
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
            return 'crash';
          }

          if (level.obstacles.some((o) => o.x === newPos.x && o.y === newPos.y)) {
            setHitObstacle(true);
            setIsRunning(false);
            setExecutingIndex(-1);
            return 'crash';
          }

          pos = newPos;
          setFrogPos({ ...pos });

          if (pos.x === level.goal.x && pos.y === level.goal.y) {
            return 'win';
          }

          if (step < steps - 1) {
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        }
      }
      return pos.x === level.goal.x && pos.y === level.goal.y ? 'win' : 'ok';
    };

    for (let e = 0; e < expanded.length; e++) {
      const { programIndex, command: cmd } = expanded[e]!;
      setExecutingIndex(programIndex);

      await new Promise((resolve) => setTimeout(resolve, 400));

      const step = await runOneCommand(cmd);
      if (step === 'win') {
        winAndStop();
        return;
      }
      if (step === 'crash') return;
    }

    setExecutingIndex(-1);
    setIsRunning(false);

    if (pos.x !== level.goal.x || pos.y !== level.goal.y) {
      recordAnswer(false);
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex((prev) => prev + 1);
    } else {
      router.push('/games/programming');
    }
  };

  if (!level) return null;

  const cellSize = cellSizeForGrid(level.gridSize);

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-4 md:p-6 relative overflow-hidden bg-gradient-to-b from-emerald-950/90 via-cyan-950/45 to-slate-950">
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
              <div className="text-lg font-bold text-white">
                {currentLevelIndex + 1}/{levels.length}
              </div>
            </div>
            <div className="glass px-3 py-1.5 rounded-xl text-center hidden sm:block">
              <div className="text-xs text-gray-400">Fewest hops</div>
              <div className="text-lg font-bold text-teal-300">{level.optimalHops}</div>
            </div>
            <div className="glass px-3 py-1.5 rounded-xl text-center">
              <div className="text-xs text-gray-400">Score</div>
              <div className="text-lg font-bold text-yellow-400">⭐ {score}</div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-[min(100vw-1rem,1180px)] mx-auto relative z-10">
        <motion.div className="text-center mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-teal-400/90 text-xs font-semibold tracking-wide uppercase mb-1">Frog Hop Quest 2</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">🐸 {level.name}</h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Huge maze — several corridors reach the lily, but <span className="text-teal-300">only one uses the fewest single hops</span>.
            Double hops count as two hops. Optional: save a repeating pattern as 🪷 A / 🍃 B and drop it in your program as a single block.
          </p>
          <p className="text-gray-500 text-xs mt-1 sm:hidden">Fewest hops: {level.optimalHops}</p>
        </motion.div>

        <div className="flex flex-col xl:flex-row gap-4 items-start justify-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-4 w-full xl:w-auto"
          >
            <h3 className="text-white font-semibold mb-3 text-center">
              📦 {editingSlot !== null ? `Routine ${editingSlot === 0 ? 'A' : 'B'} (draft)` : 'Command Blocks'}
            </h3>
            <div className="flex xl:flex-col gap-2 flex-wrap justify-center">
              {availableCommands.map((cmd) => (
                <motion.button
                  key={cmd}
                  onClick={() => addMove(cmd)}
                  disabled={
                    isRunning ||
                    (editingSlot === null && program.length >= level.maxCommands) ||
                    (editingSlot !== null && fnDraft.length >= MAX_FN_COMMANDS)
                  }
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
            {editingSlot !== null ? (
              <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                <p className="text-gray-500 text-[10px] text-center">
                  Draft {fnDraft.length}/{MAX_FN_COMMANDS} — tap × on a row below to remove
                </p>
                <div className="max-h-[100px] overflow-y-auto space-y-1">
                  {fnDraft.map((c, i) => (
                    <div
                      key={`${i}-${c}`}
                      className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-white/5 text-xs text-white"
                    >
                      <span>
                        {commandIcons[c].icon} {commandIcons[c].label}
                      </span>
                      <button type="button" onClick={() => removeDraftCommand(i)} className="text-red-400">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  <button
                    type="button"
                    onClick={saveFnEditor}
                    className="px-3 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold"
                  >
                    Save routine
                  </button>
                  <button
                    type="button"
                    onClick={cancelFnEditor}
                    className="px-3 py-2 rounded-lg bg-white/10 text-gray-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="text-cyan-400/90 text-[10px] font-semibold text-center mb-2 uppercase tracking-wide">
                    Optional lily routines
                  </p>
                  <p className="text-gray-500 text-[10px] text-center mb-2 px-1">
                    Save hops once, then add one “call” block to your program. Skip this if you prefer plain blocks.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => openFnEditor(0)}
                      disabled={isRunning}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium text-white bg-white/10 border border-emerald-500/40 disabled:opacity-50"
                    >
                      Edit 🪷 A
                    </button>
                    <button
                      type="button"
                      onClick={() => openFnEditor(1)}
                      disabled={isRunning}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium text-white bg-white/10 border border-teal-500/40 disabled:opacity-50"
                    >
                      Edit 🍃 B
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    <button
                      type="button"
                      onClick={() => clearSavedFn(0)}
                      disabled={isRunning || !fnA?.length}
                      className="text-[10px] text-gray-500 hover:text-gray-300 disabled:opacity-30"
                    >
                      Clear A
                    </button>
                    <button
                      type="button"
                      onClick={() => clearSavedFn(1)}
                      disabled={isRunning || !fnB?.length}
                      className="text-[10px] text-gray-500 hover:text-gray-300 disabled:opacity-30"
                    >
                      Clear B
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-gray-400 text-[10px] text-center">Insert call (counts as 1 program block)</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(['fn-a', 'fn-b'] as const).map((fid) => (
                      <motion.button
                        key={fid}
                        type="button"
                        onClick={() => addFunctionCall(fid)}
                        disabled={
                          isRunning || program.length >= level.maxCommands || !(fid === 'fn-a' ? fnA?.length : fnB?.length)
                        }
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed border-2"
                        style={{
                          backgroundColor: `${FN_META[fid].color}18`,
                          borderColor: FN_META[fid].color,
                        }}
                      >
                        {FN_META[fid].emoji} Call {fid === 'fn-a' ? 'A' : 'B'}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <p className="text-gray-400 text-xs mt-3 text-center">
              {editingSlot === null ? `${program.length}/${level.maxCommands} program blocks` : '—'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-4 w-full max-w-full"
          >
            <div className="flex justify-center gap-3 sm:gap-4 mb-3 flex-wrap text-[10px] sm:text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-emerald-950/40 border border-teal-500/20" />
                <span className="text-gray-300">Open water</span>
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
            <div className="w-full overflow-x-auto pb-2 flex justify-center">
              <div
                className="grid gap-1 mx-auto shrink-0"
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
                  const isStart = x === level.frogStart.x && y === level.frogStart.y;

                  return (
                    <motion.div
                      key={idx}
                      className={`rounded-md sm:rounded-lg flex items-center justify-center relative ${
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
                      transition={{ delay: idx * 0.002 }}
                    >
                      {isPath && !isGoal && !isFrog && !isStart && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400/45" />
                        </div>
                      )}
                      {isGoal && (
                        <motion.span
                          className={`text-lg sm:text-xl md:text-2xl ${isFrog ? 'opacity-35' : ''}`}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          🪷
                        </motion.span>
                      )}
                      {isObstacle && (
                        <span className="text-base sm:text-lg" title="Rock">
                          🪨
                        </span>
                      )}
                      {isFrog && (
                        <motion.div
                          className="text-xl sm:text-2xl md:text-3xl drop-shadow-md z-[1]"
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
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-4 w-full xl:w-64"
          >
            <h3 className="text-white font-semibold mb-3 text-center">📝 Your Program</h3>

            <div className="min-h-[180px] max-h-[280px] overflow-y-auto mb-3">
              {program.length === 0 ? (
                <div className="text-gray-500 text-center py-8 text-sm">
                  Plan the shortest hop route — wrong tunnels still reach the lily but waste moves.
                </div>
              ) : (
                <Reorder.Group axis="y" values={program} onReorder={setProgram} className="space-y-2">
                  {program.map((block, index) => {
                    const borderColor =
                      block.kind === 'cmd' ? commandIcons[block.command].color : FN_META[block.fnId].color;
                    const active = executingIndex === index;
                    return (
                      <Reorder.Item
                        key={block.id}
                        value={block}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-grab active:cursor-grabbing transition-all ${
                          active ? 'ring-2 ring-yellow-400 bg-yellow-500/20' : 'bg-white/5'
                        }`}
                        style={{ borderLeft: `4px solid ${borderColor}` }}
                        whileDrag={{ scale: 1.05, zIndex: 50 }}
                      >
                        <span className="text-gray-400 text-xs w-4">{index + 1}.</span>
                        {block.kind === 'cmd' ? (
                          <>
                            <span className="text-lg">{commandIcons[block.command].icon}</span>
                            <span className="text-white text-xs flex-1">{commandIcons[block.command].label}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-lg">{FN_META[block.fnId].emoji}</span>
                            <span className="text-white text-xs flex-1">
                              Call {block.fnId === 'fn-a' ? 'A' : 'B'} (
                              {(block.fnId === 'fn-a' ? fnA : fnB)?.length ?? 0} hops inside)
                            </span>
                          </>
                        )}
                        {!isRunning && (
                          <button
                            type="button"
                            onClick={() => removeProgramBlock(block.id)}
                            className="text-red-400 hover:text-red-300 text-lg"
                          >
                            ×
                          </button>
                        )}
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              )}
            </div>

            <div className="flex gap-2">
              <motion.button
                onClick={executeCommands}
                disabled={program.length === 0 || isRunning || isComplete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                ▶️ Run
              </motion.button>
              <motion.button
                onClick={clearProgram}
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

        <motion.div
          className="text-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {!showHint ? (
            <button
              onClick={() => setShowHint(true)}
              className="text-gray-400 hover:text-yellow-400 transition-colors text-sm"
            >
              💡 Need a hint?
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block glass px-4 py-2 rounded-xl max-w-lg mx-auto"
            >
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
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Level Complete!</h2>
                <p className="text-gray-300 mb-2 text-sm">Used {program.length} program blocks (each call = 1 block)</p>
                <p className="text-teal-300/90 text-xs mb-4">
                  Shortest possible hops (for this pond): {level.optimalHops}
                </p>
                <div className="text-3xl font-bold text-yellow-400 mb-6">
                  ⭐ +{Math.max(10, 30 - (program.length - 3) * 3)}
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
