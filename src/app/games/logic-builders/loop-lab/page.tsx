'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import FloatingShapes from '@/components/FloatingShapes';
import Confetti from '@/components/Confetti';
import AssessmentIntro from '@/components/AssessmentIntro';
import LogicTile, { LogicShape } from '@/components/LogicTile';
import { useGameStore } from '@/store/gameStore';

interface LoopQuestion {
  code: string;
  resultShapes: { shape: LogicShape; color: string }[];
  options: number[];
  answer: number;
  hint: string;
}

const questions: LoopQuestion[] = [
  {
    code: 'for (let i = 0; i < 3; i++) {\n  addCircle();\n}',
    resultShapes: Array(3).fill({ shape: 'circle' as LogicShape, color: '#60a5fa' }),
    options: [2, 3, 4, 5],
    answer: 3,
    hint: 'i goes 0, 1, 2 — that is 3 times.',
  },
  {
    code: 'for (let i = 0; i < 5; i++) {\n  addSquare();\n}',
    resultShapes: Array(5).fill({ shape: 'square' as LogicShape, color: '#f472b6' }),
    options: [4, 5, 6, 3],
    answer: 5,
    hint: 'i goes 0, 1, 2, 3, 4 — that is 5 times.',
  },
  {
    code: 'for (let i = 1; i <= 4; i++) {\n  addTriangle();\n}',
    resultShapes: Array(4).fill({ shape: 'triangle' as LogicShape, color: '#34d399' }),
    options: [3, 4, 5, 6],
    answer: 4,
    hint: 'i goes 1, 2, 3, 4 — that is 4 times.',
  },
  {
    code: 'for (let i = 0; i < 2; i++) {\n  addDiamond();\n  addDiamond();\n}',
    resultShapes: Array(4).fill({ shape: 'diamond' as LogicShape, color: '#a78bfa' }),
    options: [2, 3, 4, 6],
    answer: 4,
    hint: 'Loop runs 2 times, but each time adds 2 shapes = 4.',
  },
  {
    code: 'for (let i = 0; i < 6; i++) {\n  addHex();\n}',
    resultShapes: Array(6).fill({ shape: 'hex' as LogicShape, color: '#22c55e' }),
    options: [5, 6, 7, 4],
    answer: 6,
    hint: 'i goes 0 to 5 — that is 6 times.',
  },
  {
    code: 'for (let i = 2; i < 5; i++) {\n  addCircle();\n}',
    resultShapes: Array(3).fill({ shape: 'circle' as LogicShape, color: '#f59e0b' }),
    options: [2, 3, 5, 4],
    answer: 3,
    hint: 'i goes 2, 3, 4 — that is 3 times.',
  },
  {
    code: 'for (let i = 0; i < 3; i++) {\n  addSquare();\n  addCircle();\n}',
    resultShapes: [
      { shape: 'square' as LogicShape, color: '#60a5fa' },
      { shape: 'circle' as LogicShape, color: '#f472b6' },
      { shape: 'square' as LogicShape, color: '#60a5fa' },
      { shape: 'circle' as LogicShape, color: '#f472b6' },
      { shape: 'square' as LogicShape, color: '#60a5fa' },
      { shape: 'circle' as LogicShape, color: '#f472b6' },
    ],
    options: [3, 4, 6, 9],
    answer: 6,
    hint: '3 loops × 2 shapes each = 6 total shapes.',
  },
  {
    code: 'for (let i = 0; i < 4; i++) {\n  if (i < 2) addTriangle();\n  else addHex();\n}',
    resultShapes: [
      { shape: 'triangle' as LogicShape, color: '#34d399' },
      { shape: 'triangle' as LogicShape, color: '#34d399' },
      { shape: 'hex' as LogicShape, color: '#a78bfa' },
      { shape: 'hex' as LogicShape, color: '#a78bfa' },
    ],
    options: [2, 3, 4, 6],
    answer: 4,
    hint: 'The loop always runs 4 times — the if only changes which shape.',
  },
  {
    code: 'for (let i = 1; i <= 3; i++) {\n  for (let j = 0; j < 2; j++) {\n    addDiamond();\n  }\n}',
    resultShapes: Array(6).fill({ shape: 'diamond' as LogicShape, color: '#06b6d4' }),
    options: [3, 5, 6, 9],
    answer: 6,
    hint: 'Outer loop 3× inner loop 2 = 6 total.',
  },
  {
    code: 'let count = 0;\nfor (let i = 0; i < 5; i++) {\n  if (i % 2 === 0) addCircle();\n}',
    resultShapes: [
      { shape: 'circle' as LogicShape, color: '#f472b6' },
      { shape: 'circle' as LogicShape, color: '#f472b6' },
      { shape: 'circle' as LogicShape, color: '#f472b6' },
    ],
    options: [2, 3, 4, 5],
    answer: 3,
    hint: 'Even numbers: 0, 2, 4 — that is 3 shapes.',
  },
];

export default function LoopLabPage() {
  const router = useRouter();
  const { ageGroup, recordAnswer, addStars, incrementGamesPlayed } = useGameStore();
  const [showIntro, setShowIntro] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const timePerQuestion = 35;
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);

  useEffect(() => { if (!ageGroup) router.push('/'); }, [ageGroup, router]);

  const current = questions[index];
  const total = questions.length;
  const isLocked = selected !== null || timedOut;
  const timeProgress = (timeLeft / timePerQuestion) * 100;

  useEffect(() => { setTimeLeft(timePerQuestion); setTimedOut(false); }, [index]);

  useEffect(() => {
    if (isLocked || showConfetti) return;
    if (timeLeft <= 0) {
      if (!hasStarted) { incrementGamesPlayed(); setHasStarted(true); }
      setTimedOut(true); setIsCorrect(false); recordAnswer(false); return;
    }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, isLocked, showConfetti, hasStarted, incrementGamesPlayed, recordAnswer]);

  const handleSelect = (val: number) => {
    if (isLocked) return;
    if (!hasStarted) { incrementGamesPlayed(); setHasStarted(true); }
    const correct = val === current.answer;
    setSelected(val); setIsCorrect(correct);
    setScore((p) => p + (correct ? 1 : 0));
    recordAnswer(correct);
  };

  const handleNext = () => {
    if (index === total - 1) { addStars(Math.max(1, score)); setShowConfetti(true); return; }
    setIndex((p) => p + 1); setSelected(null); setIsCorrect(null); setTimedOut(false);
  };

  const handleRestart = () => {
    setIndex(0); setSelected(null); setIsCorrect(null); setTimedOut(false);
    setScore(0); setShowConfetti(false); setHasStarted(false);
  };

  const msg = useMemo(() => {
    if (score === total) return 'Loop master!';
    if (score >= total - 2) return 'Great counting!';
    return 'Nice try — keep looping!';
  }, [score, total]);

  if (!ageGroup) return null;

  if (showIntro) {
    return (
      <AssessmentIntro
        icon="🔄"
        title="Loop Lab"
        subtitle="How many shapes does the loop create?"
        description="Each level shows a real JavaScript for-loop that creates shapes. Your job is to count how many shapes the code will produce. Starts simple with basic loops, then adds double-adds, if-conditions inside loops, nested loops, and modulo tricks."
        skills={[
          { icon: '🔄', label: 'Loop counting' },
          { icon: '🔢', label: 'Iteration logic' },
          { icon: '📦', label: 'Nested loops' },
          { icon: '💻', label: 'JavaScript for-loops' },
        ]}
        totalQuestions={total}
        timePerQuestion={timePerQuestion}
        color="#3b82f6"
        onStart={() => setShowIntro(false)}
        onBack={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative">
      <FloatingShapes />
      {showConfetti && <Confetti />}

      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 mb-5 sm:mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2"><span>🔄</span> Loop Lab</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">How many shapes does the loop create?</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="glass px-4 py-2 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px] touch-target">← Back</button>
        </div>
      </motion.header>

      <section className="relative z-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-3xl p-5 sm:p-6 border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-400">Level {index + 1} / {total}</span>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-blue-200">Score: {score}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${timeLeft <= 5 ? 'bg-rose-500/20 text-rose-200' : 'bg-white/10 text-gray-300'}`}>⏱ {timeLeft}s</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
            <div className="h-full transition-all duration-500 ease-out" style={{ width: `${timeProgress}%`, background: timeLeft <= 5 ? 'linear-gradient(90deg,#fb7185,#f43f5e)' : 'linear-gradient(90deg,#60a5fa,#3b82f6)' }} />
          </div>

          {/* Code block */}
          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 mb-4 overflow-x-auto">
            <pre className="text-xs sm:text-sm text-blue-200 font-mono whitespace-pre">{current.code}</pre>
          </div>

          {/* Shape preview (revealed after answer) */}
          <AnimatePresence>
            {isLocked && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-wrap gap-2 justify-center mb-4 p-3 rounded-2xl bg-white/5 border border-white/10">
                {current.resultShapes.map((s, i) => (
                  <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08 }}>
                    <LogicTile shape={s.shape} color={s.color} size={32} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-sm text-white font-semibold mb-3">How many shapes will appear?</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {current.options.map((opt) => {
              const isPicked = selected === opt;
              const correct = opt === current.answer;
              return (
                <button key={opt} onClick={() => handleSelect(opt)} disabled={isLocked}
                  className={`p-3 rounded-2xl border text-center text-lg font-bold transition-all min-h-[56px] ${
                    isPicked
                      ? correct ? 'border-emerald-400/80 bg-emerald-500/10 text-emerald-100' : 'border-red-400/80 bg-red-500/10 text-red-100'
                      : 'border-white/10 bg-white/5 hover:border-white/30 text-gray-200'
                  }`}>{opt}</button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {isLocked && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl px-4 py-3 text-sm ${isCorrect ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'}`}>
                {timedOut ? "Time\u2019s up!" : isCorrect ? 'Correct!' : `Not quite — ${current.hint}`}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap gap-3">
            {index < total - 1 && <button onClick={handleNext} disabled={!isLocked} className="btn-cosmic px-5 py-2.5 text-sm min-h-[44px] touch-target disabled:opacity-50">Next Level →</button>}
            {index === total - 1 && isLocked && <button onClick={handleNext} className="btn-cosmic px-5 py-2.5 text-sm min-h-[44px] touch-target">Finish</button>}
            <button onClick={handleRestart} className="glass px-4 py-2.5 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px] touch-target">Restart</button>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 sm:p-6 border border-purple-500/20">
          <h2 className="text-white font-semibold text-base sm:text-lg mb-3">How loops work</h2>
          <div className="grid gap-3 text-sm text-gray-300">
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-blue-300">for loop</strong> — repeats code a set number of times.
            </div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-blue-300">i starts at 0</strong> — <code className="text-xs bg-black/30 px-1 rounded">i &lt; 3</code> means i = 0, 1, 2 (3 times).
            </div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">Nested loops</strong> — multiply outer × inner to get total.
            </div>
          </div>
          {showConfetti && (
            <div className="mt-5 rounded-2xl bg-emerald-500/10 p-4 border border-emerald-400/30">
              <p className="text-emerald-200 text-sm font-semibold">{msg}</p>
              <p className="text-emerald-100 text-xs mt-1">You scored {score} / {total}.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-100">Correct: {score}</span>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-rose-100">Wrong: {total - score}</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
