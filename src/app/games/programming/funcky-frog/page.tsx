'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

/* ─── types ─── */

type Direction = 'up' | 'down' | 'left' | 'right';
type BaseCommand = 'moveForward' | 'turnLeft' | 'turnRight';

interface Position { x: number; y: number }

interface UserFunction { name: string; body: BaseCommand[] }

interface ProgramStep { id: string; type: 'base' | 'call'; value: string }

interface Level {
  id: number;
  title: string;
  description: string;
  grid: number[][];
  start: Position;
  startDir: Direction;
  goal: Position;
  maxMainCommands: number;
  availableCommands: BaseCommand[];
  functionsUnlocked: boolean;
  maxFunctions: number;
  hint: string;
  parCommands: number;
}

/* ─── constants ─── */

const DIR_DELTA: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const TURN_L: Record<Direction, Direction> = { up: 'left', left: 'down', down: 'right', right: 'up' };
const TURN_R: Record<Direction, Direction> = { up: 'right', right: 'down', down: 'left', left: 'up' };
const DIR_DEG: Record<Direction, number> = { up: 0, right: 90, down: 180, left: 270 };
const DIR_ARROW: Record<Direction, string> = { up: '▲', right: '▶', down: '▼', left: '◀' };

const CMD_META: Record<BaseCommand, { label: string; icon: string; color: string }> = {
  moveForward: { label: 'moveForward()', icon: '⬆️', color: '#10b981' },
  turnLeft:    { label: 'turnLeft()',    icon: '↩️', color: '#f59e0b' },
  turnRight:   { label: 'turnRight()',   icon: '↪️', color: '#eab308' },
};

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
let _id = 0;
const uid = () => `s${++_id}-${Date.now()}`;

/* ─── levels ─── */

const levels: Level[] = [
  {
    id: 1,
    title: 'First Hop',
    description: 'Use moveForward() to reach the fly!',
    grid: [
      [0,0,0,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
    ],
    start: { x: 2, y: 4 }, startDir: 'up', goal: { x: 2, y: 1 },
    maxMainCommands: 5, availableCommands: ['moveForward'],
    functionsUnlocked: false, maxFunctions: 0,
    hint: 'The fly is 3 hops straight ahead — moveForward() three times!',
    parCommands: 3,
  },
  {
    id: 2,
    title: 'Corner Hop',
    description: 'The path turns! Use turnRight() to change direction.',
    grid: [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,1,1,1,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
    ],
    start: { x: 1, y: 4 }, startDir: 'up', goal: { x: 3, y: 2 },
    maxMainCommands: 7, availableCommands: ['moveForward', 'turnRight'],
    functionsUnlocked: false, maxFunctions: 0,
    hint: 'Forward twice, turnRight, then forward twice more.',
    parCommands: 5,
  },
  {
    id: 3,
    title: 'L-Pond',
    description: 'This time the path goes left — use turnLeft()!',
    grid: [
      [0,0,0,0,0],
      [0,1,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
    ],
    start: { x: 2, y: 4 }, startDir: 'up', goal: { x: 1, y: 1 },
    maxMainCommands: 7, availableCommands: ['moveForward', 'turnLeft'],
    functionsUnlocked: false, maxFunctions: 0,
    hint: 'Forward three times, turnLeft, forward once.',
    parCommands: 5,
  },
  {
    id: 4,
    title: 'Winding Stream',
    description: 'Navigate the S-shaped stream using all three commands.',
    grid: [
      [0,0,0,0,0,0],
      [0,1,0,0,0,0],
      [0,1,1,1,0,0],
      [0,0,0,1,0,0],
      [0,1,1,1,0,0],
      [0,1,0,0,0,0],
      [0,1,0,0,0,0],
    ],
    start: { x: 1, y: 6 }, startDir: 'up', goal: { x: 1, y: 1 },
    maxMainCommands: 16, availableCommands: ['moveForward', 'turnLeft', 'turnRight'],
    functionsUnlocked: false, maxFunctions: 0,
    hint: 'Follow the S-curve — forward, turn, forward… 13 commands total.',
    parCommands: 13,
  },
  {
    id: 5,
    title: 'Function Power!',
    description: '🎉 Functions unlocked! Group repeating commands into a function.',
    grid: [
      [0,0,0,0,0,0],
      [0,0,0,0,1,0],
      [0,0,0,1,1,0],
      [0,0,1,1,0,0],
      [0,1,1,0,0,0],
      [0,1,0,0,0,0],
    ],
    start: { x: 1, y: 5 }, startDir: 'up', goal: { x: 4, y: 1 },
    maxMainCommands: 5, availableCommands: ['moveForward', 'turnLeft', 'turnRight'],
    functionsUnlocked: true, maxFunctions: 1,
    hint: 'The staircase repeats: moveForward, turnRight, moveForward, turnLeft. Make that a function, then call it 4 times!',
    parCommands: 4,
  },
  {
    id: 6,
    title: 'Left Staircase',
    description: 'Same trick — but the stairs go left this time!',
    grid: [
      [0,0,0,0,0,0],
      [0,1,0,0,0,0],
      [0,1,1,0,0,0],
      [0,0,1,1,0,0],
      [0,0,0,1,1,0],
      [0,0,0,0,1,0],
    ],
    start: { x: 4, y: 5 }, startDir: 'up', goal: { x: 1, y: 1 },
    maxMainCommands: 5, availableCommands: ['moveForward', 'turnLeft', 'turnRight'],
    functionsUnlocked: true, maxFunctions: 1,
    hint: 'Pattern: moveForward, turnLeft, moveForward, turnRight. Call it 4 times.',
    parCommands: 4,
  },
  {
    id: 7,
    title: 'Diamond Path',
    description: 'Stairs go right then left — you need TWO functions!',
    grid: [
      [0,0,0,0,0,0],
      [0,0,1,1,0,0],
      [0,1,1,0,0,0],
      [0,1,0,0,0,0],
      [0,1,1,0,0,0],
      [0,0,1,1,0,0],
      [0,0,0,1,1,0],
      [0,0,0,0,1,0],
    ],
    start: { x: 4, y: 7 }, startDir: 'up', goal: { x: 3, y: 1 },
    maxMainCommands: 7, availableCommands: ['moveForward', 'turnLeft', 'turnRight'],
    functionsUnlocked: true, maxFunctions: 2,
    hint: 'Bottom half: stepLeft (fwd, turnLeft, fwd, turnRight). Top half: stepRight (fwd, turnRight, fwd, turnLeft). A moveForward bridges them at the pivot.',
    parCommands: 6,
  },
  {
    id: 8,
    title: 'FUNCky Finale',
    description: 'The ultimate frog maze — plan your functions wisely!',
    grid: [
      [0,0,0,0,0,0,0],
      [0,0,0,1,0,0,0],
      [0,0,1,1,0,0,0],
      [0,1,1,0,0,0,0],
      [0,1,0,0,0,0,0],
      [0,1,1,0,0,0,0],
      [0,0,1,1,0,0,0],
      [0,0,0,1,1,0,0],
      [0,0,0,0,1,0,0],
    ],
    start: { x: 4, y: 8 }, startDir: 'up', goal: { x: 3, y: 1 },
    maxMainCommands: 8, availableCommands: ['moveForward', 'turnLeft', 'turnRight'],
    functionsUnlocked: true, maxFunctions: 2,
    hint: 'Bottom: 3× stepLeft (fwd, turnLeft, fwd, turnRight). Pivot fwd. Top: 2× stepRight (fwd, turnRight, fwd, turnLeft). Final fwd to goal.',
    parCommands: 7,
  },
];

/* ─── component ─── */

export default function FunckyFrogPage() {
  const router = useRouter();
  const { addStars, recordAnswer, incrementGamesPlayed } = useGameStore();

  const [levelIdx, setLevelIdx] = useState(0);
  const [frogPos, setFrogPos] = useState<Position>(levels[0].start);
  const [frogDir, setFrogDir] = useState<Direction>(levels[0].startDir);

  const [program, setProgram] = useState<ProgramStep[]>([]);
  const [savedFuncs, setSavedFuncs] = useState<UserFunction[]>([]);

  const [editingFunc, setEditingFunc] = useState(false);
  const [funcName, setFuncName] = useState('');
  const [funcBody, setFuncBody] = useState<BaseCommand[]>([]);

  const [isRunning, setIsRunning] = useState(false);
  const [execMain, setExecMain] = useState(-1);
  const [execSub, setExecSub] = useState(-1);

  const [outcome, setOutcome] = useState<'none' | 'win' | 'wall' | 'lost'>('none');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const level = levels[levelIdx];
  const rows = level.grid.length;
  const cols = level.grid[0].length;
  const cellPx = Math.min(52, Math.floor(340 / Math.max(rows, cols)));

  /* ── level management ── */

  const resetFrog = useCallback(() => {
    setFrogPos(level.start);
    setFrogDir(level.startDir);
    setOutcome('none');
    setExecMain(-1);
    setExecSub(-1);
    setShowHint(false);
  }, [level]);

  const goNextLevel = useCallback(() => {
    if (levelIdx >= levels.length - 1) { router.push('/games/programming'); return; }
    const next = levels[levelIdx + 1];
    setLevelIdx(levelIdx + 1);
    setFrogPos(next.start);
    setFrogDir(next.startDir);
    setProgram([]);
    if (!next.functionsUnlocked) setSavedFuncs([]);
    setEditingFunc(false);
    setFuncName('');
    setFuncBody([]);
    setOutcome('none');
    setShowHint(false);
  }, [levelIdx, router]);

  /* ── program management ── */

  const addStep = useCallback((type: 'base' | 'call', value: string) => {
    if (isRunning || program.length >= level.maxMainCommands) return;
    setProgram(p => [...p, { id: uid(), type, value }]);
  }, [isRunning, program.length, level.maxMainCommands]);

  const removeStep = useCallback((id: string) => {
    if (isRunning) return;
    setProgram(p => p.filter(s => s.id !== id));
  }, [isRunning]);

  const clearProgram = useCallback(() => { if (!isRunning) setProgram([]); }, [isRunning]);

  /* ── function management ── */

  const startNewFunc = useCallback(() => {
    if (savedFuncs.length >= level.maxFunctions) return;
    setEditingFunc(true);
    setFuncName('');
    setFuncBody([]);
  }, [savedFuncs.length, level.maxFunctions]);

  const saveFunc = useCallback(() => {
    const n = funcName.trim();
    if (!n || funcBody.length === 0 || savedFuncs.some(f => f.name === n)) return;
    setSavedFuncs(prev => [...prev, { name: n, body: [...funcBody] }]);
    setEditingFunc(false);
    setFuncName('');
    setFuncBody([]);
  }, [funcName, funcBody, savedFuncs]);

  const deleteFunc = useCallback((name: string) => {
    if (isRunning) return;
    setSavedFuncs(prev => prev.filter(f => f.name !== name));
    setProgram(prev => prev.filter(s => !(s.type === 'call' && s.value === name)));
  }, [isRunning]);

  /* ── execution ── */

  const runProgram = useCallback(async () => {
    if (program.length === 0 || isRunning) return;

    setIsRunning(true);
    setOutcome('none');

    let pos = { ...level.start };
    let dir: Direction = level.startDir;
    setFrogPos(pos);
    setFrogDir(dir);
    await sleep(250);

    const expanded: { mi: number; si: number; cmd: BaseCommand }[] = [];
    for (let i = 0; i < program.length; i++) {
      const step = program[i];
      if (step.type === 'base') {
        expanded.push({ mi: i, si: -1, cmd: step.value as BaseCommand });
      } else {
        const fn = savedFuncs.find(f => f.name === step.value);
        if (fn) fn.body.forEach((c, j) => expanded.push({ mi: i, si: j, cmd: c }));
      }
    }

    let won = false;
    let wall = false;

    for (const { mi, si, cmd } of expanded) {
      if (won || wall) break;
      setExecMain(mi);
      setExecSub(si);

      if (cmd === 'moveForward') {
        const d = DIR_DELTA[dir];
        const nx = pos.x + d.x;
        const ny = pos.y + d.y;
        if (ny < 0 || ny >= rows || nx < 0 || nx >= cols || level.grid[ny][nx] === 0) {
          wall = true;
          setOutcome('wall');
        } else {
          pos = { x: nx, y: ny };
          setFrogPos({ ...pos });
          if (pos.x === level.goal.x && pos.y === level.goal.y) {
            won = true;
            setOutcome('win');
          }
        }
      } else if (cmd === 'turnLeft') {
        dir = TURN_L[dir];
        setFrogDir(dir);
      } else {
        dir = TURN_R[dir];
        setFrogDir(dir);
      }

      await sleep(380);
    }

    if (won) {
      const stars = program.length <= level.parCommands ? 3 : program.length <= level.parCommands + 2 ? 2 : 1;
      addStars(stars);
      recordAnswer(true);
      incrementGamesPlayed();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } else if (!wall) {
      setOutcome('lost');
    }

    setExecMain(-1);
    setExecSub(-1);
    setIsRunning(false);
  }, [program, savedFuncs, level, isRunning, rows, cols, addStars, recordAnswer, incrementGamesPlayed]);

  const stars = program.length <= level.parCommands ? 3 : program.length <= level.parCommands + 2 ? 2 : 1;

  /* ─── render ─── */

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-4 md:p-6 relative overflow-hidden bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950">
      <Confetti show={showConfetti} />

      {/* header */}
      <header className="max-w-5xl mx-auto mb-3 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <motion.button
            onClick={() => router.push('/games/programming')}
            className="glass px-3 py-2 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px]"
            whileTap={{ scale: 0.97 }}
          >
            ← Code Quest
          </motion.button>
          <div className="flex gap-2 text-sm">
            <div className="glass px-3 py-1.5 rounded-xl">
              <span className="text-gray-400">Level </span>
              <span className="text-white font-bold">{levelIdx + 1}/{levels.length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* title */}
        <motion.div className="text-center mb-3" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl font-bold text-white">🐸 {level.title}</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">{level.description}</p>
        </motion.div>

        {/* main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 items-start">

          {/* ── maze panel ── */}
          <motion.div
            className="glass rounded-2xl p-4 flex flex-col items-center"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          >
            <div className="relative" style={{ width: cols * cellPx, height: rows * cellPx }}>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cellPx}px)` }}>
                {level.grid.flatMap((row, y) =>
                  row.map((cell, x) => {
                    const isGoal = x === level.goal.x && y === level.goal.y;
                    const isStart = x === level.start.x && y === level.start.y;
                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`border flex items-center justify-center ${
                          cell === 0
                            ? 'bg-slate-900/80 border-slate-800/60'
                            : isGoal
                              ? 'bg-amber-900/40 border-amber-600/30'
                              : isStart
                                ? 'bg-emerald-900/30 border-emerald-600/20'
                                : 'bg-emerald-950/50 border-emerald-800/20'
                        }`}
                        style={{ width: cellPx, height: cellPx }}
                      >
                        {isGoal && <span className="text-base sm:text-lg">🪰</span>}
                      </div>
                    );
                  })
                )}
              </div>

              {/* frog */}
              <motion.div
                className="absolute flex flex-col items-center justify-center pointer-events-none"
                style={{ width: cellPx, height: cellPx }}
                animate={{ left: frogPos.x * cellPx, top: frogPos.y * cellPx }}
                transition={{ type: 'spring', stiffness: 280, damping: 24, mass: 0.8 }}
              >
                <span className="text-xl sm:text-2xl leading-none">🐸</span>
                <motion.span
                  className="text-[9px] font-bold leading-none -mt-0.5 text-emerald-400/90"
                  animate={{ rotate: DIR_DEG[frogDir] }}
                  transition={{ duration: 0.15 }}
                >
                  {DIR_ARROW[frogDir]}
                </motion.span>
              </motion.div>
            </div>

            {/* hint toggle */}
            <button onClick={() => setShowHint(h => !h)} className="mt-3 text-[11px] text-gray-500 hover:text-gray-300">
              {showHint ? 'Hide hint' : '💡 Hint'}
            </button>
            <AnimatePresence>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="text-[11px] text-amber-300/80 mt-1 text-center max-w-[300px] leading-relaxed"
                >
                  {level.hint}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── code panel ── */}
          <motion.div
            className="glass rounded-2xl p-4 space-y-4 min-w-0"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          >
            {/* functions section */}
            {level.functionsUnlocked && (
              <section>
                <h3 className="text-xs font-bold text-purple-300 mb-2 flex items-center gap-2">
                  📦 My Functions
                  <span className="text-[10px] text-gray-500 font-normal">({savedFuncs.length}/{level.maxFunctions})</span>
                </h3>

                {savedFuncs.map(fn => (
                  <div key={fn.name} className="mb-2 rounded-lg bg-purple-500/10 border border-purple-500/20 p-2 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">
                        <span className="text-purple-500">function </span>{fn.name}() {'{'}
                      </span>
                      {!isRunning && (
                        <button onClick={() => deleteFunc(fn.name)} className="text-gray-600 hover:text-red-400 text-xs px-1">×</button>
                      )}
                    </div>
                    <div className="pl-4 text-gray-400">
                      {fn.body.map((c, i) => <div key={i}>{c}()</div>)}
                    </div>
                    <span className="text-purple-300">{'}'}</span>
                  </div>
                ))}

                {editingFunc ? (
                  <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-3 space-y-2">
                    <div className="flex items-center gap-1 font-mono text-xs text-purple-300">
                      <span className="text-purple-500">function </span>
                      <input
                        type="text"
                        value={funcName}
                        onChange={e => setFuncName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                        placeholder="myFunc"
                        className="bg-transparent border-b border-purple-500/40 text-purple-200 placeholder-gray-600 focus:outline-none focus:border-purple-400 w-28 px-1"
                        maxLength={16}
                        autoFocus
                      />
                      <span>() {'{'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {level.availableCommands.map(cmd => (
                        <button
                          key={cmd}
                          onClick={() => setFuncBody(b => [...b, cmd])}
                          className="px-2 py-1 rounded text-[11px] font-mono font-semibold active:scale-95"
                          style={{ backgroundColor: `${CMD_META[cmd].color}20`, color: CMD_META[cmd].color, border: `1px solid ${CMD_META[cmd].color}35` }}
                        >
                          {CMD_META[cmd].icon} {cmd}()
                        </button>
                      ))}
                    </div>
                    {funcBody.length > 0 && (
                      <div className="text-xs font-mono text-gray-400 bg-black/20 rounded p-2 space-y-0.5">
                        {funcBody.map((c, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="pl-3">{c}()</span>
                            <button onClick={() => setFuncBody(b => b.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400 px-1">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <span className="text-purple-300 text-xs font-mono">{'}'}</span>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={saveFunc}
                        disabled={!funcName.trim() || funcBody.length === 0 || savedFuncs.some(f => f.name === funcName.trim())}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold disabled:opacity-35"
                      >
                        Save Function
                      </button>
                      <button
                        onClick={() => { setEditingFunc(false); setFuncName(''); setFuncBody([]); }}
                        className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : savedFuncs.length < level.maxFunctions && !isRunning && (
                  <button
                    onClick={startNewFunc}
                    className="w-full py-2 rounded-lg border-2 border-dashed border-purple-500/30 text-purple-400/80 text-xs hover:border-purple-500/50 hover:text-purple-300 transition-colors"
                  >
                    + New Function
                  </button>
                )}
              </section>
            )}

            {/* main program */}
            <section>
              <h3 className="text-xs font-bold text-cyan-300 mb-2 flex items-center gap-2">
                📝 Main Program
                <span className={`text-[10px] font-normal ${program.length >= level.maxMainCommands ? 'text-rose-400' : 'text-gray-500'}`}>
                  ({program.length}/{level.maxMainCommands})
                </span>
              </h3>

              <div className="space-y-1 mb-3 min-h-[36px]">
                {program.length === 0 ? (
                  <p className="text-[11px] text-gray-600 italic">Click commands below to build your program…</p>
                ) : (
                  program.map((step, i) => {
                    const isExec = execMain === i;
                    const isBase = step.type === 'base';
                    const color = isBase ? CMD_META[step.value as BaseCommand].color : '#8b5cf6';
                    const icon = isBase ? CMD_META[step.value as BaseCommand].icon : '📦';
                    return (
                      <motion.div
                        key={step.id}
                        layout
                        className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-mono transition-shadow ${isExec ? 'ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]' : ''}`}
                        style={{ backgroundColor: `${color}12`, border: `1px solid ${color}${isExec ? '70' : '25'}` }}
                      >
                        <span style={{ color }}>
                          <span className="text-gray-600 mr-2 tabular-nums">{i + 1}.</span>
                          {icon} {step.value}()
                        </span>
                        {!isRunning && (
                          <button onClick={() => removeStep(step.id)} className="text-gray-600 hover:text-red-400 ml-2 px-0.5">×</button>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* command buttons */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {level.availableCommands.map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => addStep('base', cmd)}
                    disabled={isRunning || program.length >= level.maxMainCommands}
                    className="px-2 py-1.5 rounded-lg text-[11px] font-mono font-bold disabled:opacity-25 active:scale-95 transition-transform"
                    style={{ backgroundColor: `${CMD_META[cmd].color}18`, color: CMD_META[cmd].color, border: `1px solid ${CMD_META[cmd].color}30` }}
                  >
                    {CMD_META[cmd].icon} {cmd}()
                  </button>
                ))}
                {savedFuncs.map(fn => (
                  <button
                    key={fn.name}
                    onClick={() => addStep('call', fn.name)}
                    disabled={isRunning || program.length >= level.maxMainCommands}
                    className="px-2 py-1.5 rounded-lg text-[11px] font-mono font-bold disabled:opacity-25 active:scale-95 transition-transform bg-purple-500/15 text-purple-300 border border-purple-500/30"
                  >
                    📦 {fn.name}()
                  </button>
                ))}
              </div>

              {program.length > 0 && !isRunning && (
                <button onClick={clearProgram} className="text-[11px] text-gray-600 hover:text-gray-300 mb-2 block">
                  Clear all
                </button>
              )}
            </section>

            {/* run / reset */}
            <div className="flex gap-2">
              <motion.button
                onClick={runProgram}
                disabled={isRunning || program.length === 0}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-emerald-600 disabled:opacity-35 min-h-[48px] text-sm"
                whileHover={!isRunning && program.length > 0 ? { scale: 1.02 } : {}}
                whileTap={!isRunning && program.length > 0 ? { scale: 0.97 } : {}}
              >
                {isRunning ? '⏳ Running…' : '▶ Run'}
              </motion.button>
              <motion.button
                onClick={resetFrog}
                disabled={isRunning}
                className="px-4 py-3 rounded-xl font-bold text-gray-300 bg-slate-700/50 disabled:opacity-35 min-h-[48px] text-sm"
                whileTap={{ scale: 0.97 }}
              >
                ↺
              </motion.button>
            </div>

            {/* star prediction */}
            {program.length > 0 && outcome !== 'win' && (
              <p className="text-center text-[11px] text-gray-500">
                {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
                {' '}({program.length} cmd{program.length !== 1 && 's'} — par {level.parCommands})
              </p>
            )}
          </motion.div>
        </div>

        {/* ── outcome overlays ── */}

        {/* win */}
        <AnimatePresence>
          {outcome === 'win' && !isRunning && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <motion.div
                className="glass rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center border border-emerald-500/30"
                initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
              >
                <div className="text-5xl mb-3">🐸🎉</div>
                <h2 className="text-2xl font-bold text-white mb-2">Level Complete!</h2>
                <div className="text-3xl mb-2">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
                <p className="text-gray-400 text-sm mb-5">
                  {program.length} command{program.length !== 1 && 's'} used (par: {level.parCommands})
                </p>
                <motion.button
                  onClick={goNextLevel}
                  className="px-8 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 min-h-[48px]"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                >
                  {levelIdx < levels.length - 1 ? 'Next Level →' : 'Finish! 🏆'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* wall / lost */}
        <AnimatePresence>
          {(outcome === 'wall' || outcome === 'lost') && !isRunning && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 text-center"
            >
              <div className="glass rounded-xl p-4 inline-block border border-rose-500/25">
                <p className="text-rose-400 font-bold mb-1">
                  {outcome === 'wall' ? '💥 Bonk! The frog hit a wall.' : '🤔 The frog stopped but didn\'t reach the fly.'}
                </p>
                <p className="text-gray-400 text-sm">
                  {outcome === 'wall' ? 'Check your turns and try again.' : 'You might need more commands — or a function!'}
                </p>
                <button
                  onClick={resetFrog}
                  className="mt-3 px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600"
                >
                  Reset & Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
