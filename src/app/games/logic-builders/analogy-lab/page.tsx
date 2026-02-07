'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import FloatingShapes from '@/components/FloatingShapes';
import Confetti from '@/components/Confetti';
import AssessmentIntro from '@/components/AssessmentIntro';
import LogicTile, { LogicShape } from '@/components/LogicTile';
import { useGameStore } from '@/store/gameStore';

type Tile = { shape: LogicShape; color: string };

interface AnalogyQuestion {
  a: Tile;
  b: Tile;
  c: Tile;
  options: Tile[];
  answerIndex: number;
  ruleHint: string;
}

const questions: AnalogyQuestion[] = [
  {
    a: { shape: 'circle', color: '#60a5fa' },
    b: { shape: 'square', color: '#60a5fa' },
    c: { shape: 'circle', color: '#f472b6' },
    options: [
      { shape: 'square', color: '#f472b6' },
      { shape: 'triangle', color: '#f472b6' },
      { shape: 'square', color: '#60a5fa' },
      { shape: 'circle', color: '#f472b6' },
    ],
    answerIndex: 0,
    ruleHint: 'Shape changes the same way, color stays.',
  },
  {
    a: { shape: 'triangle', color: '#f59e0b' },
    b: { shape: 'triangle', color: '#22c55e' },
    c: { shape: 'square', color: '#f59e0b' },
    options: [
      { shape: 'square', color: '#22c55e' },
      { shape: 'circle', color: '#22c55e' },
      { shape: 'square', color: '#f59e0b' },
      { shape: 'triangle', color: '#22c55e' },
    ],
    answerIndex: 0,
    ruleHint: 'Color changes, shape stays.',
  },
  {
    a: { shape: 'diamond', color: '#a78bfa' },
    b: { shape: 'hex', color: '#a78bfa' },
    c: { shape: 'diamond', color: '#ef4444' },
    options: [
      { shape: 'hex', color: '#ef4444' },
      { shape: 'circle', color: '#ef4444' },
      { shape: 'diamond', color: '#ef4444' },
      { shape: 'square', color: '#ef4444' },
    ],
    answerIndex: 0,
    ruleHint: 'Shape advances to the next in the series.',
  },
  {
    a: { shape: 'square', color: '#06b6d4' },
    b: { shape: 'circle', color: '#f472b6' },
    c: { shape: 'triangle', color: '#06b6d4' },
    options: [
      { shape: 'square', color: '#f472b6' },
      { shape: 'triangle', color: '#f472b6' },
      { shape: 'circle', color: '#06b6d4' },
      { shape: 'diamond', color: '#f472b6' },
    ],
    answerIndex: 0,
    ruleHint: 'Swap both shape and color.',
  },
  {
    a: { shape: 'circle', color: '#22c55e' },
    b: { shape: 'diamond', color: '#f59e0b' },
    c: { shape: 'triangle', color: '#22c55e' },
    options: [
      { shape: 'hex', color: '#f59e0b' },
      { shape: 'diamond', color: '#22c55e' },
      { shape: 'triangle', color: '#f59e0b' },
      { shape: 'hex', color: '#22c55e' },
    ],
    answerIndex: 0,
    ruleHint: 'Both shape and color shift together.',
  },
  {
    a: { shape: 'hex', color: '#3b82f6' },
    b: { shape: 'triangle', color: '#3b82f6' },
    c: { shape: 'hex', color: '#ef4444' },
    options: [
      { shape: 'triangle', color: '#ef4444' },
      { shape: 'square', color: '#ef4444' },
      { shape: 'triangle', color: '#3b82f6' },
      { shape: 'hex', color: '#ef4444' },
    ],
    answerIndex: 0,
    ruleHint: 'Apply the same shape change; keep the new color.',
  },
  {
    a: { shape: 'circle', color: '#f472b6' },
    b: { shape: 'triangle', color: '#22c55e' },
    c: { shape: 'square', color: '#f472b6' },
    options: [
      { shape: 'hex', color: '#22c55e' },
      { shape: 'triangle', color: '#f472b6' },
      { shape: 'circle', color: '#22c55e' },
      { shape: 'diamond', color: '#22c55e' },
    ],
    answerIndex: 0,
    ruleHint: 'Both shape and color move forward one step.',
  },
  {
    a: { shape: 'diamond', color: '#06b6d4' },
    b: { shape: 'square', color: '#f59e0b' },
    c: { shape: 'hex', color: '#06b6d4' },
    options: [
      { shape: 'triangle', color: '#f59e0b' },
      { shape: 'square', color: '#06b6d4' },
      { shape: 'hex', color: '#f59e0b' },
      { shape: 'triangle', color: '#06b6d4' },
    ],
    answerIndex: 0,
    ruleHint: 'Shape steps backward; color swaps to the pair.',
  },
  {
    a: { shape: 'circle', color: '#22c55e' },
    b: { shape: 'square', color: '#ef4444' },
    c: { shape: 'triangle', color: '#22c55e' },
    options: [
      { shape: 'diamond', color: '#ef4444' },
      { shape: 'circle', color: '#ef4444' },
      { shape: 'square', color: '#22c55e' },
      { shape: 'hex', color: '#22c55e' },
    ],
    answerIndex: 0,
    ruleHint: 'Shape advances; color switches from green to red.',
  },
  {
    a: { shape: 'square', color: '#3b82f6' },
    b: { shape: 'diamond', color: '#22c55e' },
    c: { shape: 'triangle', color: '#f59e0b' },
    options: [
      { shape: 'hex', color: '#ef4444' },
      { shape: 'circle', color: '#22c55e' },
      { shape: 'diamond', color: '#f59e0b' },
      { shape: 'square', color: '#ef4444' },
    ],
    answerIndex: 0,
    ruleHint: 'Both shape and color advance in their own sequences.',
  },
];

export default function AnalogyLabPage() {
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

  useEffect(() => {
    if (!ageGroup) {
      router.push('/');
    }
  }, [ageGroup, router]);

  const current = questions[index];
  const total = questions.length;
  const isLocked = selected !== null || timedOut;
  const timeProgress = (timeLeft / timePerQuestion) * 100;

  useEffect(() => {
    setTimeLeft(timePerQuestion);
    setTimedOut(false);
  }, [index, timePerQuestion]);

  useEffect(() => {
    if (isLocked || showConfetti) return;
    if (timeLeft <= 0) {
      if (!hasStarted) {
        incrementGamesPlayed();
        setHasStarted(true);
      }
      setTimedOut(true);
      setIsCorrect(false);
      recordAnswer(false);
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isLocked, showConfetti, hasStarted, incrementGamesPlayed, recordAnswer]);

  const handleSelect = (optionIndex: number) => {
    if (isLocked) return;
    if (!hasStarted) {
      incrementGamesPlayed();
      setHasStarted(true);
    }
    const correct = optionIndex === current.answerIndex;
    setSelected(optionIndex);
    setIsCorrect(correct);
    setScore((prev) => prev + (correct ? 1 : 0));
    recordAnswer(correct);
  };

  const handleNext = () => {
    if (index === total - 1) {
      const stars = Math.max(1, score);
      addStars(stars);
      setShowConfetti(true);
      return;
    }
    setIndex((prev) => prev + 1);
    setSelected(null);
    setIsCorrect(null);
    setTimedOut(false);
  };

  const handleRestart = () => {
    setIndex(0);
    setSelected(null);
    setIsCorrect(null);
    setTimedOut(false);
    setScore(0);
    setShowConfetti(false);
    setHasStarted(false);
  };

  const completionMessage = useMemo(() => {
    if (score === total) return 'Analogy master!';
    if (score >= total - 1) return 'Excellent mapping skills!';
    return 'Nice effort — try again to improve!';
  }, [score, total]);

  if (!ageGroup) return null;

  if (showIntro) {
    return (
      <AssessmentIntro
        icon="🔗"
        title="Analogy Lab"
        subtitle="Map relationships: A is to B as C is to ?"
        description="Each challenge shows a pair of shapes with a relationship — a change in shape, color, or both. Your job is to apply that same transformation to a new shape and pick the correct result. Later puzzles combine multiple transformations at once."
        skills={[
          { icon: '🔗', label: 'Relational mapping' },
          { icon: '🔄', label: 'Flexible thinking' },
          { icon: '🎯', label: 'Rule transfer' },
          { icon: '🧠', label: 'Problem solving' },
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

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-5 sm:mb-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <span>🔗</span>
              Analogy Lab
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Map relationships: A is to B as C is to ?
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="glass px-4 py-2 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px] touch-target"
          >
            ← Back
          </button>
        </div>
      </motion.header>

      <section className="relative z-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-3xl p-5 sm:p-6 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs sm:text-sm text-gray-400">
              Challenge {index + 1} / {total}
            </span>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-cyan-200">Score: {score}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                timeLeft <= 5 ? 'bg-rose-500/20 text-rose-200' : 'bg-white/10 text-gray-300'
              }`}>
                ⏱ {timeLeft}s
              </span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${timeProgress}%`,
                background: timeLeft <= 5
                  ? 'linear-gradient(90deg, #fb7185, #f43f5e)'
                  : 'linear-gradient(90deg, #22d3ee, #6366f1)',
              }}
            />
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 mb-4">
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              <LogicTile shape={current.a.shape} color={current.a.color} size={44} />
              <span className="text-gray-500 text-xl">→</span>
              <LogicTile shape={current.b.shape} color={current.b.color} size={44} />
              <span className="text-gray-500 text-xl">||</span>
              <LogicTile shape={current.c.shape} color={current.c.color} size={44} />
              <span className="text-gray-500 text-xl">→</span>
              <div className="w-12 h-12 rounded-2xl border border-dashed border-white/30 flex items-center justify-center">
                <span className="text-xl text-gray-500">?</span>
              </div>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-gray-400 mb-4">
            Hint: {current.ruleHint}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {current.options.map((option, optionIndex) => {
              const isPicked = selected === optionIndex;
              const correct = optionIndex === current.answerIndex;
              return (
                <button
                  key={`${option.shape}-${option.color}-${optionIndex}`}
                  onClick={() => handleSelect(optionIndex)}
                  className={`p-3 rounded-2xl border text-left transition-all min-h-[72px] ${
                    isPicked
                      ? correct
                        ? 'border-emerald-400/80 bg-emerald-500/10'
                        : 'border-red-400/80 bg-red-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                  disabled={isLocked}
                >
                  <div className="flex items-center gap-3">
                    <LogicTile
                      shape={option.shape}
                      color={option.color}
                      size={36}
                      withShadow={false}
                    />
                    <span className="text-xs text-gray-400">
                      {isLocked && correct ? 'Correct match' : 'Select'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {isLocked && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                  isCorrect ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'
                }`}
              >
                {timedOut
                  ? 'Time’s up! Try the next one.'
                  : isCorrect
                    ? 'Great mapping!'
                    : 'Not quite — think about the relationship.'}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap gap-3">
            {index < total - 1 && (
              <button
                onClick={handleNext}
                disabled={!isLocked}
                className="btn-cosmic px-5 py-2.5 text-sm min-h-[44px] touch-target disabled:opacity-50"
              >
                Next Analogy →
              </button>
            )}
            {index === total - 1 && isLocked && (
              <button
                onClick={handleNext}
                className="btn-cosmic px-5 py-2.5 text-sm min-h-[44px] touch-target"
              >
                Finish Assessment
              </button>
            )}
            <button
              onClick={handleRestart}
              className="glass px-4 py-2.5 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px] touch-target"
            >
              Restart
            </button>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 sm:p-6 border border-purple-500/20">
          <h2 className="text-white font-semibold text-base sm:text-lg mb-3">Why it helps</h2>
          <p className="text-gray-400 text-sm mb-4">
            Analogical reasoning helps you map relationships across different objects.
            It supports learning, problem solving, and transferring ideas to new situations.
          </p>
          <div className="grid gap-3 text-sm text-gray-300">
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">Skills trained:</strong> relational mapping,
              flexible thinking, rule transfer.
            </div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">Research note:</strong> analogy training is linked
              to improved problem-solving and learning transfer in children.
            </div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">Tip:</strong> describe the change from A to B, then
              apply it to C.
            </div>
          </div>

          {showConfetti && (
            <div className="mt-5 rounded-2xl bg-emerald-500/10 p-4 border border-emerald-400/30">
              <p className="text-emerald-200 text-sm font-semibold">{completionMessage}</p>
              <p className="text-emerald-100 text-xs mt-1">
                You scored {score} out of {total}. Stars earned: {Math.max(1, score)}.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-100">
                  Correct: {score}
                </span>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-rose-100">
                  Wrong: {total - score}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
