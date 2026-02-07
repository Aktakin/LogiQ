'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import FloatingShapes from '@/components/FloatingShapes';
import Confetti from '@/components/Confetti';
import AssessmentIntro from '@/components/AssessmentIntro';
import { useGameStore } from '@/store/gameStore';

interface ColorOption {
  label: string;
  hex: string;
}

interface ColorQuestion {
  code: string;
  question: string;
  options: ColorOption[];
  answerIndex: number;
  hint: string;
}

const COLORS: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  pink: '#ec4899',
  purple: '#a855f7',
  gold: '#f59e0b',
  cyan: '#06b6d4',
  orange: '#f97316',
};

const questions: ColorQuestion[] = [
  {
    code: 'let color = "red";',
    question: 'What is color?',
    options: [
      { label: 'red', hex: COLORS.red },
      { label: 'blue', hex: COLORS.blue },
      { label: 'green', hex: COLORS.green },
      { label: 'pink', hex: COLORS.pink },
    ],
    answerIndex: 0,
    hint: 'color is set to "red".',
  },
  {
    code: 'let color = "blue";\ncolor = "green";',
    question: 'What is color now?',
    options: [
      { label: 'green', hex: COLORS.green },
      { label: 'blue', hex: COLORS.blue },
      { label: 'red', hex: COLORS.red },
      { label: 'purple', hex: COLORS.purple },
    ],
    answerIndex: 0,
    hint: 'color was blue, then reassigned to green.',
  },
  {
    code: 'let a = "pink";\nlet b = a;',
    question: 'What is b?',
    options: [
      { label: 'pink', hex: COLORS.pink },
      { label: 'red', hex: COLORS.red },
      { label: 'blue', hex: COLORS.blue },
      { label: 'green', hex: COLORS.green },
    ],
    answerIndex: 0,
    hint: 'b copies the value of a — "pink".',
  },
  {
    code: 'let a = "gold";\nlet b = a;\na = "cyan";',
    question: 'What is b?',
    options: [
      { label: 'gold', hex: COLORS.gold },
      { label: 'cyan', hex: COLORS.cyan },
      { label: 'red', hex: COLORS.red },
      { label: 'blue', hex: COLORS.blue },
    ],
    answerIndex: 0,
    hint: 'b copied "gold" before a changed.',
  },
  {
    code: 'let x = 5;\nlet color;\nif (x > 3) {\n  color = "purple";\n} else {\n  color = "orange";\n}',
    question: 'What is color?',
    options: [
      { label: 'purple', hex: COLORS.purple },
      { label: 'orange', hex: COLORS.orange },
      { label: 'green', hex: COLORS.green },
      { label: 'red', hex: COLORS.red },
    ],
    answerIndex: 0,
    hint: '5 > 3 is true → purple.',
  },
  {
    code: 'let colors = ["red", "blue", "green"];\nlet pick = colors[2];',
    question: 'What is pick?',
    options: [
      { label: 'green', hex: COLORS.green },
      { label: 'red', hex: COLORS.red },
      { label: 'blue', hex: COLORS.blue },
      { label: 'pink', hex: COLORS.pink },
    ],
    answerIndex: 0,
    hint: 'Index 2 is the third item: "green".',
  },
  {
    code: 'function flip(c) {\n  if (c === "red") return "blue";\n  return "red";\n}\nlet result = flip("red");',
    question: 'What is result?',
    options: [
      { label: 'blue', hex: COLORS.blue },
      { label: 'red', hex: COLORS.red },
      { label: 'green', hex: COLORS.green },
      { label: 'gold', hex: COLORS.gold },
    ],
    answerIndex: 0,
    hint: 'flip("red") returns "blue".',
  },
  {
    code: 'let a = "red";\nlet b = "blue";\nlet temp = a;\na = b;\nb = temp;',
    question: 'What is a?',
    options: [
      { label: 'blue', hex: COLORS.blue },
      { label: 'red', hex: COLORS.red },
      { label: 'green', hex: COLORS.green },
      { label: 'purple', hex: COLORS.purple },
    ],
    answerIndex: 0,
    hint: 'Classic swap: a ends up with b\'s original value.',
  },
  {
    code: 'let a = "red";\nlet b = "blue";\nlet temp = a;\na = b;\nb = temp;',
    question: 'What is b?',
    options: [
      { label: 'red', hex: COLORS.red },
      { label: 'blue', hex: COLORS.blue },
      { label: 'gold', hex: COLORS.gold },
      { label: 'cyan', hex: COLORS.cyan },
    ],
    answerIndex: 0,
    hint: 'After the swap, b holds a\'s original value: red.',
  },
  {
    code: 'let colors = ["red","green","blue"];\nlet c = colors\n  .filter(x => x !== "green")\n  .pop();',
    question: 'What is c?',
    options: [
      { label: 'blue', hex: COLORS.blue },
      { label: 'red', hex: COLORS.red },
      { label: 'green', hex: COLORS.green },
      { label: 'gold', hex: COLORS.gold },
    ],
    answerIndex: 0,
    hint: 'Filter removes green → ["red","blue"]. pop() gives "blue".',
  },
];

export default function ColorCoderPage() {
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
    if (score === total) return 'Variable tracing pro!';
    if (score >= total - 2) return 'Great tracing skills!';
    return 'Nice try — keep tracing!';
  }, [score, total]);

  if (!ageGroup) return null;

  if (showIntro) {
    return (
      <AssessmentIntro
        icon="🎨"
        title="Color Coder"
        subtitle="Trace the variables — what color is the result?"
        description="Each level shows a JavaScript code snippet that assigns and changes color variables. Read through line by line, track what each variable holds, and pick the final color. Starts simple with one variable, then adds reassignment, copies, if/else, arrays, functions, and the classic swap pattern."
        skills={[
          { icon: '🎨', label: 'Variable tracing' },
          { icon: '📝', label: 'Assignment logic' },
          { icon: '🔀', label: 'Control flow' },
          { icon: '💻', label: 'JavaScript variables' },
        ]}
        totalQuestions={total}
        timePerQuestion={timePerQuestion}
        color="#ec4899"
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
            <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2"><span>🎨</span> Color Coder</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Trace the variables — what color is the result?</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="glass px-4 py-2 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px] touch-target">← Back</button>
        </div>
      </motion.header>

      <section className="relative z-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-3xl p-5 sm:p-6 border border-pink-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-400">Level {index + 1} / {total}</span>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-pink-200">Score: {score}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${timeLeft <= 5 ? 'bg-rose-500/20 text-rose-200' : 'bg-white/10 text-gray-300'}`}>⏱ {timeLeft}s</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
            <div className="h-full transition-all duration-500 ease-out" style={{ width: `${timeProgress}%`, background: timeLeft <= 5 ? 'linear-gradient(90deg,#fb7185,#f43f5e)' : 'linear-gradient(90deg,#ec4899,#a855f7)' }} />
          </div>

          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 mb-4 overflow-x-auto">
            <pre className="text-xs sm:text-sm text-pink-200 font-mono whitespace-pre">{current.code}</pre>
          </div>

          <p className="text-sm text-white font-semibold mb-3">{current.question}</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {current.options.map((opt, optIdx) => {
              const isPicked = selected === optIdx;
              const correct = optIdx === current.answerIndex;
              return (
                <button key={opt.label + optIdx} onClick={() => handleSelect(optIdx)} disabled={isLocked}
                  className={`p-3 rounded-2xl border transition-all min-h-[72px] flex flex-col items-center justify-center gap-2 ${
                    isPicked
                      ? correct ? 'border-emerald-400/80 bg-emerald-500/10' : 'border-red-400/80 bg-red-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <div className="w-10 h-10 rounded-full shadow-md" style={{ backgroundColor: opt.hex }} />
                  <span className="text-xs text-gray-300 font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {isLocked && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl px-4 py-3 text-sm ${isCorrect ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'}`}>
                {timedOut ? "Time\u2019s up!" : isCorrect ? 'Correct trace!' : `Not quite — ${current.hint}`}
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
          <h2 className="text-white font-semibold text-base sm:text-lg mb-3">Variable tracing tips</h2>
          <div className="grid gap-3 text-sm text-gray-300">
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10"><strong className="text-pink-300">let</strong> — creates a variable that can change.</div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10"><strong className="text-pink-300">Reassignment</strong> — <code className="text-xs bg-black/30 px-1 rounded">a = "new"</code> changes a&apos;s value.</div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10"><strong className="text-pink-300">Copy</strong> — <code className="text-xs bg-black/30 px-1 rounded">let b = a</code> copies the current value, not a link.</div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10"><strong className="text-white">Functions</strong> — follow the input, run the body, return the output.</div>
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
