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
type RuleType = 'color' | 'shape';

interface Trial {
  tile: Tile;
  rule: RuleType;
}

const warmColors = ['#f59e0b', '#ef4444', '#f472b6'];
const coolColors = ['#3b82f6', '#22c55e', '#a78bfa', '#06b6d4'];

const trials: Trial[] = [
  { tile: { shape: 'circle', color: '#f59e0b' }, rule: 'color' },
  { tile: { shape: 'triangle', color: '#3b82f6' }, rule: 'color' },
  { tile: { shape: 'square', color: '#ef4444' }, rule: 'color' },
  { tile: { shape: 'diamond', color: '#22c55e' }, rule: 'color' },
  { tile: { shape: 'hex', color: '#f472b6' }, rule: 'color' },
  { tile: { shape: 'circle', color: '#3b82f6' }, rule: 'shape' },
  { tile: { shape: 'triangle', color: '#f59e0b' }, rule: 'shape' },
  { tile: { shape: 'square', color: '#22c55e' }, rule: 'shape' },
  { tile: { shape: 'diamond', color: '#ef4444' }, rule: 'shape' },
  { tile: { shape: 'hex', color: '#06b6d4' }, rule: 'shape' },
];

export default function RuleSwitchPage() {
  const router = useRouter();
  const { ageGroup, recordAnswer, addStars, incrementGamesPlayed } = useGameStore();
  const [showIntro, setShowIntro] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<'left' | 'right' | null>(null);
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

  const current = trials[index];
  const total = trials.length;
  const ruleChanged = index > 0 && trials[index - 1].rule !== current.rule;
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

  const ruleInfo = current.rule === 'color'
    ? {
        title: 'Sort by color',
        leftLabel: 'Warm colors',
        rightLabel: 'Cool colors',
        isLeft: (tile: Tile) => warmColors.includes(tile.color),
      }
    : {
        title: 'Sort by shape',
        leftLabel: 'Round (circle)',
        rightLabel: 'Corners',
        isLeft: (tile: Tile) => tile.shape === 'circle',
      };

  const handleSelect = (side: 'left' | 'right') => {
    if (isLocked) return;
    if (!hasStarted) {
      incrementGamesPlayed();
      setHasStarted(true);
    }
    const correct = ruleInfo.isLeft(current.tile) ? side === 'left' : side === 'right';
    setSelected(side);
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
    if (score === total) return 'Flexibility unlocked!';
    if (score >= total - 1) return 'Great rule switching!';
    return 'Nice work — try again to improve!';
  }, [score, total]);

  if (!ageGroup) return null;

  if (showIntro) {
    return (
      <AssessmentIntro
        icon="🔀"
        title="Rule Switch"
        subtitle="Sort cards by the rule — then adapt when it changes"
        description="You'll sort shapes into two groups based on a rule (like color or shape). Halfway through, the rule switches without warning! This trains cognitive flexibility — the ability to quickly adapt your strategy when the rules change."
        skills={[
          { icon: '🔀', label: 'Cognitive flexibility' },
          { icon: '🛑', label: 'Inhibition control' },
          { icon: '🎯', label: 'Attention switching' },
          { icon: '⚡', label: 'Quick adaptation' },
        ]}
        totalQuestions={trials.length}
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
      {showConfetti && <Confetti />}

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-5 sm:mb-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <span>🔀</span>
              Rule Switch
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Sort cards by the rule — then adapt when the rule changes.
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
        <div className="glass rounded-3xl p-5 sm:p-6 border border-amber-500/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs sm:text-sm text-gray-400">
              Trial {index + 1} / {total}
            </span>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-amber-200">Score: {score}</span>
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
                  : 'linear-gradient(90deg, #fbbf24, #f59e0b)',
              }}
            />
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-white font-semibold">{ruleInfo.title}</p>
              {ruleChanged && (
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-200">
                  Rule switched!
                </span>
              )}
            </div>
            <div className="mt-4 flex justify-center">
              <LogicTile shape={current.tile.shape} color={current.tile.color} size={56} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['left', 'right'] as const).map((side) => {
              const isPicked = selected === side;
              const correct = selected !== null && isCorrect && isPicked;
              const wrong = selected !== null && !isCorrect && isPicked;
              const label = side === 'left' ? ruleInfo.leftLabel : ruleInfo.rightLabel;
              return (
                <button
                  key={side}
                  onClick={() => handleSelect(side)}
                  className={`p-4 rounded-2xl border text-left transition-all min-h-[72px] ${
                    correct
                      ? 'border-emerald-400/80 bg-emerald-500/10 text-emerald-100'
                      : wrong
                        ? 'border-red-400/80 bg-red-500/10 text-red-100'
                        : 'border-white/10 bg-white/5 hover:border-white/30 text-gray-200'
                  }`}
                  disabled={isLocked}
                >
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-xs text-gray-400 mt-1">Tap to sort here</div>
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
                    ? 'Correct sorting!'
                    : 'Oops — remember the current rule.'}
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
                Next Trial →
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
            Rule switching is a classic cognitive flexibility task. It trains you to
            update your strategy when the environment changes.
          </p>
          <div className="grid gap-3 text-sm text-gray-300">
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">Skills trained:</strong> flexibility, inhibition,
              attention control.
            </div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">Research note:</strong> rule switching tasks are
              used to build executive function and adaptive reasoning.
            </div>
            <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
              <strong className="text-white">Tip:</strong> say the rule out loud to keep it active.
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
