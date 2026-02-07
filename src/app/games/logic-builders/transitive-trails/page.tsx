'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import FloatingShapes from '@/components/FloatingShapes';
import Confetti from '@/components/Confetti';
import AssessmentIntro from '@/components/AssessmentIntro';
import { useGameStore } from '@/store/gameStore';

interface TransitiveQuestion {
  context: string;
  statements: string[];
  question: string;
  options: string[];
  answer: string;
  ruleHint: string;
}

const questions: TransitiveQuestion[] = [
  {
    context: 'Racing Robots',
    statements: ['Blue robot is faster than Green robot.', 'Green robot is faster than Red robot.'],
    question: 'Which robot is fastest?',
    options: ['Blue', 'Green', 'Red'],
    answer: 'Blue',
    ruleHint: 'If A is faster than B and B is faster than C, then A is faster than C.',
  },
  {
    context: 'Stack of Blocks',
    statements: ['Yellow block is taller than Purple block.', 'Purple block is taller than Orange block.'],
    question: 'Which block is the shortest?',
    options: ['Yellow', 'Purple', 'Orange'],
    answer: 'Orange',
    ruleHint: 'Link the two comparisons to find the end of the chain.',
  },
  {
    context: 'Space Planets',
    statements: ['Zora is closer than Vexa.', 'Vexa is closer than Mira.'],
    question: 'Which planet is farthest?',
    options: ['Zora', 'Vexa', 'Mira'],
    answer: 'Mira',
    ruleHint: 'Closest is the opposite of farthest.',
  },
  {
    context: 'Candy Sizes',
    statements: ['Luna candy is bigger than Nova candy.', 'Nova candy is bigger than Echo candy.'],
    question: 'Which candy is medium-sized?',
    options: ['Luna', 'Nova', 'Echo'],
    answer: 'Nova',
    ruleHint: 'Find the item between the other two.',
  },
  {
    context: 'Animal Jumps',
    statements: ['Fox jumps higher than Cat.', 'Cat jumps higher than Bunny.'],
    question: 'Which animal jumps the least?',
    options: ['Fox', 'Cat', 'Bunny'],
    answer: 'Bunny',
    ruleHint: 'The least is at the end of the chain.',
  },
];

export default function TransitiveTrailsPage() {
  const router = useRouter();
  const { ageGroup, recordAnswer, addStars, incrementGamesPlayed } = useGameStore();
  const [showIntro, setShowIntro] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
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

  const handleSelect = (option: string) => {
    if (isLocked) return;
    if (!hasStarted) {
      incrementGamesPlayed();
      setHasStarted(true);
    }
    const correct = option === current.answer;
    setSelected(option);
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
    if (score === total) return 'Inference champion!';
    if (score >= total - 1) return 'Excellent inference!';
    return 'Nice work — try again to improve!';
  }, [score, total]);

  if (!ageGroup) return null;

  if (showIntro) {
    return (
      <AssessmentIntro
        icon="🧭"
        title="Transitive Trails"
        subtitle="Link clues together to infer what must be true"
        description="You'll read two comparison statements like 'A is faster than B' and 'B is faster than C'. Then answer a question about the hidden order. This trains your brain to chain facts together — a skill used in math, science, and everyday reasoning."
        skills={[
          { icon: '⛓️', label: 'Inference chaining' },
          { icon: '📐', label: 'Ordered reasoning' },
          { icon: '🔍', label: 'Attention to detail' },
          { icon: '🧮', label: 'Math foundations' },
        ]}
        totalQuestions={total}
        timePerQuestion={timePerQuestion}
        color="#10b981"
        onStart={() => setShowIntro(false)}
        onBack={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative">
      <FloatingShapes />
      {showConfetti && <Confetti />}

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-5 sm:mb-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <span>🧭</span>
              Transitive Trails
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Link clues together to infer what must be true.
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
        <div className="glass rounded-3xl p-5 sm:p-6 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs sm:text-sm text-gray-400">
              Puzzle {index + 1} / {total}
            </span>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-emerald-200">Score: {score}</span>
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
                  : 'linear-gradient(90deg, #34d399, #22c55e)',
              }}
            />
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 mb-4">
            <p className="text-sm text-purple-200 font-semibold mb-2">{current.context}</p>
            <div className="space-y-2 text-sm text-gray-300">
              {current.statements.map((statement) => (
                <div key={statement} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>{statement}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-white font-semibold mt-4">{current.question}</p>
          </div>

          <div className="text-xs sm:text-sm text-gray-400 mb-4">
            Hint: {current.ruleHint}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {current.options.map((option) => {
              const isPicked = selected === option;
              const correct = option === current.answer;
              return (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`p-3 rounded-2xl border text-left transition-all min-h-[64px] ${
                    isPicked
                      ? correct
                        ? 'border-emerald-400/80 bg-emerald-500/10 text-emerald-100'
                        : 'border-red-400/80 bg-red-500/10 text-red-100'
                      : 'border-white/10 bg-white/5 hover:border-white/30 text-gray-200'
                  }`}
                  disabled={isLocked}
                >
                  {option}
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
                    ? 'Correct inference!'
                    : 'Not quite — follow the chain again.'}
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
                Next Puzzle →
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

        <div className="glass rounded-3xl p-5 sm:p-6 border border-cyan-500/20">
          <h2 className="text-white font-semibold text-base sm:text-lg mb-3">Why it helps</h2>
          <p className="text-gray-400 text-sm mb-4">
            Transitive inference trains you to connect chained facts and reach a
            logical conclusion. It supports reasoning needed for math and problem solving.
          </p>
          <div className="grid gap-3 text-sm text-gray-300">
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">Skills trained:</strong> inference chaining,
              ordered reasoning, attention to relations.
            </div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">Research note:</strong> transitive reasoning is
              linked to later math achievement and relational learning.
            </div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">Tip:</strong> draw a quick mental line from first
              to last to see the order.
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
