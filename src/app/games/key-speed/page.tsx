'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';

interface FallingLetter {
  id: number;
  letter: string;
  x: number;
  y: number;
  speed: number;
  points: number;
  spawnTime: number;
}

type GameState = 'menu' | 'playing' | 'gameover';
type Difficulty = 'easy' | 'medium' | 'hard';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';

export default function KeySpeedGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();
  const gameLoopRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [letters, setLetters] = useState<FallingLetter[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [totalTyped, setTotalTyped] = useState(0);
  const [correctTyped, setCorrectTyped] = useState(0);
  const [lastHit, setLastHit] = useState<{ letter: string; points: number; x: number; y: number } | null>(null);
  const [streak, setStreak] = useState(0);

  const letterIdRef = useRef(0);

  const difficultySettings = {
    easy: { spawnRate: 1500, speed: 1, chars: LETTERS.slice(0, 10) },
    medium: { spawnRate: 1000, speed: 1.5, chars: LETTERS },
    hard: { spawnRate: 700, speed: 2, chars: LETTERS + NUMBERS },
  };

  const spawnLetter = useCallback(() => {
    const settings = difficultySettings[difficulty];
    const chars = settings.chars;
    const letter = chars[Math.floor(Math.random() * chars.length)];

    letterIdRef.current += 1;
    const newLetter: FallingLetter = {
      id: letterIdRef.current,
      letter,
      x: Math.random() * 80 + 10,
      y: -5,
      speed: settings.speed * (0.8 + Math.random() * 0.4),
      points: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20,
      spawnTime: Date.now(),
    };

    setLetters((prev) => [...prev, newLetter]);
  }, [difficulty]);

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    const now = Date.now();
    const settings = difficultySettings[difficulty];

    // Spawn letters
    if (now - lastSpawnRef.current > settings.spawnRate) {
      spawnLetter();
      lastSpawnRef.current = now;
    }

    // Move letters
    setLetters((prev) => {
      const updated: FallingLetter[] = [];
      let missed = 0;

      prev.forEach((letter) => {
        const newY = letter.y + letter.speed * 0.3;
        if (newY > 105) {
          missed++;
        } else {
          updated.push({ ...letter, y: newY });
        }
      });

      if (missed > 0) {
        setLives((l) => {
          const newLives = l - missed;
          if (newLives <= 0) {
            setGameState('gameover');
            incrementGamesPlayed();
            if (score > highScore) {
              setHighScore(score);
              addStars(Math.floor(score / 100));
            }
          }
          return Math.max(0, newLives);
        });
        setCombo(0);
        setStreak(0);
      }

      return updated;
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, difficulty, spawnLetter, score, highScore, addStars, incrementGamesPlayed]);

  useEffect(() => {
    if (gameState === 'playing') {
      lastSpawnRef.current = Date.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      const key = e.key.toUpperCase();
      setTotalTyped((t) => t + 1);

      // Find matching letter (prioritize lower ones)
      setLetters((prev) => {
        const sorted = [...prev].sort((a, b) => b.y - a.y);
        const matchIndex = sorted.findIndex((l) => l.letter === key);

        if (matchIndex !== -1) {
          const matched = sorted[matchIndex];
          const now = Date.now();
          const reactionTime = now - matched.spawnTime;
          
          // Bonus points for fast reactions
          const speedBonus = Math.max(0, Math.floor((3000 - reactionTime) / 100));
          const comboBonus = Math.floor(combo / 3) * 5;
          const totalPoints = matched.points + speedBonus + comboBonus;

          setScore((s) => s + totalPoints);
          setCorrectTyped((c) => c + 1);
          setCombo((c) => {
            const newCombo = c + 1;
            setMaxCombo((m) => Math.max(m, newCombo));
            return newCombo;
          });
          setStreak((s) => s + 1);
          recordAnswer(true);

          // Show hit feedback
          setLastHit({ letter: key, points: totalPoints, x: matched.x, y: matched.y });
          setTimeout(() => setLastHit(null), 500);

          // Check for streak rewards
          if ((streak + 1) % 10 === 0) {
            setLives((l) => Math.min(5, l + 1));
          }

          return sorted.filter((_, i) => i !== matchIndex);
        } else {
          setCombo(0);
          recordAnswer(false);
          return prev;
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, combo, streak, recordAnswer]);

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameState('playing');
    setScore(0);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
    setStreak(0);
    setTotalTyped(0);
    setCorrectTyped(0);
    setLetters([]);
  };

  const accuracy = totalTyped > 0 ? Math.round((correctTyped / totalTyped) * 100) : 0;

  return (
    <main className="min-h-screen min-h-[100dvh] p-2 sm:p-4 relative overflow-hidden bg-gradient-to-b from-indigo-950/90 via-purple-950/50 to-slate-950">
      <FloatingShapes />
      <Confetti show={showConfetti} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 mb-2"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="glass px-3 py-2 rounded-xl text-gray-300 hover:text-white transition-colors text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back
          </motion.button>

          {gameState !== 'menu' && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="glass px-2 sm:px-3 py-1 rounded-lg">
                <span className="text-xs text-red-400">❤️ {lives}</span>
              </div>
              <div className="glass px-2 sm:px-3 py-1 rounded-lg">
                <span className="text-xs text-yellow-400">⭐ {score}</span>
              </div>
              {combo > 2 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="glass px-2 sm:px-3 py-1 rounded-lg"
                >
                  <span className="text-xs text-orange-400">🔥 x{combo}</span>
                </motion.div>
              )}
              <div className="glass px-2 sm:px-3 py-1 rounded-lg">
                <span className="text-xs text-green-400">🎯 {accuracy}%</span>
              </div>
            </div>
          )}
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {/* Menu */}
          {gameState === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-8"
            >
              <motion.div
                className="text-7xl sm:text-9xl mb-4"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ⌨️
              </motion.div>
              <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                  Key Speed
                </span>
              </h1>
              <p className="text-gray-400 mb-6 text-sm sm:text-base">
                Type the falling letters as fast as you can!
              </p>

              <div className="glass rounded-2xl p-4 sm:p-6 mb-6 max-w-md mx-auto text-left">
                <h3 className="text-white font-bold mb-3 text-center">🎮 How to Play</h3>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li>⌨️ Type letters as they fall down the screen</li>
                  <li>⚡ Faster typing = more points!</li>
                  <li>🔥 Build combos for bonus points</li>
                  <li>❤️ Every 10 streak = extra life!</li>
                </ul>
              </div>

              <div className="text-white font-bold mb-4">Choose Difficulty:</div>
              
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                <motion.button
                  onClick={() => startGame('easy')}
                  className="px-6 py-4 rounded-xl bg-green-500/30 border-2 border-green-500 text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-2xl mb-1">🌱</div>
                  <div className="font-bold">Easy</div>
                  <div className="text-xs text-green-300">A-J only</div>
                </motion.button>
                
                <motion.button
                  onClick={() => startGame('medium')}
                  className="px-6 py-4 rounded-xl bg-yellow-500/30 border-2 border-yellow-500 text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-2xl mb-1">🔥</div>
                  <div className="font-bold">Medium</div>
                  <div className="text-xs text-yellow-300">A-Z letters</div>
                </motion.button>
                
                <motion.button
                  onClick={() => startGame('hard')}
                  className="px-6 py-4 rounded-xl bg-red-500/30 border-2 border-red-500 text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-2xl mb-1">💀</div>
                  <div className="font-bold">Hard</div>
                  <div className="text-xs text-red-300">A-Z + 0-9</div>
                </motion.button>
              </div>

              {highScore > 0 && (
                <p className="text-yellow-400">🏆 High Score: {highScore}</p>
              )}
            </motion.div>
          )}

          {/* Game */}
          {gameState === 'playing' && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Game Area */}
              <div
                className="relative mx-auto rounded-2xl overflow-hidden"
                style={{
                  height: 'calc(100vh - 140px)',
                  maxHeight: 550,
                  background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.8) 0%, rgba(55, 48, 107, 0.6) 100%)',
                  border: '3px solid rgba(139, 92, 246, 0.5)',
                }}
              >
                {/* Keyboard hint at bottom */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                  <div className="text-6xl mb-2">⌨️</div>
                  <p className="text-gray-400 text-sm">Type the letters!</p>
                </div>

                {/* Falling Letters */}
                {letters.map((letter) => (
                  <motion.div
                    key={letter.id}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: `${letter.x}%`,
                      top: `${letter.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                  >
                    <div
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${
                          letter.y < 30 ? '#22c55e' : letter.y < 60 ? '#eab308' : '#ef4444'
                        }80, ${
                          letter.y < 30 ? '#16a34a' : letter.y < 60 ? '#ca8a04' : '#dc2626'
                        }60)`,
                        border: `3px solid ${
                          letter.y < 30 ? '#22c55e' : letter.y < 60 ? '#eab308' : '#ef4444'
                        }`,
                        boxShadow: `0 0 20px ${
                          letter.y < 30 ? '#22c55e' : letter.y < 60 ? '#eab308' : '#ef4444'
                        }50`,
                      }}
                    >
                      {letter.letter}
                    </div>
                  </motion.div>
                ))}

                {/* Hit feedback */}
                <AnimatePresence>
                  {lastHit && (
                    <motion.div
                      key="hit"
                      className="absolute text-center pointer-events-none"
                      style={{
                        left: `${lastHit.x}%`,
                        top: `${lastHit.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0, y: -50 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="text-yellow-400 font-bold text-xl">+{lastHit.points}</div>
                      <div className="text-green-400 text-3xl">✓</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Danger zone indicator */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                  style={{
                    background: 'linear-gradient(0deg, rgba(239, 68, 68, 0.3) 0%, transparent 100%)',
                  }}
                />
              </div>

              {/* Stats bar */}
              <div className="mt-3 flex justify-center gap-4 text-sm">
                <span className="text-gray-400">Streak: <span className="text-white">{streak}</span></span>
                <span className="text-gray-400">Max Combo: <span className="text-orange-400">{maxCombo}</span></span>
                <span className="text-gray-400">Mode: <span className="text-purple-400 capitalize">{difficulty}</span></span>
              </div>
            </motion.div>
          )}

          {/* Game Over */}
          {gameState === 'gameover' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-3xl p-8 text-center max-w-md mx-auto"
            >
              <div className="text-6xl mb-4">⌨️</div>
              <h2 className="text-3xl font-bold text-red-400 mb-2">Game Over!</h2>
              
              <div className="glass rounded-xl p-4 mb-4 text-left">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Score:</div>
                  <div className="text-yellow-400 font-bold text-right">{score}</div>
                  
                  <div className="text-gray-400">Accuracy:</div>
                  <div className="text-green-400 font-bold text-right">{accuracy}%</div>
                  
                  <div className="text-gray-400">Max Combo:</div>
                  <div className="text-orange-400 font-bold text-right">{maxCombo}</div>
                  
                  <div className="text-gray-400">Letters Typed:</div>
                  <div className="text-blue-400 font-bold text-right">{correctTyped}</div>
                </div>
              </div>

              {score >= highScore && score > 0 && (
                <motion.p
                  className="text-green-400 font-bold mb-4"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity }}
                >
                  🏆 New High Score!
                </motion.p>
              )}

              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={() => startGame(difficulty)}
                  className="px-6 py-3 rounded-xl bg-purple-500 text-white font-bold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Play Again
                </motion.button>
                <motion.button
                  onClick={() => setGameState('menu')}
                  className="px-6 py-3 rounded-xl bg-gray-600 text-white font-bold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Menu
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
