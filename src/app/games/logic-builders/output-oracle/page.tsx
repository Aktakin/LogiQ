'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import FloatingShapes from '@/components/FloatingShapes';
import Confetti from '@/components/Confetti';
import AssessmentIntro from '@/components/AssessmentIntro';
import LogicTile, { LogicShape } from '@/components/LogicTile';
import { useGameStore } from '@/store/gameStore';

type ShapeResult = { shape: LogicShape; color: string };

interface OracleQuestion {
  code: string;
  options: ShapeResult[][];
  answerIndex: number;
  hint: string;
}

const questions: OracleQuestion[] = [
  {
    code: 'let shape = "circle";\nlet color = "blue";',
    options: [
      [{ shape: 'circle', color: '#60a5fa' }],
      [{ shape: 'square', color: '#60a5fa' }],
      [{ shape: 'circle', color: '#f472b6' }],
      [{ shape: 'triangle', color: '#60a5fa' }],
    ],
    answerIndex: 0,
    hint: 'shape = circle, color = blue.',
  },
  {
    code: 'let shape = "square";\nshape = "triangle";',
    options: [
      [{ shape: 'triangle', color: '#a78bfa' }],
      [{ shape: 'square', color: '#a78bfa' }],
      [{ shape: 'circle', color: '#a78bfa' }],
      [{ shape: 'diamond', color: '#a78bfa' }],
    ],
    answerIndex: 0,
    hint: 'shape gets reassigned to triangle.',
  },
  {
    code: 'let x = 3;\nif (x > 2) {\n  output("diamond");\n} else {\n  output("hex");\n}',
    options: [
      [{ shape: 'diamond', color: '#f59e0b' }],
      [{ shape: 'hex', color: '#f59e0b' }],
      [{ shape: 'diamond', color: '#ef4444' }],
      [{ shape: 'circle', color: '#f59e0b' }],
    ],
    answerIndex: 0,
    hint: '3 > 2 is true, so we take the if branch.',
  },
  {
    code: 'let shapes = ["circle", "square"];\noutput(shapes[1]);',
    options: [
      [{ shape: 'square', color: '#06b6d4' }],
      [{ shape: 'circle', color: '#06b6d4' }],
      [{ shape: 'triangle', color: '#06b6d4' }],
      [{ shape: 'diamond', color: '#06b6d4' }],
    ],
    answerIndex: 0,
    hint: 'Index 1 is the second item: "square".',
  },
  {
    code: 'for (let i = 0; i < 2; i++) {\n  output("triangle");\n}',
    options: [
      [{ shape: 'triangle', color: '#34d399' }, { shape: 'triangle', color: '#34d399' }],
      [{ shape: 'triangle', color: '#34d399' }],
      [{ shape: 'triangle', color: '#34d399' }, { shape: 'triangle', color: '#34d399' }, { shape: 'triangle', color: '#34d399' }],
      [{ shape: 'square', color: '#34d399' }, { shape: 'square', color: '#34d399' }],
    ],
    answerIndex: 0,
    hint: 'Loop runs twice → 2 triangles.',
  },
  {
    code: 'let a = "circle";\nlet b = a;\nb = "hex";\noutput(a);',
    options: [
      [{ shape: 'circle', color: '#f472b6' }],
      [{ shape: 'hex', color: '#f472b6' }],
      [{ shape: 'square', color: '#f472b6' }],
      [{ shape: 'diamond', color: '#f472b6' }],
    ],
    answerIndex: 0,
    hint: 'Changing b does not change a.',
  },
  {
    code: 'let x = 1;\nif (x === 1) {\n  output("circle");\n}\nif (x === 2) {\n  output("square");\n}',
    options: [
      [{ shape: 'circle', color: '#60a5fa' }],
      [{ shape: 'square', color: '#60a5fa' }],
      [{ shape: 'circle', color: '#60a5fa' }, { shape: 'square', color: '#60a5fa' }],
      [{ shape: 'diamond', color: '#60a5fa' }],
    ],
    answerIndex: 0,
    hint: 'Only the first if is true.',
  },
  {
    code: 'let items = [1, 2, 3];\nfor (let n of items) {\n  if (n % 2 !== 0) output("diamond");\n}',
    options: [
      [{ shape: 'diamond', color: '#a78bfa' }, { shape: 'diamond', color: '#a78bfa' }],
      [{ shape: 'diamond', color: '#a78bfa' }],
      [{ shape: 'diamond', color: '#a78bfa' }, { shape: 'diamond', color: '#a78bfa' }, { shape: 'diamond', color: '#a78bfa' }],
      [{ shape: 'hex', color: '#a78bfa' }, { shape: 'hex', color: '#a78bfa' }],
    ],
    answerIndex: 0,
    hint: 'Odd numbers: 1, 3 → 2 diamonds.',
  },
  {
    code: 'function double(s) {\n  return [s, s];\n}\nlet out = double("hex");\noutput(out);',
    options: [
      [{ shape: 'hex', color: '#22c55e' }, { shape: 'hex', color: '#22c55e' }],
      [{ shape: 'hex', color: '#22c55e' }],
      [{ shape: 'circle', color: '#22c55e' }, { shape: 'hex', color: '#22c55e' }],
      [{ shape: 'hex', color: '#22c55e' }, { shape: 'hex', color: '#22c55e' }, { shape: 'hex', color: '#22c55e' }],
    ],
    answerIndex: 0,
    hint: 'double returns an array with the shape twice.',
  },
  {
    code: 'let shapes = ["circle","square","triangle"];\nlet result = shapes.filter(\n  s => s !== "square"\n);\noutput(result);',
    options: [
      [{ shape: 'circle', color: '#06b6d4' }, { shape: 'triangle', color: '#06b6d4' }],
      [{ shape: 'square', color: '#06b6d4' }],
      [{ shape: 'circle', color: '#06b6d4' }, { shape: 'square', color: '#06b6d4' }, { shape: 'triangle', color: '#06b6d4' }],
      [{ shape: 'circle', color: '#06b6d4' }],
    ],
    answerIndex: 0,
    hint: 'filter removes "square" — circle and triangle remain.',
  },
];

export default function OutputOraclePage() {
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

  const handleSelect = (optIdx: number) => {
    if (isLocked) return;
    if (!hasStarted) { incrementGamesPlayed(); setHasStarted(true); }
    const correct = optIdx === current.answerIndex;
    setSelected(optIdx); setIsCorrect(correct);
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
    if (score === total) return 'Code reading master!';
    if (score >= total - 2) return 'Excellent prediction!';
    return 'Nice try — keep reading code!';
  }, [score, total]);

  if (!ageGroup) return null;

  if (showIntro) {
    return (
      <AssessmentIntro
        icon="🔮"
        title="Output Oracle"
        subtitle="Read the code, predict the shapes!"
        description="Each level shows a short JavaScript code snippet that produces shapes. Read through the code step by step — variables, if/else branches, loops, functions, and array methods — then pick the set of shapes it would output. A fun way to practice code reading!"
        skills={[
          { icon: '📖', label: 'Code reading' },
          { icon: '🔮', label: 'Output prediction' },
          { icon: '🔀', label: 'Control flow' },
          { icon: '💻', label: 'JavaScript concepts' },
        ]}
        totalQuestions={total}
        timePerQuestion={timePerQuestion}
        color="#8b5cf6"
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
            <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2"><span>🔮</span> Output Oracle</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Read the code, predict the shapes!</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="glass px-4 py-2 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px] touch-target">← Back</button>
        </div>
      </motion.header>

      <section className="relative z-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-3xl p-5 sm:p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-400">Level {index + 1} / {total}</span>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-purple-200">Score: {score}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${timeLeft <= 5 ? 'bg-rose-500/20 text-rose-200' : 'bg-white/10 text-gray-300'}`}>⏱ {timeLeft}s</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
            <div className="h-full transition-all duration-500 ease-out" style={{ width: `${timeProgress}%`, background: timeLeft <= 5 ? 'linear-gradient(90deg,#fb7185,#f43f5e)' : 'linear-gradient(90deg,#a855f7,#7c3aed)' }} />
          </div>

          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 mb-4 overflow-x-auto">
            <pre className="text-xs sm:text-sm text-purple-200 font-mono whitespace-pre">{current.code}</pre>
          </div>

          <p className="text-sm text-white font-semibold mb-3">What shapes does this code produce?</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {current.options.map((opt, optIdx) => {
              const isPicked = selected === optIdx;
              const correct = optIdx === current.answerIndex;
              return (
                <button key={optIdx} onClick={() => handleSelect(optIdx)} disabled={isLocked}
                  className={`p-3 rounded-2xl border transition-all min-h-[64px] flex items-center justify-center gap-2 flex-wrap ${
                    isPicked
                      ? correct ? 'border-emerald-400/80 bg-emerald-500/10' : 'border-red-400/80 bg-red-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  {opt.map((s, i) => (
                    <LogicTile key={i} shape={s.shape} color={s.color} size={32} withShadow={false} />
                  ))}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {isLocked && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl px-4 py-3 text-sm ${isCorrect ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'}`}>
                {timedOut ? "Time\u2019s up!" : isCorrect ? 'Spot on!' : `Not quite — ${current.hint}`}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap gap-3">
            {index < total - 1 && <button onClick={handleNext} disabled={!isLocked} className="btn-cosmic px-5 py-2.5 text-sm min-h-[44px] touch-target disabled:opacity-50">Next Level →</button>}
            {index === total - 1 && isLocked && <button onClick={handleNext} className="btn-cosmic px-5 py-2.5 text-sm min-h-[44px] touch-target">Finish</button>}
            <button onClick={handleRestart} className="glass px-4 py-2.5 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px] touch-target">Restart</button>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 sm:p-6 border border-cyan-500/20">
          <h2 className="text-white font-semibold text-base sm:text-lg mb-3">Code reading tips</h2>
          <div className="grid gap-3 text-sm text-gray-300">
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10"><strong className="text-purple-300">Step through</strong> — read each line top to bottom.</div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10"><strong className="text-purple-300">Variables</strong> — track what each variable holds at each step.</div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10"><strong className="text-purple-300">if/else</strong> — check the condition to decide which branch runs.</div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10"><strong className="text-white">Arrays</strong> — index 0 is first, index 1 is second, etc.</div>
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
