'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';
import {
  LEVELS,
  type BlockTemplateId,
  type ProgramBlock,
  type Cell,
  type RoutineTemplateId,
} from '@/lib/underOneConditionLevels';
import {
  resolveBlockAction,
  expandProgram,
  rotationDeg,
  type RunState,
} from '@/lib/underOneConditionEngine';
import { BlockWorkspace } from './blockWorkspace';
import { RoutineEditor } from './routineEditor';

const LEVEL_PASSCODE = '4311';

function cellSizeForGrid(rows: number): number {
  if (rows <= 5) return 52;
  if (rows <= 6) return 46;
  if (rows <= 7) return 40;
  if (rows <= 9) return 34;
  return 30;
}

function cellStyle(cell: Cell): string {
  switch (cell) {
    case 'water':
      return 'bg-emerald-950/50 border border-teal-500/15';
    case 'pad':
      return 'bg-teal-600/25 border-2 border-teal-400/35';
    case 'fork':
      return 'bg-violet-600/30 border-2 border-violet-400/50';
    case 'goal':
      return 'bg-amber-500/25 border-2 border-amber-400/55';
    case 'trap':
      return 'bg-red-950/50 border-2 border-red-500/45';
    case 'rock':
      return 'bg-stone-900/60 border-2 border-stone-500/45';
    default:
      return 'bg-slate-800';
  }
}

function cellEmoji(cell: Cell, isGoal: boolean, isFrog: boolean): string {
  if (isFrog) return '';
  if (isGoal) return '🪷';
  if (cell === 'trap') return '🔥';
  if (cell === 'fork') return '🔀';
  if (cell === 'rock') return '🪨';
  if (cell === 'pad') return '🌿';
  return '';
}

export default function UnderOneConditionGame() {
  const router = useRouter();
  const { addStars, recordAnswer, incrementGamesPlayed } = useGameStore();
  const blockIdRef = useRef(0);

  const [levelIndex, setLevelIndex] = useState(0);
  const [program, setProgram] = useState<ProgramBlock[]>([]);
  const [frogPos, setFrogPos] = useState(LEVELS[0].start);
  const [frogDir, setFrogDir] = useState(LEVELS[0].direction);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [failReason, setFailReason] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [executingIndex, setExecutingIndex] = useState(-1);
  const [showTeach, setShowTeach] = useState(true);
  const [score, setScore] = useState(0);
  const [lastParBeat, setLastParBeat] = useState(false);
  const [routineA, setRoutineA] = useState<ProgramBlock[]>([]);
  const [routineB, setRoutineB] = useState<ProgramBlock[]>([]);
  const [editingRoutine, setEditingRoutine] = useState<'a' | 'b' | null>(null);
  const [routineDraft, setRoutineDraft] = useState<ProgramBlock[]>([]);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [levelPickerUnlocked, setLevelPickerUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const level = LEVELS[levelIndex];

  const effectivePalette = (() => {
    const p: BlockTemplateId[] = [...level.palette];
    if (level.routinesEnabled) {
      if (routineA.length) p.push('call_routine_a');
      if (routineB.length) p.push('call_routine_b');
    }
    return p;
  })();

  const resetLevel = useCallback(() => {
    setFrogPos(level.start);
    setFrogDir(level.direction);
    setProgram([]);
    setRoutineA([]);
    setRoutineB([]);
    setEditingRoutine(null);
    setRoutineDraft([]);
    setIsRunning(false);
    setIsComplete(false);
    setIsFailed(false);
    setFailReason('');
    setExecutingIndex(-1);
    setLastParBeat(false);
    setShowTeach(!!level.teach);
  }, [level]);

  useEffect(() => {
    resetLevel();
  }, [resetLevel, levelIndex]);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('level');
    const n = Number(raw);
    if (raw && n >= 1 && n <= LEVELS.length) setLevelIndex(n - 1);
  }, []);

  const addBlock = (templateId: BlockTemplateId, index?: number) => {
    if (isRunning || program.length >= level.maxBlocks) return;
    blockIdRef.current += 1;
    const block: ProgramBlock = { id: `b-${blockIdRef.current}`, templateId };
    const next = [...program];
    if (index !== undefined) next.splice(index, 0, block);
    else next.push(block);
    setProgram(next);
  };

  const removeBlock = (id: string) => {
    if (!isRunning) setProgram((p) => p.filter((b) => b.id !== id));
  };

  const updateBlock = (id: string, patch: Partial<ProgramBlock>) => {
    if (!isRunning) setProgram((p) => p.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const reorderBlocks = (from: number, to: number) => {
    if (isRunning) return;
    const next = [...program];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setProgram(next);
  };

  const startRoutineEdit = (slot: 'a' | 'b') => {
    if (isRunning) return;
    setEditingRoutine(slot);
    setRoutineDraft(slot === 'a' ? [...routineA] : [...routineB]);
  };

  const saveRoutineEdit = () => {
    if (editingRoutine === 'a') setRoutineA([...routineDraft]);
    else if (editingRoutine === 'b') setRoutineB([...routineDraft]);
    setEditingRoutine(null);
    setRoutineDraft([]);
  };

  const addRoutineBlock = (templateId: RoutineTemplateId) => {
    const max = level.maxRoutineBlocks ?? 6;
    if (routineDraft.length >= max) return;
    blockIdRef.current += 1;
    setRoutineDraft((d) => [...d, { id: `b-${blockIdRef.current}`, templateId }]);
  };

  const removeRoutineBlock = (id: string) => {
    setRoutineDraft((d) => d.filter((b) => b.id !== id));
  };

  const updateRoutineBlock = (id: string, patch: Partial<ProgramBlock>) => {
    setRoutineDraft((d) => d.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const clearRoutine = (slot: 'a' | 'b') => {
    if (slot === 'a') setRoutineA([]);
    else setRoutineB([]);
  };

  const runProgram = async () => {
    if (program.length === 0 || isRunning) return;
    setIsRunning(true);
    setIsFailed(false);
    setIsComplete(false);
    setFailReason('');
    setLastParBeat(false);

    const steps = expandProgram(program, routineA.length ? routineA : null, routineB.length ? routineB : null);
    if (steps.length === 0) {
      setIsFailed(true);
      setFailReason('Add blocks — or fill a routine before calling it!');
      setIsRunning(false);
      return;
    }

    let state: RunState = { pos: { ...level.start }, dir: level.direction };
    setFrogPos(state.pos);
    setFrogDir(state.dir);

    for (let i = 0; i < steps.length; i++) {
      const { block, programIndex } = steps[i]!;
      setExecutingIndex(programIndex);
      await new Promise((r) => setTimeout(r, 450));

      const result = resolveBlockAction(level, block, state);
      if (!result) continue;

      for (let s = 1; s < result.states.length; s++) {
        const st = result.states[s]!;
        setFrogPos({ ...st.pos });
        setFrogDir(st.dir);
        await new Promise((r) => setTimeout(r, 280));
      }

      if (result.states.length > 0) {
        const last = result.states[result.states.length - 1]!;
        state = { pos: { ...last.pos }, dir: last.dir };
      }

      if (result.result === 'trap') {
        setIsFailed(true);
        setFailReason('Your frog hopped into fire thorns!');
        setIsRunning(false);
        setExecutingIndex(-1);
        recordAnswer(false);
        return;
      }
      if (result.result === 'win') {
        setIsComplete(true);
        setShowConfetti(true);
        const beatPar = !!(level.parBlocks && program.length <= level.parBlocks);
        setLastParBeat(beatPar);
        const pts = Math.max(10, 25 - program.length * 2) + (beatPar ? 20 : 0) + (level.challenge ? 10 : 0);
        setScore((s) => s + pts);
        addStars(beatPar ? 3 : 2);
        recordAnswer(true);
        incrementGamesPlayed();
        setTimeout(() => setShowConfetti(false), 3000);
        setIsRunning(false);
        setExecutingIndex(-1);
        return;
      }
      if (result.result === 'stuck') {
        setIsFailed(true);
        setFailReason('Your frog ran into open water. Add more hop blocks!');
        setIsRunning(false);
        setExecutingIndex(-1);
        recordAnswer(false);
        return;
      }
    }

    setExecutingIndex(-1);
    setIsRunning(false);

    if (state.pos.x === level.goal.x && state.pos.y === level.goal.y) {
      setIsComplete(true);
      setShowConfetti(true);
      const beatPar = !!(level.parBlocks && program.length <= level.parBlocks);
      setLastParBeat(beatPar);
      const pts = Math.max(10, 25 - program.length * 2) + (beatPar ? 20 : 0) + (level.challenge ? 10 : 0);
      setScore((s) => s + pts);
      addStars(beatPar ? 3 : 2);
      recordAnswer(true);
      incrementGamesPlayed();
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      setIsFailed(true);
      setFailReason('The golden lily is still waiting — adjust your blocks and try again.');
      recordAnswer(false);
    }
  };

  const nextLevel = () => {
    if (levelIndex < LEVELS.length - 1) setLevelIndex((i) => i + 1);
    else router.push('/sections/code-quest');
  };

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
    setLevelIndex(index);
    setShowLevelPicker(false);
  };

  const rows = level.grid.length;
  const cols = level.grid[0].length;
  const cellSize = cellSizeForGrid(rows);

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-4 md:p-6 relative overflow-hidden bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950">
      <FloatingShapes />
      <Confetti show={showConfetti} />

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-4 max-w-6xl mx-auto"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <motion.button
            onClick={() => router.push('/sections/code-quest')}
            className="glass px-3 py-2.5 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px]"
            whileTap={{ scale: 0.97 }}
          >
            ← Back
          </motion.button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openLevelPicker}
              disabled={isRunning}
              className="glass px-3 py-1.5 rounded-xl text-center hover:bg-white/10 transition-colors disabled:opacity-40 min-h-[44px]"
            >
              <div className="text-[10px] text-gray-400">Level</div>
              <div className="text-lg font-bold text-white">
                {levelIndex + 1}/{LEVELS.length}
              </div>
            </button>
            <div className="glass px-3 py-1.5 rounded-xl text-center">
              <div className="text-[10px] text-gray-400">Score</div>
              <div className="text-lg font-bold text-amber-400">⭐ {score}</div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div className="text-center mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-amber-400/90 text-xs font-semibold tracking-wide uppercase mb-1">Under One Condition</p>
          {level.challenge && (
            <span
              className="inline-block mb-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.45)', color: '#c4b5fd' }}
            >
              ⚡ Challenge zone
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">🐸 {level.name}</h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">{level.subtitle}</p>
          {level.parBlocks != null && (
            <p className="text-violet-400/80 text-xs mt-2 font-medium">
              Par: {level.parBlocks} blocks — beat it for bonus stars!
            </p>
          )}
        </motion.div>

        <AnimatePresence>
          {showTeach && level.teach && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 glass rounded-2xl p-4 border border-amber-500/30 max-w-2xl mx-auto"
            >
              <div className="flex gap-3">
                <span className="text-2xl">💡</span>
                <div className="flex-1">
                  <p className="text-amber-200 text-sm font-medium mb-1">How IF works</p>
                  <p className="text-gray-400 text-sm">{level.teach}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTeach(false)}
                  className="text-gray-500 hover:text-white text-sm"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col xl:flex-row gap-4 items-start">
          {/* Pond grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-4 w-full xl:w-auto xl:flex-shrink-0"
          >
            <div className="flex flex-wrap justify-center gap-3 mb-3 text-[10px] sm:text-xs">
              {[
                ['🌿', 'Lily pad path', 'text-teal-300'],
                ['🪷', 'Golden lily (goal)', 'text-amber-300'],
                ['🔀', 'Junction', 'text-violet-300'],
                ['🔥', 'Fire thorns', 'text-red-400'],
                ['🐸', 'Your frog', 'text-teal-300'],
              ].map(([icon, label, color]) => (
                <span key={label} className={`flex items-center gap-1 ${color}`}>
                  {icon} {label}
                </span>
              ))}
            </div>
            <div className="overflow-x-auto flex justify-center pb-1">
              <div
                className="grid gap-1 shrink-0"
                style={{
                  gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                  gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
                }}
              >
                {level.grid.map((row, y) =>
                  row.map((cell, x) => {
                    const isFrog = frogPos.x === x && frogPos.y === y;
                    const isGoal = level.goal.x === x && level.goal.y === y;
                    return (
                      <motion.div
                        key={`${x}-${y}`}
                        className={`rounded-lg flex items-center justify-center relative ${cellStyle(cell)}`}
                        style={{ width: cellSize, height: cellSize }}
                        animate={isFrog && isFailed ? { x: [-3, 3, -3, 0] } : {}}
                      >
                        <span className="text-lg sm:text-xl select-none">{cellEmoji(cell, isGoal, isFrog)}</span>
                        {isFrog && (
                          <motion.span
                            className="absolute text-xl sm:text-2xl z-10 drop-shadow-md"
                            animate={{ rotate: rotationDeg(frogDir) }}
                            transition={{ duration: 0.25 }}
                          >
                            🐸
                          </motion.span>
                        )}
                      </motion.div>
                    );
                  }),
                )}
              </div>
            </div>
          </motion.div>

          {/* Code workspace */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-4 flex-1 min-w-0 w-full"
          >
            {level.routinesEnabled && (
              <div className="mb-4 grid sm:grid-cols-2 gap-3">
                <RoutineEditor
                  slot="a"
                  routine={editingRoutine === 'a' ? routineDraft : routineA}
                  maxBlocks={level.maxRoutineBlocks ?? 6}
                  isRunning={isRunning}
                  isEditing={editingRoutine === 'a'}
                  onStartEdit={() => startRoutineEdit('a')}
                  onSave={saveRoutineEdit}
                  onCancel={() => { setEditingRoutine(null); setRoutineDraft([]); }}
                  onClear={() => clearRoutine('a')}
                  onAddBlock={addRoutineBlock}
                  onRemoveBlock={removeRoutineBlock}
                  onUpdateBlock={updateRoutineBlock}
                />
                <RoutineEditor
                  slot="b"
                  routine={editingRoutine === 'b' ? routineDraft : routineB}
                  maxBlocks={level.maxRoutineBlocks ?? 6}
                  isRunning={isRunning}
                  isEditing={editingRoutine === 'b'}
                  onStartEdit={() => startRoutineEdit('b')}
                  onSave={saveRoutineEdit}
                  onCancel={() => { setEditingRoutine(null); setRoutineDraft([]); }}
                  onClear={() => clearRoutine('b')}
                  onAddBlock={addRoutineBlock}
                  onRemoveBlock={removeRoutineBlock}
                  onUpdateBlock={updateRoutineBlock}
                />
              </div>
            )}

            <BlockWorkspace
              palette={effectivePalette}
              program={program}
              maxBlocks={level.maxBlocks}
              executingIndex={executingIndex}
              isRunning={isRunning}
              onAdd={addBlock}
              onRemove={removeBlock}
              onUpdate={updateBlock}
              onReorder={reorderBlocks}
              onClear={() => !isRunning && setProgram([])}
            />

            <div className="flex gap-2 mt-4">
              <motion.button
                type="button"
                onClick={runProgram}
                disabled={isRunning || program.length === 0}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-40 min-h-[48px]"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                {isRunning ? '▶ Running…' : '▶ Run program'}
              </motion.button>
              <button
                type="button"
                onClick={resetLevel}
                disabled={isRunning}
                className="px-4 py-3 rounded-xl bg-white/10 text-gray-300 text-sm disabled:opacity-40 min-h-[48px]"
              >
                Reset
              </button>
            </div>

            <div className="mt-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 text-xs">💡 </span>
              <span className="text-gray-400 text-xs">{level.hint}</span>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {isFailed && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass px-6 py-4 rounded-2xl border border-red-500/40 text-center max-w-md mx-4"
            >
              <p className="text-red-400 font-semibold text-sm sm:text-base">{failReason}</p>
              <motion.button
                type="button"
                onClick={() => {
                  setIsFailed(false);
                  setFrogPos(level.start);
                  setFrogDir(level.direction);
                  setExecutingIndex(-1);
                }}
                className="mt-3 px-6 py-2.5 rounded-xl bg-slate-600 text-white text-sm min-h-[44px]"
                whileTap={{ scale: 0.97 }}
              >
                Try again
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="glass rounded-3xl p-8 sm:p-10 max-w-lg w-full text-center border border-green-500/30"
                style={{ boxShadow: '0 0 60px rgba(34,197,94,0.15)' }}
              >
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-6xl sm:text-7xl mb-5"
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Level Complete!</h2>
                <p className="text-green-400 font-semibold text-lg mb-1">Golden lily reached!</p>
                <p className="text-gray-400 text-sm mb-1">🐸 {level.name}</p>
                <p className="text-gray-500 text-xs sm:text-sm mb-6">
                  Your blocks steered the frog to the star.
                </p>
                {lastParBeat && (
                  <p className="text-violet-300 text-sm font-semibold mb-4">⚡ Par beaten — 3 stars!</p>
                )}
                <div className="flex justify-center gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Blocks used</div>
                    <div className="text-xl font-bold text-white">
                      {program.length}
                      {level.parBlocks != null && (
                        <span className="text-sm font-normal text-gray-500"> / par {level.parBlocks}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Total score</div>
                    <div className="text-xl font-bold text-amber-400">⭐ {score}</div>
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={nextLevel}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="w-full sm:w-auto px-10 py-4 rounded-2xl text-lg font-bold text-white min-h-[52px]"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 8px 24px rgba(34,197,94,0.35)' }}
                >
                  {levelIndex < LEVELS.length - 1 ? 'Next level →' : 'Finish 🏆'}
                </motion.button>
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
                className="glass rounded-2xl p-5 sm:p-6 max-w-md w-full border border-amber-500/25 max-h-[85vh] overflow-y-auto"
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
                        className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/15 text-white text-center text-lg tracking-widest placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50"
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
                          className="flex-1 py-3 rounded-xl font-semibold text-white text-sm min-h-[44px]"
                          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {LEVELS.map((lv, i) => (
                        <button
                          key={lv.id}
                          type="button"
                          onClick={() => jumpToLevel(i)}
                          className={`px-2 py-3 rounded-xl text-left transition-colors min-h-[56px] ${
                            i === levelIndex
                              ? 'bg-amber-500/25 border-2 border-amber-500/50'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-[10px] text-gray-500 mb-0.5">
                            {lv.challenge ? '⚡' : '🐸'} {i + 1}
                          </div>
                          <div className="text-xs font-semibold text-white leading-tight truncate">
                            {lv.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
