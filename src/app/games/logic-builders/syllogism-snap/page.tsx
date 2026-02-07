'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import FloatingShapes from '@/components/FloatingShapes';
import Confetti from '@/components/Confetti';
import AssessmentIntro from '@/components/AssessmentIntro';
import { useGameStore } from '@/store/gameStore';

interface SyllogismQuestion {
  statements: string[];
  question: string;
  options: string[];
  answer: string;
  ruleHint: string;
}

const questions: SyllogismQuestion[] = [
  {
    statements: ['All blips are zibs.', 'All zibs are dax.'],
    question: 'Which conclusion must be true?',
    options: ['All blips are dax.', 'Some dax are blips.', 'No blips are dax.'],
    answer: 'All blips are dax.',
    ruleHint: 'If all A are B and all B are C, then all A are C.',
  },
  {
    statements: ['No glims are snorps.', 'All snorps are blue.'],
    question: 'Which conclusion must be true?',
    options: ['No glims are blue.', 'Some glims are blue.', 'All glims are snorps.'],
    answer: 'No glims are blue.',
    ruleHint: 'If A is never B and all B are C, then A is never C.',
  },
  {
    statements: ['All flibs are yellow.', 'Some flibs are tall.'],
    question: 'Which conclusion must be true?',
    options: ['Some yellow things are tall.', 'All tall things are yellow.', 'No yellow things are tall.'],
    answer: 'Some yellow things are tall.',
    ruleHint: 'Some A are B means at least one A is also B.',
  },
  {
    statements: ['All wugs are round.', 'No round things are sharp.'],
    question: 'Which conclusion must be true?',
    options: ['No wugs are sharp.', 'Some wugs are sharp.', 'All sharp things are wugs.'],
    answer: 'No wugs are sharp.',
    ruleHint: 'If all A are B and no B are C, then no A are C.',
  },
  {
    statements: ['Some kips are green.', 'All green things are soft.'],
    question: 'Which conclusion must be true?',
    options: ['Some kips are soft.', 'All soft things are green.', 'No kips are soft.'],
    answer: 'Some kips are soft.',
    ruleHint: 'Some A are B plus all B are C implies some A are C.',
  },
];

export default function SyllogismSnapPage() {
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
    if (score === total) return 'Deduction master!';
    if (score >= total - 1) return 'Excellent logic!';
    return 'Nice work — try again to improve!';
  }, [score, total]);

  if (!ageGroup) return null;

  if (showIntro) {
    return (
      <AssessmentIntro
        icon="✅"
        title="Syllogism Snap"
        subtitle="Pick the conclusion that must be true"
        description="You'll read two simple statements using words like 'all', 'some', and 'no'. Then pick the conclusion that logically follows. These use made-up words so you have to rely on logic, not memory. This is classical deductive reasoning — the foundation of proof and argument."
        skills={[
          { icon: '✅', label: 'Deductive reasoning' },
          { icon: '🎯', label: 'Precision' },
          { icon: '📝', label: 'Quantifier logic' },
          { icon: '⚖️', label: 'Evaluating validity' },
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

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-5 sm:mb-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <span>✅</span>
              Syllogism Snap
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Pick the conclusion that must be true.
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
        <div className="glass rounded-3xl p-5 sm:p-6 border border-pink-500/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs sm:text-sm text-gray-400">
              Question {index + 1} / {total}
            </span>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-pink-200">Score: {score}</span>
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
                  : 'linear-gradient(90deg, #f472b6, #fb7185)',
              }}
            />
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 mb-4 space-y-2 text-sm text-gray-300">
            {current.statements.map((statement) => (
              <div key={statement} className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">•</span>
                <span>{statement}</span>
              </div>
            ))}
            <p className="text-sm text-white font-semibold mt-3">{current.question}</p>
          </div>

          <div className="text-xs sm:text-sm text-gray-400 mb-4">
            Hint: {current.ruleHint}
          </div>

          <div className="grid grid-cols-1 gap-3">
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
                    ? 'Correct deduction!'
                    : 'Not quite — read the statements again.'}
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
                Next Question →
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
            Syllogisms train deductive reasoning by identifying conclusions that must follow
            from given facts. They build careful, step-by-step logic.
          </p>
          <div className="grid gap-3 text-sm text-gray-300">
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">Skills trained:</strong> deduction, precision,
              reasoning with quantifiers.
            </div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">Research note:</strong> syllogistic reasoning tasks
              are widely used to assess logical validity and inference.
            </div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">Tip:</strong> restate the facts in your own words,
              then test each option.
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
