'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';

interface Shape {
  id: number;
  type: 'square' | 'triangle' | 'circle' | 'star' | 'hexagon';
  color: string;
  rotation: number;
  scale: number;
  flipped: boolean;
}

interface SpatialPuzzle {
  target: Shape;
  options: Shape[];
  correctIndex: number;
}

const colors = ['#ec4899', '#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#fbbf24'];

function generateShapesSVG(shape: Shape, size: number = 80) {
  const { type, color } = shape;
  
  switch (type) {
    case 'square':
      return (
        <rect
          x={size * 0.15}
          y={size * 0.15}
          width={size * 0.7}
          height={size * 0.7}
          fill={color}
          rx={4}
        />
      );
    case 'triangle':
      return (
        <polygon
          points={`${size/2},${size*0.1} ${size*0.9},${size*0.85} ${size*0.1},${size*0.85}`}
          fill={color}
        />
      );
    case 'circle':
      return (
        <circle
          cx={size/2}
          cy={size/2}
          r={size * 0.4}
          fill={color}
        />
      );
    case 'star':
      const starPoints = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 72 - 90) * Math.PI / 180;
        const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
        starPoints.push(`${size/2 + Math.cos(outerAngle) * size * 0.4},${size/2 + Math.sin(outerAngle) * size * 0.4}`);
        starPoints.push(`${size/2 + Math.cos(innerAngle) * size * 0.2},${size/2 + Math.sin(innerAngle) * size * 0.2}`);
      }
      return <polygon points={starPoints.join(' ')} fill={color} />;
    case 'hexagon':
      const hexPoints = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 30) * Math.PI / 180;
        hexPoints.push(`${size/2 + Math.cos(angle) * size * 0.4},${size/2 + Math.sin(angle) * size * 0.4}`);
      }
      return <polygon points={hexPoints.join(' ')} fill={color} />;
  }
}

function ShapeDisplay({ shape, size = 80, showTransform = true }: { shape: Shape; size?: number; showTransform?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        transform: showTransform
          ? `rotate(${shape.rotation}deg) scale(${shape.scale}) ${shape.flipped ? 'scaleX(-1)' : ''}`
          : undefined,
      }}
    >
      {generateShapesSVG(shape, size)}
    </svg>
  );
}

function generatePuzzle(ageGroup: string, level: number): SpatialPuzzle {
  const types: Shape['type'][] = ageGroup === '4-6'
    ? ['square', 'triangle', 'circle']
    : ageGroup === '7-9'
      ? ['square', 'triangle', 'circle', 'star']
      : ['square', 'triangle', 'circle', 'star', 'hexagon'];

  const type = types[Math.floor(Math.random() * types.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  // Determine transformation complexity based on age
  const rotations = ageGroup === '4-6'
    ? [0, 90, 180, 270]
    : ageGroup === '7-9'
      ? [0, 45, 90, 135, 180, 225, 270, 315]
      : [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  const targetRotation = rotations[Math.floor(Math.random() * rotations.length)];
  const targetFlipped = ageGroup !== '4-6' && Math.random() > 0.7;
  const targetScale = 1;

  const target: Shape = {
    id: 0,
    type,
    color,
    rotation: targetRotation,
    scale: targetScale,
    flipped: targetFlipped,
  };

  // Generate options (one correct, rest wrong)
  const numOptions = ageGroup === '4-6' ? 3 : 4;
  const correctIndex = Math.floor(Math.random() * numOptions);
  
  const options: Shape[] = [];
  for (let i = 0; i < numOptions; i++) {
    if (i === correctIndex) {
      options.push({ ...target, id: i });
    } else {
      // Create a wrong option with different transformation
      let wrongRotation = targetRotation;
      let wrongFlipped = targetFlipped;
      
      // Ensure it's different
      while (wrongRotation === targetRotation && wrongFlipped === targetFlipped) {
        wrongRotation = rotations[Math.floor(Math.random() * rotations.length)];
        if (ageGroup !== '4-6') {
          wrongFlipped = Math.random() > 0.5;
        }
      }
      
      options.push({
        id: i,
        type,
        color,
        rotation: wrongRotation,
        scale: 1,
        flipped: wrongFlipped,
      });
    }
  }

  return { target, options, correctIndex };
}

export default function SpatialGame() {
  const router = useRouter();
  const { ageGroup, progress, recordAnswer, addStars, levelUp, incrementGamesPlayed } = useGameStore();
  const [puzzle, setPuzzle] = useState<SpatialPuzzle | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerActive, setTimerActive] = useState(false);
  const totalRounds = 6;

  const level = progress.levelsByGame.spatial;

  const generateNewPuzzle = useCallback(() => {
    if (ageGroup) {
      setPuzzle(generatePuzzle(ageGroup, level));
      setSelected(null);
      setIsCorrect(null);
      setTimeLeft(ageGroup === '4-6' ? 20 : ageGroup === '7-9' ? 15 : 12);
      setTimerActive(true);
    }
  }, [ageGroup, level]);

  useEffect(() => {
    if (!ageGroup) {
      router.push('/');
      return;
    }
    generateNewPuzzle();
  }, [ageGroup, router, generateNewPuzzle]);

  // Timer effect
  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || selected !== null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up!
          setTimerActive(false);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, timeLeft, selected]);

  const handleTimeout = () => {
    if (puzzle && selected === null) {
      setIsCorrect(false);
      recordAnswer(false);
      incrementGamesPlayed();
      setStreak(0);

      setTimeout(() => {
        if (round < totalRounds) {
          setRound(prev => prev + 1);
          generateNewPuzzle();
        }
      }, 2000);
    }
  };

  const handleSelect = (index: number) => {
    if (selected !== null || !puzzle) return;
    
    setSelected(index);
    setTimerActive(false);
    const correct = index === puzzle.correctIndex;
    setIsCorrect(correct);
    recordAnswer(correct);
    incrementGamesPlayed();

    if (correct) {
      const timeBonus = Math.floor(timeLeft / 3);
      const streakBonus = Math.min(streak, 5);
      const points = 10 + timeBonus + streakBonus * 2;
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      setShowConfetti(true);
      addStars(1 + (timeLeft > 10 ? 1 : 0));
      setTimeout(() => setShowConfetti(false), 2000);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (round < totalRounds) {
        setRound(prev => prev + 1);
        generateNewPuzzle();
      }
    }, 2000);
  };

  const handleComplete = () => {
    if (score >= 50) {
      levelUp('spatial');
    }
    router.push('/dashboard');
  };

  if (!puzzle) return null;

  const gameComplete = round > totalRounds || (round === totalRounds && isCorrect !== null);
  const timerPercentage = (timeLeft / (ageGroup === '4-6' ? 20 : ageGroup === '7-9' ? 15 : 12)) * 100;

  return (
    <main className="min-h-screen p-6 md:p-10 relative">
      <FloatingShapes />
      <Confetti show={showConfetti} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-8"
      >
        <div className="flex items-center justify-between">
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="glass px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-colors"
            whileHover={{ scale: 1.05, x: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back
          </motion.button>

          <div className="flex items-center gap-6">
            <div className="glass px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-gray-400">Round</div>
              <div className="text-lg font-bold text-white">{Math.min(round, totalRounds)}/{totalRounds}</div>
            </div>
            <div className="glass px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-gray-400">Score</div>
              <div className="text-lg font-bold text-yellow-400">⭐ {score}</div>
            </div>
            <div className="glass px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-gray-400">Streak</div>
              <div className="text-lg font-bold text-orange-400">🔥 {streak}</div>
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
            className="max-w-2xl mx-auto relative z-10"
          >
            {/* Title */}
            <motion.div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">🧊 Shape Shifter</h1>
              <p className="text-gray-400 text-lg">Find the matching shape!</p>
            </motion.div>

            {/* Timer */}
            <motion.div
              className="w-full h-3 rounded-full bg-white/10 mb-8 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: timeLeft <= 5
                    ? 'linear-gradient(90deg, #ef4444, #f97316)'
                    : 'linear-gradient(90deg, #10b981, #3b82f6)',
                  width: `${timerPercentage}%`,
                }}
                animate={{
                  width: `${timerPercentage}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>

            {/* Target Shape */}
            <motion.div
              className="glass rounded-3xl p-8 mb-8 text-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <p className="text-gray-400 mb-4">Find this shape:</p>
              <motion.div
                className="inline-flex items-center justify-center w-32 h-32 bg-white/5 rounded-2xl"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(139, 92, 246, 0.3)',
                    '0 0 40px rgba(236, 72, 153, 0.4)',
                    '0 0 20px rgba(139, 92, 246, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ShapeDisplay shape={puzzle.target} size={100} />
              </motion.div>
            </motion.div>

            {/* Options */}
            <motion.div className="text-center mb-6">
              <p className="text-gray-300 mb-4">Select the matching shape:</p>
              <div className="flex justify-center gap-6 flex-wrap">
                {puzzle.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleSelect(index)}
                    disabled={selected !== null}
                    initial={{ opacity: 0, scale: 0, rotate: -180 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
                    whileHover={selected === null ? { scale: 1.1, rotate: 5 } : {}}
                    whileTap={selected === null ? { scale: 0.9 } : {}}
                    className={`w-28 h-28 md:w-32 md:h-32 rounded-2xl flex items-center justify-center transition-all ${
                      selected === index
                        ? isCorrect
                          ? 'bg-green-500/30 border-2 border-green-400 glow-green'
                          : 'bg-red-500/30 border-2 border-red-400 shake'
                        : selected !== null && index === puzzle.correctIndex
                          ? 'bg-green-500/30 border-2 border-green-400'
                          : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                    }`}
                  >
                    <ShapeDisplay shape={option} size={80} />
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
                    {isCorrect ? '🎉 Perfect match!' : '🔄 Not quite!'}
                  </p>
                  {isCorrect && timeLeft > 10 && (
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-blue-400 mt-2"
                    >
                      ⚡ Speed bonus!
                    </motion.p>
                  )}
                </motion.div>
              )}
              {timeLeft === 0 && selected === null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <p className="text-2xl font-bold text-orange-400">⏰ Time&apos;s up!</p>
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
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-8xl mb-6 inline-block"
            >
              🧊
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
            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={() => { setRound(1); setScore(0); setStreak(0); generateNewPuzzle(); }}
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


