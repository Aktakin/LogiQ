'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';

interface Pattern {
  sequence: string[];
  missing: number;
  options: string[];
  answer: string;
}

const shapes = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⭐', '💎', '🔷', '🔶', '❤️', '💜'];
const youngShapes = ['🔴', '🔵', '🟢', '🟡'];
const middleShapes = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⭐'];

function generatePattern(ageGroup: string, level: number): Pattern {
  const availableShapes = ageGroup === '4-6' 
    ? youngShapes 
    : ageGroup === '7-9' 
      ? middleShapes 
      : shapes;
  
  const patternLength = ageGroup === '4-6' 
    ? Math.min(4, 3 + Math.floor(level / 3))
    : ageGroup === '7-9'
      ? Math.min(6, 4 + Math.floor(level / 2))
      : Math.min(8, 5 + Math.floor(level / 2));

  // Generate a repeating pattern
  const basePattern: string[] = [];
  const repeatLength = ageGroup === '4-6' ? 2 : ageGroup === '7-9' ? Math.min(3, 2 + Math.floor(level / 4)) : Math.min(4, 2 + Math.floor(level / 3));
  
  for (let i = 0; i < repeatLength; i++) {
    basePattern.push(availableShapes[Math.floor(Math.random() * availableShapes.length)]);
  }

  // Create full sequence
  const sequence: string[] = [];
  for (let i = 0; i < patternLength; i++) {
    sequence.push(basePattern[i % repeatLength]);
  }

  // Pick a random position to be the missing piece
  const missing = Math.floor(Math.random() * patternLength);
  const answer = sequence[missing];

  // Generate wrong options
  const wrongOptions = availableShapes.filter(s => s !== answer);
  const shuffledWrong = wrongOptions.sort(() => Math.random() - 0.5);
  const numOptions = ageGroup === '4-6' ? 3 : 4;
  const options = [answer, ...shuffledWrong.slice(0, numOptions - 1)].sort(() => Math.random() - 0.5);

  return { sequence, missing, options, answer };
}

export default function PatternsGame() {
  const router = useRouter();
  const { ageGroup, progress, recordAnswer, addStars, levelUp, incrementGamesPlayed } = useGameStore();
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const totalRounds = 5;

  const level = progress.levelsByGame.patterns;

  const generateNewPattern = useCallback(() => {
    if (ageGroup) {
      setPattern(generatePattern(ageGroup, level));
      setSelected(null);
      setIsCorrect(null);
    }
  }, [ageGroup, level]);

  useEffect(() => {
    if (!ageGroup) {
      router.push('/');
      return;
    }
    generateNewPattern();
  }, [ageGroup, router, generateNewPattern]);

  const handleSelect = (option: string) => {
    if (selected || !pattern) return;
    
    setSelected(option);
    const correct = option === pattern.answer;
    setIsCorrect(correct);
    recordAnswer(correct);
    incrementGamesPlayed();

    if (correct) {
      const streakBonus = Math.min(streak, 5);
      const points = 10 + streakBonus * 2;
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      setShowConfetti(true);
      addStars(1 + (streak >= 3 ? 1 : 0));
      setTimeout(() => setShowConfetti(false), 2000);
    } else {
      setStreak(0);
    }

    // Move to next round after delay
    setTimeout(() => {
      if (round < totalRounds) {
        setRound(prev => prev + 1);
        generateNewPattern();
      }
    }, 1500);
  };

  const handleComplete = () => {
    if (score >= 40) {
      levelUp('patterns');
    }
    router.push('/dashboard');
  };

  if (!pattern) return null;

  const gameComplete = round > totalRounds || (round === totalRounds && isCorrect !== null);

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-6 md:p-10 relative">
      <FloatingShapes />
      <Confetti show={showConfetti} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-4 sm:mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="glass px-4 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors min-h-[44px] touch-target"
            whileHover={{ scale: 1.05, x: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back
          </motion.button>

          <div className="flex items-center gap-2 sm:gap-6">
            <div className="glass px-3 sm:px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-gray-400">Round</div>
              <div className="text-sm sm:text-lg font-bold text-white">{Math.min(round, totalRounds)}/{totalRounds}</div>
            </div>
            <div className="glass px-3 sm:px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-gray-400">Score</div>
              <div className="text-sm sm:text-lg font-bold text-yellow-400">⭐ {score}</div>
            </div>
            <div className="glass px-3 sm:px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-gray-400">Streak</div>
              <div className="text-sm sm:text-lg font-bold text-orange-400">🔥 {streak}</div>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {!gameComplete ? (
          <motion.div
            key={`round-${round}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto relative z-10"
          >
            {/* Title */}
            <motion.div
              className="text-center mb-6 sm:mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 px-1">🎨 Pattern Quest</h1>
              <p className="text-gray-400 text-sm sm:text-lg">Find the missing shape in the pattern!</p>
            </motion.div>

            {/* Pattern Display */}
            <motion.div
              className="glass rounded-3xl p-4 sm:p-8 mb-6 sm:mb-8"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <div className="flex justify-center items-center gap-3 flex-wrap">
                {pattern.sequence.map((shape, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-2xl text-4xl md:text-5xl ${
                      index === pattern.missing
                        ? 'bg-white/10 border-2 border-dashed border-purple-400'
                        : 'bg-white/5'
                    }`}
                  >
                    {index === pattern.missing ? (
                      selected ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={isCorrect ? '' : 'opacity-50'}
                        >
                          {selected}
                        </motion.span>
                      ) : (
                        <span className="text-purple-400 text-2xl">?</span>
                      )
                    ) : (
                      shape
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Options */}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-gray-300 mb-4">Choose the missing piece:</p>
              <div className="flex justify-center gap-4 flex-wrap">
                {pattern.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleSelect(option)}
                    disabled={selected !== null}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={!selected ? { scale: 1.1 } : {}}
                    whileTap={!selected ? { scale: 0.9 } : {}}
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl text-5xl flex items-center justify-center transition-all ${
                      selected === option
                        ? isCorrect
                          ? 'bg-green-500/30 border-2 border-green-400 glow-green'
                          : 'bg-red-500/30 border-2 border-red-400 shake'
                        : selected && option === pattern.answer
                          ? 'bg-green-500/30 border-2 border-green-400'
                          : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                    }`}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Feedback */}
            <AnimatePresence>
              {isCorrect !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <p className={`text-2xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? '🎉 Excellent!' : '😅 Not quite!'}
                  </p>
                  {streak >= 3 && isCorrect && (
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-yellow-400 mt-2"
                    >
                      🔥 {streak} streak bonus!
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center relative z-10"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-8xl mb-6"
            >
              {score >= 40 ? '🏆' : score >= 25 ? '⭐' : '👍'}
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-4">Game Complete!</h2>
            <div className="glass rounded-2xl p-6 mb-6">
              <div className="text-5xl font-bold text-yellow-400 mb-2">⭐ {score}</div>
              <p className="text-gray-400">points earned</p>
              {score >= 40 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-400 mt-4 font-semibold"
                >
                  🎉 Level Up! You&apos;re now Level {level + 1}!
                </motion.p>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={generateNewPattern}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass px-6 py-3 rounded-xl text-white"
              >
                🔄 Play Again
              </motion.button>
              <motion.button
                onClick={handleComplete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-cosmic px-6 py-3 rounded-xl"
              >
                <span>✓ Done</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}


