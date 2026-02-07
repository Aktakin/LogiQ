'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import FloatingShapes from '@/components/FloatingShapes';
import Confetti from '@/components/Confetti';
import AssessmentIntro from '@/components/AssessmentIntro';
import LogicTile, { LogicShape } from '@/components/LogicTile';
import { useGameStore } from '@/store/gameStore';

type ShapeItem = { shape: LogicShape; color: string; label: string };

interface SorterQuestion {
  code: string;
  shapes: ShapeItem[];
  /** indices of shapes that pass the filter */
  passIndices: number[];
  hint: string;
}

const questions: SorterQuestion[] = [
  {
    code: 'shapes.filter(s => s.color === "blue")',
    shapes: [
      { shape: 'circle', color: '#60a5fa', label: 'blue circle' },
      { shape: 'square', color: '#f472b6', label: 'pink square' },
      { shape: 'triangle', color: '#60a5fa', label: 'blue triangle' },
      { shape: 'diamond', color: '#22c55e', label: 'green diamond' },
    ],
    passIndices: [0, 2],
    hint: 'Only blue shapes pass.',
  },
  {
    code: 'shapes.filter(s => s.shape === "circle")',
    shapes: [
      { shape: 'circle', color: '#f59e0b', label: 'gold circle' },
      { shape: 'hex', color: '#f59e0b', label: 'gold hex' },
      { shape: 'circle', color: '#a78bfa', label: 'purple circle' },
      { shape: 'square', color: '#ef4444', label: 'red square' },
    ],
    passIndices: [0, 2],
    hint: 'Only circles pass.',
  },
  {
    code: 'shapes.filter(s => s.color !== "green")',
    shapes: [
      { shape: 'triangle', color: '#22c55e', label: 'green triangle' },
      { shape: 'diamond', color: '#60a5fa', label: 'blue diamond' },
      { shape: 'hex', color: '#22c55e', label: 'green hex' },
      { shape: 'circle', color: '#f472b6', label: 'pink circle' },
    ],
    passIndices: [1, 3],
    hint: '!== "green" keeps everything except green.',
  },
  {
    code: 'shapes.filter(s =>\n  s.shape === "square" ||\n  s.shape === "diamond"\n)',
    shapes: [
      { shape: 'square', color: '#60a5fa', label: 'blue square' },
      { shape: 'circle', color: '#f472b6', label: 'pink circle' },
      { shape: 'diamond', color: '#22c55e', label: 'green diamond' },
      { shape: 'triangle', color: '#f59e0b', label: 'gold triangle' },
      { shape: 'square', color: '#ef4444', label: 'red square' },
    ],
    passIndices: [0, 2, 4],
    hint: 'Squares and diamonds pass.',
  },
  {
    code: 'shapes.filter(s =>\n  s.color === "pink" &&\n  s.shape !== "circle"\n)',
    shapes: [
      { shape: 'circle', color: '#f472b6', label: 'pink circle' },
      { shape: 'square', color: '#f472b6', label: 'pink square' },
      { shape: 'triangle', color: '#f472b6', label: 'pink triangle' },
      { shape: 'hex', color: '#60a5fa', label: 'blue hex' },
    ],
    passIndices: [1, 2],
    hint: 'Pink AND not circle.',
  },
  {
    code: 'shapes.filter((s, i) => i < 3)',
    shapes: [
      { shape: 'hex', color: '#a78bfa', label: 'purple hex' },
      { shape: 'circle', color: '#22c55e', label: 'green circle' },
      { shape: 'diamond', color: '#f59e0b', label: 'gold diamond' },
      { shape: 'triangle', color: '#ef4444', label: 'red triangle' },
    ],
    passIndices: [0, 1, 2],
    hint: 'Index < 3 means the first 3 items.',
  },
  {
    code: 'shapes.filter(s =>\n  s.shape === "hex" ||\n  s.color === "green"\n)',
    shapes: [
      { shape: 'hex', color: '#f472b6', label: 'pink hex' },
      { shape: 'circle', color: '#22c55e', label: 'green circle' },
      { shape: 'square', color: '#60a5fa', label: 'blue square' },
      { shape: 'hex', color: '#22c55e', label: 'green hex' },
      { shape: 'triangle', color: '#ef4444', label: 'red triangle' },
    ],
    passIndices: [0, 1, 3],
    hint: 'Hex OR green passes.',
  },
  {
    code: 'shapes.filter(s =>\n  !(s.shape === "circle")\n)',
    shapes: [
      { shape: 'circle', color: '#60a5fa', label: 'blue circle' },
      { shape: 'square', color: '#f472b6', label: 'pink square' },
      { shape: 'circle', color: '#22c55e', label: 'green circle' },
      { shape: 'diamond', color: '#a78bfa', label: 'purple diamond' },
    ],
    passIndices: [1, 3],
    hint: 'NOT circle — everything except circles.',
  },
  {
    code: 'shapes.filter((s, i) =>\n  i % 2 === 0\n)',
    shapes: [
      { shape: 'triangle', color: '#f59e0b', label: 'gold triangle' },
      { shape: 'hex', color: '#60a5fa', label: 'blue hex' },
      { shape: 'circle', color: '#22c55e', label: 'green circle' },
      { shape: 'square', color: '#f472b6', label: 'pink square' },
      { shape: 'diamond', color: '#a78bfa', label: 'purple diamond' },
    ],
    passIndices: [0, 2, 4],
    hint: 'Even indices: 0, 2, 4.',
  },
  {
    code: 'shapes\n  .filter(s => s.color !== "blue")\n  .filter(s => s.shape !== "hex")',
    shapes: [
      { shape: 'circle', color: '#60a5fa', label: 'blue circle' },
      { shape: 'hex', color: '#f472b6', label: 'pink hex' },
      { shape: 'square', color: '#22c55e', label: 'green square' },
      { shape: 'triangle', color: '#f59e0b', label: 'gold triangle' },
      { shape: 'hex', color: '#60a5fa', label: 'blue hex' },
    ],
    passIndices: [2, 3],
    hint: 'Chained filters: not blue, then not hex.',
  },
];

export default function ShapeSorterPage() {
  const router = useRouter();
  const { ageGroup, recordAnswer, addStars, incrementGamesPlayed } = useGameStore();
  const [showIntro, setShowIntro] = useState(true);
  const [index, setIndex] = useState(0);
  const [toggled, setToggled] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
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
  const isLocked = submitted || timedOut;
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

  const toggleShape = (i: number) => {
    if (isLocked) return;
    setToggled((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const handleSubmit = () => {
    if (isLocked) return;
    if (!hasStarted) { incrementGamesPlayed(); setHasStarted(true); }
    const expected = new Set(current.passIndices);
    const correct = toggled.size === expected.size && [...toggled].every((i) => expected.has(i));
    setSubmitted(true); setIsCorrect(correct);
    setScore((p) => p + (correct ? 1 : 0));
    recordAnswer(correct);
  };

  const handleNext = () => {
    if (index === total - 1) { addStars(Math.max(1, score)); setShowConfetti(true); return; }
    setIndex((p) => p + 1); setToggled(new Set()); setSubmitted(false); setIsCorrect(null); setTimedOut(false);
  };

  const handleRestart = () => {
    setIndex(0); setToggled(new Set()); setSubmitted(false); setIsCorrect(null); setTimedOut(false);
    setScore(0); setShowConfetti(false); setHasStarted(false);
  };

  const msg = useMemo(() => {
    if (score === total) return 'Perfect filtering!';
    if (score >= total - 2) return 'Great sorting!';
    return 'Nice try — keep filtering!';
  }, [score, total]);

  if (!ageGroup) return null;

  if (showIntro) {
    return (
      <AssessmentIntro
        icon="🗂️"
        title="Shape Sorter"
        subtitle="Tap the shapes that pass the filter!"
        description="Each level shows a JavaScript .filter() condition and a collection of shapes. Tap every shape that matches the condition, then hit 'Check Filter'. Levels progress from simple color checks to combined AND/OR conditions, index-based filters, and chained .filter() calls."
        skills={[
          { icon: '🗂️', label: 'Array filtering' },
          { icon: '🔍', label: 'Condition evaluation' },
          { icon: '🔗', label: 'Chained methods' },
          { icon: '💻', label: 'JavaScript .filter()' },
        ]}
        totalQuestions={total}
        timePerQuestion={timePerQuestion}
        color="#06b6d4"
        onStart={() => setShowIntro(false)}
        onBack={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative">
      <FloatingShapes />
      <Confetti show={showConfetti} />

      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 mb-5 sm:mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2"><span>🗂️</span> Shape Sorter</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Tap the shapes that pass the filter!</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="glass px-4 py-2 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px] touch-target">← Back</button>
        </div>
      </motion.header>

      <section className="relative z-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-3xl p-5 sm:p-6 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-400">Level {index + 1} / {total}</span>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-cyan-200">Score: {score}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${timeLeft <= 5 ? 'bg-rose-500/20 text-rose-200' : 'bg-white/10 text-gray-300'}`}>⏱ {timeLeft}s</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
            <div className="h-full transition-all duration-500 ease-out" style={{ width: `${timeProgress}%`, background: timeLeft <= 5 ? 'linear-gradient(90deg,#fb7185,#f43f5e)' : 'linear-gradient(90deg,#22d3ee,#0891b2)' }} />
          </div>

          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 mb-4 overflow-x-auto">
            <pre className="text-xs sm:text-sm text-cyan-200 font-mono whitespace-pre">{current.code}</pre>
          </div>

          <p className="text-sm text-white font-semibold mb-3">Tap the shapes that pass the filter:</p>

          <div className="flex flex-wrap gap-3 justify-center mb-4">
            {current.shapes.map((s, i) => {
              const on = toggled.has(i);
              const isPass = current.passIndices.includes(i);
              let borderColor = on ? 'border-cyan-400' : 'border-white/10';
              if (isLocked) {
                borderColor = isPass ? 'border-emerald-400' : toggled.has(i) ? 'border-red-400' : 'border-white/10';
              }
              return (
                <motion.button key={i} onClick={() => toggleShape(i)} disabled={isLocked}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${borderColor} ${on && !isLocked ? 'bg-cyan-500/10' : 'bg-white/5'}`}
                  whileTap={{ scale: 0.95 }}>
                  <LogicTile shape={s.shape} color={s.color} size={32} withShadow={false} />
                  <span className="text-[10px] text-gray-400">{s.label}</span>
                </motion.button>
              );
            })}
          </div>

          {!isLocked && (
            <button onClick={handleSubmit} className="btn-cosmic px-5 py-2.5 text-sm min-h-[44px] touch-target w-full sm:w-auto mb-2">
              Check Filter
            </button>
          )}

          <AnimatePresence mode="wait">
            {isLocked && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl px-4 py-3 text-sm ${isCorrect ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'}`}>
                {timedOut ? "Time\u2019s up!" : isCorrect ? 'Perfect filter!' : `Not quite — ${current.hint}`}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap gap-3">
            {index < total - 1 && isLocked && <button onClick={handleNext} className="btn-cosmic px-5 py-2.5 text-sm min-h-[44px] touch-target">Next Level →</button>}
            {index === total - 1 && isLocked && <button onClick={handleNext} className="btn-cosmic px-5 py-2.5 text-sm min-h-[44px] touch-target">Finish</button>}
            <button onClick={handleRestart} className="glass px-4 py-2.5 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px] touch-target">Restart</button>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 sm:p-6 border border-purple-500/20">
          <h2 className="text-white font-semibold text-base sm:text-lg mb-3">How .filter() works</h2>
          <div className="grid gap-3 text-sm text-gray-300">
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10"><strong className="text-cyan-300">.filter()</strong> — keeps items where the condition is true.</div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10"><strong className="text-cyan-300">=== vs !==</strong> — strict equal vs not equal.</div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10"><strong className="text-cyan-300">&& and ||</strong> — combine conditions: AND / OR.</div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10"><strong className="text-white">Chaining</strong> — multiple .filter() calls narrow results further.</div>
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
