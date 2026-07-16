'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import {
  bugHunter2Levels,
  type CodeLine,
} from '@/lib/bugHunter2Levels';

const LEVEL_PASSCODE = '4311';

const difficultyColors = {
  Easy: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' },
  Medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500' },
  Hard: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500' },
  Expert: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' },
};

function normalizeCode(s: string) {
  return s.trim().replace(/\s+/g, ' ');
}

export default function BugHunter2Game() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [foundBugs, setFoundBugs] = useState<number[]>([]);
  const [fixedBugs, setFixedBugs] = useState<number[]>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [gamePhase, setGamePhase] = useState<'hunting' | 'fixing' | 'complete'>('hunting');
  const [bugAnimation, setBugAnimation] = useState<number | null>(null);
  const [userFix, setUserFix] = useState('');
  const [fixAttemptResult, setFixAttemptResult] = useState<'none' | 'correct' | 'wrong'>('none');
  const [showSolution, setShowSolution] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const levels = bugHunter2Levels;
  const level = levels[currentLevelIndex]!;
  const diffColors = difficultyColors[level.difficulty];

  const resetLevel = () => {
    setFoundBugs([]);
    setFixedBugs([]);
    setSelectedLine(null);
    setShowHint(false);
    setWrongAttempts(0);
    setGamePhase('hunting');
    setBugAnimation(null);
    setUserFix('');
    setFixAttemptResult('none');
    setShowSolution(false);
  };

  useEffect(() => {
    resetLevel();
  }, [currentLevelIndex]);

  const handleLineClick = (lineId: number) => {
    if (gamePhase === 'complete') return;
    const line = level.lines.find((l) => l.id === lineId);
    if (!line) return;

    if (gamePhase === 'hunting') {
      if (line.hasBug && !foundBugs.includes(lineId)) {
        setBugAnimation(lineId);
        setTimeout(() => {
          setFoundBugs((prev) => {
            const next = [...prev, lineId];
            const bugLines = level.lines.filter((l) => l.hasBug).map((l) => l.id);
            if (next.length === bugLines.length) setGamePhase('fixing');
            return next;
          });
          setBugAnimation(null);
        }, 450);
      } else if (!line.hasBug) {
        setWrongAttempts((prev) => prev + 1);
        recordAnswer(false);
      }
    } else if (gamePhase === 'fixing') {
      if (line.hasBug && foundBugs.includes(lineId) && !fixedBugs.includes(lineId)) {
        setSelectedLine(lineId);
        setUserFix('');
        setFixAttemptResult('none');
        setShowSolution(false);
      }
    }
  };

  const checkUserFix = (lineId: number) => {
    const buggyLine = level.lines.find((l) => l.id === lineId);
    if (!buggyLine?.correctCode) return;

    if (normalizeCode(userFix) === normalizeCode(buggyLine.correctCode)) {
      setFixAttemptResult('correct');
      recordAnswer(true);
      setTimeout(() => {
        const newFixed = [...fixedBugs, lineId];
        setFixedBugs(newFixed);
        setSelectedLine(null);
        setUserFix('');
        setFixAttemptResult('none');
        setShowSolution(false);
        const bugLines = level.lines.filter((l) => l.hasBug).map((l) => l.id);
        if (newFixed.length === bugLines.length) {
          setGamePhase('complete');
          setShowConfetti(true);
          const stars = wrongAttempts === 0 ? 3 : wrongAttempts < 4 ? 2 : 1;
          addStars(stars);
          incrementGamesPlayed();
          setTimeout(() => setShowConfetti(false), 2800);
        }
      }, 900);
    } else {
      setFixAttemptResult('wrong');
      setWrongAttempts((prev) => prev + 1);
      recordAnswer(false);
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex((prev) => prev + 1);
    } else {
      router.push('/sections/favourite');
    }
  };

  const tryOpenLevelPicker = () => {
    setPasscodeInput('');
    setPasscodeError('');
    setShowLevelPicker(true);
  };

  const submitPasscode = () => {
    if (passcodeInput === LEVEL_PASSCODE) {
      setPasscodeError('');
    } else {
      setPasscodeError('Wrong passcode — try again');
    }
  };

  const jumpToLevel = (index: number) => {
    if (passcodeInput !== LEVEL_PASSCODE) {
      setPasscodeError('Enter the passcode first');
      return;
    }
    setCurrentLevelIndex(index);
    setShowLevelPicker(false);
  };

  const getLineStatus = (line: CodeLine) => {
    if (fixedBugs.includes(line.id)) return 'fixed';
    if (foundBugs.includes(line.id)) return 'found';
    if (bugAnimation === line.id) return 'animating';
    return 'normal';
  };

  const passcodeUnlocked = passcodeInput === LEVEL_PASSCODE && !passcodeError;

  return (
    <main className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-900 via-rose-950/40 to-slate-900 p-3 sm:p-4 md:p-6 relative overflow-hidden">
      <Confetti show={showConfetti} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl opacity-40"
            style={{ left: `${(i * 17) % 100}%`, top: `${(i * 23) % 100}%` }}
            animate={{ y: [0, -16, 0], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.2 }}
          >
            {['🐛', '🪲', '🐜', '🦗'][i % 4]}
          </motion.div>
        ))}
      </div>

      <header className="max-w-4xl mx-auto mb-6 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <motion.button
            onClick={() => router.push('/sections/favourite')}
            className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:text-white transition-all text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Favourites
          </motion.button>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={tryOpenLevelPicker}
              title="Level select (passcode)"
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-rose-200 hover:bg-white/15"
            >
              Levels
            </button>
            <div
              className={`${diffColors.bg} backdrop-blur rounded-xl px-3 py-2 border ${diffColors.border}`}
            >
              <span className={`${diffColors.text} font-bold text-sm`}>{level.difficulty}</span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 border border-white/20">
              <span className="text-gray-300 text-sm">Level </span>
              <span className="text-white font-bold">
                {currentLevelIndex + 1}/{levels.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div className="text-center mb-6" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
              🐛 Bug Hunter 2
            </span>
          </h1>
          <p className="text-rose-200/80 text-sm">
            Find bugs, then <span className="text-amber-300 font-semibold">type</span> every fix yourself —
            even after you peek at the solution.
          </p>
        </motion.div>

        <motion.div
          className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-5 mb-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">🔎</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white mb-1">{level.title}</h2>
              <p className="text-rose-200/90 mb-3 text-sm">{level.story}</p>
              <div className="flex flex-wrap gap-2">
                <div className="bg-rose-500/20 rounded-xl px-3 py-1.5 text-sm text-rose-300">
                  🐛 Bugs: <strong>{level.bugCount}</strong>
                </div>
                <div className="bg-green-500/20 rounded-xl px-3 py-1.5 text-sm text-green-400">
                  ✓ Found: <strong>{foundBugs.length}</strong>
                </div>
                <div className="bg-blue-500/20 rounded-xl px-3 py-1.5 text-sm text-blue-300">
                  ⌨️ Typed: <strong>{fixedBugs.length}</strong>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mb-4 text-center">
          {gamePhase === 'hunting' && (
            <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-5 py-2">
              <span className="text-yellow-400 font-semibold text-sm">Phase 1: Find the bugs</span>
              <span className="text-yellow-400/70 text-xs">(click buggy lines)</span>
            </div>
          )}
          {gamePhase === 'fixing' && (
            <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-5 py-2">
              <span className="text-blue-300 font-semibold text-sm">Phase 2: Type the fix</span>
              <span className="text-blue-300/70 text-xs">(Show Solution is peek-only)</span>
            </div>
          )}
          {gamePhase === 'complete' && (
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-5 py-2">
              <span className="text-green-400 font-semibold text-sm">All bugs squashed!</span>
            </div>
          )}
        </div>

        <motion.div
          className="bg-slate-900/90 backdrop-blur rounded-2xl border-2 border-rose-500/25 overflow-hidden mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-3 text-slate-400 text-sm font-mono">buggy_code.js</span>
            {wrongAttempts > 0 && (
              <span className="ml-auto text-red-400 text-sm">❌ Misses: {wrongAttempts}</span>
            )}
          </div>

          <div className="p-4 font-mono text-sm">
            {level.lines.map((line) => {
              const status = getLineStatus(line);
              return (
                <motion.div
                  key={line.id}
                  onClick={() => handleLineClick(line.id)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all
                    ${status === 'fixed' ? 'bg-green-500/20 border border-green-500/50' : ''}
                    ${status === 'found' ? 'bg-red-500/20 border border-red-500/50' : ''}
                    ${status === 'animating' ? 'bg-yellow-500/30' : ''}
                    ${status === 'normal' ? 'hover:bg-white/5' : ''}
                  `}
                  animate={status === 'animating' ? { x: [0, -4, 4, 0] } : {}}
                >
                  <span className="text-slate-500 w-6 text-right select-none">{line.id}</span>
                  <span className="text-slate-600 select-none">│</span>
                  {status === 'fixed' ? (
                    <span className="text-green-400">{line.correctCode}</span>
                  ) : (
                    <span className={status === 'found' ? 'text-red-400' : 'text-slate-300'}>
                      {line.code}
                    </span>
                  )}
                  {status === 'found' && !fixedBugs.includes(line.id) && (
                    <span className="ml-auto">🐛</span>
                  )}
                  {status === 'fixed' && <span className="ml-auto">✅</span>}
                </motion.div>
              );
            })}
          </div>

          <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700">
            <span className="text-slate-400 text-sm">Expected output: </span>
            <span className="text-green-400 font-mono">{level.expectedOutput}</span>
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedLine !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 12 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 12 }}
                className="bg-slate-800 rounded-2xl p-6 max-w-xl w-full border border-rose-500/30 shadow-2xl"
              >
                {(() => {
                  const buggyLine = level.lines.find((l) => l.id === selectedLine);
                  if (!buggyLine) return null;
                  return (
                    <>
                      <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                        <span>⌨️</span> Type the fix
                      </h3>
                      <p className="text-slate-400 text-xs mb-4">
                        You must type the corrected line yourself — Show Solution only peeks.
                      </p>

                      <div className="mb-3">
                        <div className="text-sm text-red-400 mb-2">🐛 {buggyLine.bugType}</div>
                        <div className="bg-red-500/20 rounded-xl p-3 font-mono text-red-400 text-sm break-all">
                          {buggyLine.code}
                        </div>
                      </div>

                      <div className="bg-indigo-500/20 rounded-xl p-3 mb-4">
                        <span className="text-indigo-300 text-sm">💡 Hint: {buggyLine.hint}</span>
                      </div>

                      {showSolution && (
                        <div className="mb-4">
                          <div className="text-sm text-amber-300/90 mb-2">👀 Solution (type it below):</div>
                          <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 font-mono text-amber-200 text-sm break-all select-text">
                            {buggyLine.correctCode}
                          </div>
                        </div>
                      )}

                      {fixAttemptResult === 'correct' && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 mb-4 text-center"
                        >
                          <div className="text-2xl mb-1">🎉</div>
                          <div className="text-green-400 font-bold">Correct — you typed it!</div>
                        </motion.div>
                      )}

                      {fixAttemptResult !== 'correct' && (
                        <div className="mb-4">
                          <div className="text-sm text-slate-400 mb-2">✏️ Your corrected line:</div>
                          <input
                            type="text"
                            value={userFix}
                            onChange={(e) => {
                              setUserFix(e.target.value);
                              setFixAttemptResult('none');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && userFix.trim()) checkUserFix(selectedLine);
                            }}
                            placeholder="Type the full fixed line…"
                            className={`w-full px-4 py-3 rounded-xl font-mono text-sm border-2 transition-all
                              ${
                                fixAttemptResult === 'wrong'
                                  ? 'bg-red-500/10 border-red-500/50 text-red-300'
                                  : 'bg-slate-700/50 border-slate-600 text-white focus:border-rose-400'
                              }`}
                            autoFocus
                            spellCheck={false}
                            autoComplete="off"
                          />
                          {fixAttemptResult === 'wrong' && (
                            <p className="text-red-400 text-sm mt-2">
                              ❌ Not exact yet — check spaces and symbols, or peek then type it.
                            </p>
                          )}
                        </div>
                      )}

                      {fixAttemptResult !== 'correct' && (
                        <div className="flex flex-wrap gap-3">
                          <motion.button
                            type="button"
                            onClick={() => checkUserFix(selectedLine)}
                            disabled={!userFix.trim()}
                            className={`flex-1 min-w-[140px] py-3 rounded-xl font-bold transition-all
                              ${
                                userFix.trim()
                                  ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white'
                                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              }`}
                            whileHover={userFix.trim() ? { scale: 1.02 } : {}}
                            whileTap={userFix.trim() ? { scale: 0.98 } : {}}
                          >
                            ✓ Check typing
                          </motion.button>
                          {!showSolution && (
                            <motion.button
                              type="button"
                              onClick={() => setShowSolution(true)}
                              className="px-4 py-3 rounded-xl bg-slate-700 text-slate-200 hover:bg-slate-600"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              👀 Show Solution
                            </motion.button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLine(null);
                              setUserFix('');
                              setShowSolution(false);
                              setFixAttemptResult('none');
                            }}
                            className="px-4 py-3 rounded-xl text-slate-400 hover:text-white text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {gamePhase !== 'complete' && (
            <>
              <motion.button
                onClick={resetLevel}
                className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-gray-300 text-sm"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                🔄 Reset
              </motion.button>
              {!showHint && gamePhase === 'hunting' && (
                <motion.button
                  onClick={() => setShowHint(true)}
                  className="px-5 py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  💡 Hint
                </motion.button>
              )}
            </>
          )}
          {gamePhase === 'complete' && (
            <motion.button
              onClick={nextLevel}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {currentLevelIndex < levels.length - 1 ? 'Next Level →' : '🏆 Done — Favourites'}
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {showHint && gamePhase === 'hunting' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 text-center"
            >
              <div className="inline-block bg-yellow-500/20 border border-yellow-500/30 rounded-xl px-5 py-3">
                <span className="text-yellow-400 text-sm">💡 {level.concept}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-4">
          <h4 className="text-white font-semibold mb-1 text-sm">🎓 Learning point</h4>
          <p className="text-rose-200/80 text-sm">{level.concept}</p>
        </div>
      </div>

      <AnimatePresence>
        {showLevelPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLevelPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="glass rounded-2xl p-6 max-w-md w-full border border-rose-500/30 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-2 text-center">Jump to level</h3>
              <p className="text-gray-400 text-sm mb-4 text-center">Enter passcode to unlock the list.</p>
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => {
                  setPasscodeInput(e.target.value);
                  setPasscodeError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && submitPasscode()}
                placeholder="Passcode"
                className="w-full mb-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-center"
              />
              {passcodeError && (
                <p className="text-red-400 text-sm text-center mb-2">{passcodeError}</p>
              )}
              <button
                type="button"
                onClick={submitPasscode}
                className="w-full mb-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold"
              >
                Unlock
              </button>
              {passcodeUnlocked && (
                <div className="grid grid-cols-5 gap-2">
                  {levels.map((lv, i) => (
                    <button
                      key={lv.id}
                      type="button"
                      onClick={() => jumpToLevel(i)}
                      className={`py-2 rounded-lg text-sm font-bold border ${
                        i === currentLevelIndex
                          ? 'bg-rose-500/40 border-rose-400 text-white'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {lv.id}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowLevelPicker(false)}
                className="mt-4 w-full py-2 text-slate-400 text-sm"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
