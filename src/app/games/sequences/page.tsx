'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';

interface Sequence {
  numbers: (number | null)[];
  missingIndex: number;
  options: number[];
  answer: number;
  type: 'add' | 'subtract' | 'multiply' | 'double' | 'square';
  hint: string;
}

function generateSequence(ageGroup: string, level: number): Sequence {
  const types = ageGroup === '4-6' 
    ? ['add'] 
    : ageGroup === '7-9'
      ? ['add', 'subtract', 'double']
      : ['add', 'subtract', 'multiply', 'double', 'square'];

  const type = types[Math.floor(Math.random() * types.length)] as Sequence['type'];
  const length = ageGroup === '4-6' ? 5 : ageGroup === '7-9' ? 6 : 7;
  
  let numbers: number[] = [];
  let hint = '';
  
  switch (type) {
    case 'add': {
      const step = ageGroup === '4-6' 
        ? Math.floor(Math.random() * 3) + 1 
        : ageGroup === '7-9'
          ? Math.floor(Math.random() * 5) + 2
          : Math.floor(Math.random() * 10) + 3;
      const start = Math.floor(Math.random() * 10) + 1;
      for (let i = 0; i < length; i++) {
        numbers.push(start + i * step);
      }
      hint = `Each number increases by ${step}`;
      break;
    }
    case 'subtract': {
      const step = Math.floor(Math.random() * 5) + 2;
      const start = 50 + Math.floor(Math.random() * 30);
      for (let i = 0; i < length; i++) {
        numbers.push(start - i * step);
      }
      hint = `Each number decreases by ${step}`;
      break;
    }
    case 'multiply': {
      const multiplier = Math.floor(Math.random() * 2) + 2;
      const start = Math.floor(Math.random() * 3) + 1;
      let current = start;
      for (let i = 0; i < length; i++) {
        numbers.push(current);
        current *= multiplier;
      }
      hint = `Each number is multiplied by ${multiplier}`;
      break;
    }
    case 'double': {
      const start = Math.floor(Math.random() * 5) + 1;
      let current = start;
      for (let i = 0; i < length; i++) {
        numbers.push(current);
        current *= 2;
      }
      hint = 'Each number doubles';
      break;
    }
    case 'square': {
      for (let i = 1; i <= length; i++) {
        numbers.push(i * i);
      }
      hint = 'These are square numbers (1², 2², 3²...)';
      break;
    }
  }

  // Pick random position to hide (not first or last for easier solving)
  const missingIndex = 1 + Math.floor(Math.random() * (length - 2));
  const answer = numbers[missingIndex];

  // Generate options
  const wrongOptions = new Set<number>();
  while (wrongOptions.size < 3) {
    const offset = (Math.floor(Math.random() * 10) - 5) || 1;
    const wrong = answer + offset;
    if (wrong !== answer && wrong > 0) {
      wrongOptions.add(wrong);
    }
  }
  const options = [answer, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);

  const displayNumbers: (number | null)[] = [...numbers];
  displayNumbers[missingIndex] = null;

  return { numbers: displayNumbers, missingIndex, options, answer, type, hint };
}

export default function SequencesGame() {
  const router = useRouter();
  const { ageGroup, progress, recordAnswer, addStars, levelUp, incrementGamesPlayed } = useGameStore();
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const totalRounds = 5;

  const level = progress.levelsByGame.sequences;

  const generateNewSequence = useCallback(() => {
    if (ageGroup) {
      setSequence(generateSequence(ageGroup, level));
      setSelected(null);
      setIsCorrect(null);
      setShowHint(false);
    }
  }, [ageGroup, level]);

  useEffect(() => {
    if (!ageGroup) {
      router.push('/');
      return;
    }
    generateNewSequence();
  }, [ageGroup, router, generateNewSequence]);

  const handleSelect = (option: number) => {
    if (selected !== null || !sequence) return;
    
    setSelected(option);
    const correct = option === sequence.answer;
    setIsCorrect(correct);
    recordAnswer(correct);
    incrementGamesPlayed();

    if (correct) {
      const hintPenalty = showHint ? 5 : 0;
      const streakBonus = Math.min(streak, 5);
      const points = Math.max(5, 15 - hintPenalty + streakBonus * 2);
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      setShowConfetti(true);
      addStars(showHint ? 1 : 2);
      setTimeout(() => setShowConfetti(false), 2000);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (round < totalRounds) {
        setRound(prev => prev + 1);
        generateNewSequence();
      }
    }, 2000);
  };

  const handleComplete = () => {
    if (score >= 50) {
      levelUp('sequences');
    }
    router.push('/dashboard');
  };

  if (!sequence) return null;

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
            className="max-w-4xl mx-auto relative z-10"
          >
            {/* Title */}
            <motion.div className="text-center mb-6 sm:mb-10">
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 px-1">🔢 Sequence Master</h1>
              <p className="text-gray-400 text-sm sm:text-lg">What number comes next in the pattern?</p>
            </motion.div>

            {/* Sequence Display */}
            <motion.div className="glass rounded-3xl p-4 sm:p-8 mb-6 sm:mb-8">
              <div className="flex justify-center items-center gap-2 md:gap-4 flex-wrap">
                {sequence.numbers.map((num, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0, rotateY: 180 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ delay: index * 0.1, type: 'spring' }}
                    className={`w-14 h-14 md:w-20 md:h-20 flex items-center justify-center rounded-2xl text-2xl md:text-3xl font-bold ${
                      num === null
                        ? 'bg-blue-500/20 border-2 border-dashed border-blue-400'
                        : 'bg-white/5'
                    }`}
                  >
                    {num === null ? (
                      selected !== null ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={isCorrect ? 'text-green-400' : 'text-red-400'}
                        >
                          {selected}
                        </motion.span>
                      ) : (
                        <span className="text-blue-400">?</span>
                      )
                    ) : (
                      <span className="text-white">{num}</span>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Arrows showing direction */}
              <div className="flex justify-center mt-4 gap-2">
                {sequence.numbers.slice(0, -1).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="text-gray-500 text-2xl"
                    style={{ width: '3.5rem', textAlign: 'center' }}
                  >
                    →
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Hint Button */}
            {!showHint && selected === null && (
              <motion.div className="text-center mb-6">
                <motion.button
                  onClick={() => setShowHint(true)}
                  className="glass px-4 py-2 rounded-xl text-gray-400 hover:text-yellow-400 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  💡 Need a hint? (-5 points)
                </motion.button>
              </motion.div>
            )}

            {/* Hint Display */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-center mb-6"
                >
                  <div className="inline-block glass px-6 py-3 rounded-xl">
                    <span className="text-yellow-400">💡 {sequence.hint}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Options */}
            <motion.div className="text-center mb-6">
              <p className="text-gray-300 mb-4">Select the missing number:</p>
              <div className="flex justify-center gap-4 flex-wrap">
                {sequence.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleSelect(option)}
                    disabled={selected !== null}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={selected === null ? { scale: 1.1, y: -5 } : {}}
                    whileTap={selected === null ? { scale: 0.9 } : {}}
                    className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl text-2xl sm:text-3xl font-bold flex items-center justify-center transition-all touch-target ${
                      selected === option
                        ? isCorrect
                          ? 'bg-green-500/30 border-2 border-green-400 text-green-400 glow-green'
                          : 'bg-red-500/30 border-2 border-red-400 text-red-400 shake'
                        : selected !== null && option === sequence.answer
                          ? 'bg-green-500/30 border-2 border-green-400 text-green-400'
                          : 'bg-white/5 hover:bg-white/10 border-2 border-transparent text-white'
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
                    {isCorrect ? '🎉 Perfect!' : `The answer was ${sequence.answer}`}
                  </p>
                  {!isCorrect && (
                    <p className="text-gray-400 mt-2">{sequence.hint}</p>
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
              {score >= 50 ? '🏆' : score >= 30 ? '⭐' : '👍'}
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-4">Game Complete!</h2>
            <div className="glass rounded-2xl p-6 mb-6">
              <div className="text-5xl font-bold text-yellow-400 mb-2">⭐ {score}</div>
              <p className="text-gray-400">points earned</p>
              {score >= 50 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-400 mt-4 font-semibold"
                >
                  🎉 Level Up! You&apos;re now Level {level + 1}!
                </motion.p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
              <motion.button
                onClick={() => { setRound(1); setScore(0); setStreak(0); generateNewSequence(); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass px-5 sm:px-6 py-3 rounded-xl text-white min-h-[48px] touch-target"
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


