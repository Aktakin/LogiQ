'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import FloatingShapes from '@/components/FloatingShapes';
import Confetti from '@/components/Confetti';
import AssessmentIntro from '@/components/AssessmentIntro';
import LogicTile, { LogicShape } from '@/components/LogicTile';
import { useGameStore } from '@/store/gameStore';

type GateOp = 'AND' | 'OR' | 'NOT';

interface GateQuestion {
  leftShape: { shape: LogicShape; color: string; value: boolean };
  rightShape?: { shape: LogicShape; color: string; value: boolean };
  gate: GateOp;
  result: boolean;
  code: string;
}

const ON = '#22c55e';
const OFF = '#374151';

const questions: GateQuestion[] = [
  {
    leftShape: { shape: 'circle', color: ON, value: true },
    rightShape: { shape: 'circle', color: ON, value: true },
    gate: 'AND',
    result: true,
    code: 'true && true',
  },
  {
    leftShape: { shape: 'square', color: ON, value: true },
    rightShape: { shape: 'square', color: OFF, value: false },
    gate: 'AND',
    result: false,
    code: 'true && false',
  },
  {
    leftShape: { shape: 'triangle', color: OFF, value: false },
    rightShape: { shape: 'triangle', color: ON, value: true },
    gate: 'OR',
    result: true,
    code: 'false || true',
  },
  {
    leftShape: { shape: 'diamond', color: ON, value: true },
    gate: 'NOT',
    result: false,
    code: '!true',
  },
  {
    leftShape: { shape: 'hex', color: OFF, value: false },
    rightShape: { shape: 'hex', color: OFF, value: false },
    gate: 'OR',
    result: false,
    code: 'false || false',
  },
  {
    leftShape: { shape: 'circle', color: OFF, value: false },
    gate: 'NOT',
    result: true,
    code: '!false',
  },
  {
    leftShape: { shape: 'square', color: ON, value: true },
    rightShape: { shape: 'diamond', color: ON, value: true },
    gate: 'OR',
    result: true,
    code: 'true || true',
  },
  {
    leftShape: { shape: 'triangle', color: OFF, value: false },
    rightShape: { shape: 'hex', color: OFF, value: false },
    gate: 'AND',
    result: false,
    code: 'false && false',
  },
  {
    leftShape: { shape: 'diamond', color: ON, value: true },
    rightShape: { shape: 'circle', color: OFF, value: false },
    gate: 'AND',
    result: false,
    code: 'true && false',
  },
  {
    leftShape: { shape: 'hex', color: ON, value: true },
    rightShape: { shape: 'square', color: OFF, value: false },
    gate: 'OR',
    result: true,
    code: 'true || false',
  },
];

export default function TruthGatesPage() {
  const router = useRouter();
  const { ageGroup, recordAnswer, addStars, incrementGamesPlayed } = useGameStore();
  const [showIntro, setShowIntro] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const timePerQuestion = 35;
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);

  useEffect(() => {
    if (!ageGroup) router.push('/');
  }, [ageGroup, router]);

  const current = questions[index];
  const total = questions.length;
  const isLocked = selected !== null || timedOut;
  const timeProgress = (timeLeft / timePerQuestion) * 100;

  useEffect(() => {
    setTimeLeft(timePerQuestion);
    setTimedOut(false);
  }, [index]);

  useEffect(() => {
    if (isLocked || showConfetti) return;
    if (timeLeft <= 0) {
      if (!hasStarted) { incrementGamesPlayed(); setHasStarted(true); }
      setTimedOut(true);
      setIsCorrect(false);
      recordAnswer(false);
      return;
    }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, isLocked, showConfetti, hasStarted, incrementGamesPlayed, recordAnswer]);

  const handleSelect = (answer: boolean) => {
    if (isLocked) return;
    if (!hasStarted) { incrementGamesPlayed(); setHasStarted(true); }
    const correct = answer === current.result;
    setSelected(answer);
    setIsCorrect(correct);
    setScore((p) => p + (correct ? 1 : 0));
    recordAnswer(correct);
  };

  const handleNext = () => {
    if (index === total - 1) { addStars(Math.max(1, score)); setShowConfetti(true); return; }
    setIndex((p) => p + 1);
    setSelected(null);
    setIsCorrect(null);
    setTimedOut(false);
  };

  const handleRestart = () => {
    setIndex(0); setSelected(null); setIsCorrect(null); setTimedOut(false);
    setScore(0); setShowConfetti(false); setHasStarted(false);
  };

  const msg = useMemo(() => {
    if (score === total) return 'Perfect logic gates!';
    if (score >= total - 2) return 'Great boolean skills!';
    return 'Nice try — practice more!';
  }, [score, total]);

  if (!ageGroup) return null;

  if (showIntro) {
    return (
      <AssessmentIntro
        icon="⚡"
        title="Truth Gates"
        subtitle="Feed shapes through logic gates — predict ON or OFF!"
        description="Each round shows colored shapes going into a logic gate (AND, OR, or NOT). Green shapes are ON (true), gray shapes are OFF (false). Predict whether the output is ON or OFF. This teaches you the boolean operators used in every programming language."
        skills={[
          { icon: '⚡', label: 'Boolean logic' },
          { icon: '🔌', label: 'AND / OR / NOT' },
          { icon: '💻', label: 'JavaScript operators' },
          { icon: '🧠', label: 'Logical reasoning' },
        ]}
        totalQuestions={total}
        timePerQuestion={timePerQuestion}
        color="#f59e0b"
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
            <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <span>⚡</span> Truth Gates
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Feed shapes through logic gates — predict ON or OFF!</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="glass px-4 py-2 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px] touch-target">← Back</button>
        </div>
      </motion.header>

      <section className="relative z-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-3xl p-5 sm:p-6 border border-amber-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-400">Gate {index + 1} / {total}</span>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-amber-200">Score: {score}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${timeLeft <= 5 ? 'bg-rose-500/20 text-rose-200' : 'bg-white/10 text-gray-300'}`}>⏱ {timeLeft}s</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
            <div className="h-full transition-all duration-500 ease-out" style={{ width: `${timeProgress}%`, background: timeLeft <= 5 ? 'linear-gradient(90deg,#fb7185,#f43f5e)' : 'linear-gradient(90deg,#fbbf24,#f59e0b)' }} />
          </div>

          {/* Gate visual */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 mb-4">
            <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
              <div className="flex flex-col items-center gap-1">
                <LogicTile shape={current.leftShape.shape} color={current.leftShape.color} size={48} />
                <span className="text-xs text-gray-400">{current.leftShape.value ? 'ON' : 'OFF'}</span>
              </div>

              <motion.div
                className="px-3 py-2 rounded-xl text-white font-bold text-sm sm:text-base"
                style={{ backgroundColor: 'rgba(245,158,11,0.3)', border: '2px solid rgba(245,158,11,0.5)' }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {current.gate}
              </motion.div>

              {current.rightShape && (
                <div className="flex flex-col items-center gap-1">
                  <LogicTile shape={current.rightShape.shape} color={current.rightShape.color} size={48} />
                  <span className="text-xs text-gray-400">{current.rightShape.value ? 'ON' : 'OFF'}</span>
                </div>
              )}

              <span className="text-2xl text-gray-500">=</span>

              <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-white/30 flex items-center justify-center">
                {isLocked ? (
                  <div className={`w-10 h-10 rounded-full ${current.result ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                ) : (
                  <span className="text-xl text-gray-500">?</span>
                )}
              </div>
            </div>

            <div className="mt-3 text-center">
              <code className="text-xs sm:text-sm text-amber-200 bg-black/30 rounded px-2 py-1">{current.code}</code>
            </div>
          </div>

          {/* Choices */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[true, false].map((val) => {
              const isPicked = selected === val;
              const correct = val === current.result;
              return (
                <button
                  key={String(val)}
                  onClick={() => handleSelect(val)}
                  disabled={isLocked}
                  className={`p-4 rounded-2xl border transition-all min-h-[72px] flex flex-col items-center justify-center gap-2 ${
                    isPicked
                      ? correct ? 'border-emerald-400/80 bg-emerald-500/10' : 'border-red-400/80 bg-red-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${val ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                  <span className="text-sm text-white font-semibold">{val ? 'ON (true)' : 'OFF (false)'}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {isLocked && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl px-4 py-3 text-sm ${isCorrect ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'}`}>
                {timedOut ? "Time\u2019s up!" : isCorrect ? 'Correct!' : 'Not quite — check the gate logic.'}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap gap-3">
            {index < total - 1 && <button onClick={handleNext} disabled={!isLocked} className="btn-cosmic px-5 py-2.5 text-sm min-h-[44px] touch-target disabled:opacity-50">Next Gate →</button>}
            {index === total - 1 && isLocked && <button onClick={handleNext} className="btn-cosmic px-5 py-2.5 text-sm min-h-[44px] touch-target">Finish</button>}
            <button onClick={handleRestart} className="glass px-4 py-2.5 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px] touch-target">Restart</button>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 sm:p-6 border border-purple-500/20">
          <h2 className="text-white font-semibold text-base sm:text-lg mb-3">How logic gates work</h2>
          <div className="grid gap-3 text-sm text-gray-300">
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-amber-300">AND (&&)</strong> — both inputs must be ON for output to be ON.
            </div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-amber-300">OR (||)</strong> — at least one input ON means output is ON.
            </div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-amber-300">NOT (!)</strong> — flips the input: ON becomes OFF.
            </div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">JS connection:</strong> these map directly to <code className="text-xs bg-black/30 px-1 rounded">&&</code>, <code className="text-xs bg-black/30 px-1 rounded">||</code>, <code className="text-xs bg-black/30 px-1 rounded">!</code> in JavaScript.
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
