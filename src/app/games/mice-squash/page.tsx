'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';

interface Bug {
  id: number;
  x: number;
  y: number;
  type: 'ant' | 'spider' | 'roach' | 'fly';
  speed: number;
  points: number;
}

interface Coin {
  id: number;
  x: number;
  y: number;
  value: number;
  timeLeft: number;
  type: 'coin' | 'gem' | 'cheese';
}

interface Splat {
  id: number;
  x: number;
  y: number;
}

const bugTypes = {
  ant: { emoji: '🐜', speed: 2, points: 10 },
  spider: { emoji: '🕷️', speed: 1.5, points: 15 },
  roach: { emoji: '🪳', speed: 2.5, points: 8 },
  fly: { emoji: '🪰', speed: 3, points: 12 },
};

const collectibleTypes = {
  coin: { emoji: '🪙', value: 5 },
  gem: { emoji: '💎', value: 15 },
  cheese: { emoji: '🧀', value: 10 },
};

type GameState = 'menu' | 'playing' | 'gameover';

export default function MiceSquashGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();
  const gameLoopRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const lastCoinSpawnRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(5);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [collectibles, setCollectibles] = useState<Coin[]>([]);
  const [splats, setSplats] = useState<Splat[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);

  const bugIdRef = useRef(0);
  const coinIdRef = useRef(0);
  const splatIdRef = useRef(0);

  const leftZoneRef = useRef<HTMLDivElement>(null);
  const rightZoneRef = useRef<HTMLDivElement>(null);

  const spawnBug = useCallback(() => {
    const types: Array<keyof typeof bugTypes> = ['ant', 'spider', 'roach', 'fly'];
    const type = types[Math.floor(Math.random() * types.length)];
    const bugData = bugTypes[type];

    bugIdRef.current += 1;
    const newBug: Bug = {
      id: bugIdRef.current,
      x: Math.random() * 80 + 10,
      y: -10,
      type,
      speed: bugData.speed * (1 + level * 0.1),
      points: bugData.points,
    };

    setBugs((prev) => [...prev, newBug]);
  }, [level]);

  const spawnCoin = useCallback(() => {
    const types: Array<keyof typeof collectibleTypes> = ['coin', 'gem', 'cheese'];
    const type = types[Math.floor(Math.random() * types.length)];
    const coinData = collectibleTypes[type];

    coinIdRef.current += 1;
    const newCoin: Coin = {
      id: coinIdRef.current,
      x: Math.random() * 80 + 10,
      y: Math.random() * 70 + 15,
      value: coinData.value,
      timeLeft: 100,
      type,
    };

    setCollectibles((prev) => [...prev, newCoin]);
  }, []);

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    const now = Date.now();

    // Spawn bugs
    const spawnRate = Math.max(500, 1500 - level * 100);
    if (now - lastSpawnRef.current > spawnRate) {
      spawnBug();
      lastSpawnRef.current = now;
    }

    // Spawn coins
    if (now - lastCoinSpawnRef.current > 2000) {
      spawnCoin();
      lastCoinSpawnRef.current = now;
    }

    // Move bugs
    setBugs((prev) => {
      const updated: Bug[] = [];
      let escaped = 0;

      prev.forEach((bug) => {
        const newY = bug.y + bug.speed * 0.5;
        if (newY > 100) {
          escaped++;
        } else {
          updated.push({ ...bug, y: newY });
        }
      });

      if (escaped > 0) {
        setLives((l) => {
          const newLives = l - escaped;
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
      }

      return updated;
    });

    // Decay collectibles
    setCollectibles((prev) => {
      return prev
        .map((c) => ({ ...c, timeLeft: c.timeLeft - 1 }))
        .filter((c) => c.timeLeft > 0);
    });

    // Level up
    setScore((currentScore) => {
      const newLevel = Math.floor(currentScore / 200) + 1;
      if (newLevel > level) {
        setLevel(newLevel);
      }
      return currentScore;
    });

    // Clean up old splats
    setSplats((prev) => prev.filter((s) => Date.now() - s.id < 500));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, level, spawnBug, spawnCoin, score, highScore, addStars, incrementGamesPlayed]);

  useEffect(() => {
    if (gameState === 'playing') {
      lastSpawnRef.current = Date.now();
      lastCoinSpawnRef.current = Date.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  const handleLeftClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;
    e.preventDefault();

    const rect = leftZoneRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if clicked on a bug
    let hitBug = false;
    setBugs((prev) => {
      const remaining: Bug[] = [];
      prev.forEach((bug) => {
        const dist = Math.hypot(bug.x - clickX, bug.y - clickY);
        if (dist < 12 && !hitBug) {
          hitBug = true;
          setScore((s) => s + bug.points * (1 + Math.floor(combo / 5)));
          setCombo((c) => c + 1);
          recordAnswer(true);

          // Add splat
          splatIdRef.current = Date.now();
          setSplats((s) => [...s, { id: splatIdRef.current, x: bug.x, y: bug.y }]);
        } else {
          remaining.push(bug);
        }
      });
      return remaining;
    });

    if (!hitBug) {
      setCombo(0);
    }
  };

  const handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;
    e.preventDefault();

    const rect = rightZoneRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if clicked on a collectible
    setCollectibles((prev) => {
      const remaining: Coin[] = [];
      prev.forEach((coin) => {
        const dist = Math.hypot(coin.x - clickX, coin.y - clickY);
        if (dist < 15) {
          setCoins((c) => c + coin.value);
          setScore((s) => s + coin.value);
        } else {
          remaining.push(coin);
        }
      });
      return remaining;
    });
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setCoins(0);
    setLives(5);
    setLevel(1);
    setCombo(0);
    setBugs([]);
    setCollectibles([]);
    setSplats([]);
  };

  return (
    <main className="min-h-screen min-h-[100dvh] p-2 sm:p-4 relative overflow-hidden bg-gradient-to-b from-amber-950/90 via-orange-950/50 to-slate-950 select-none">
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
                <span className="text-xs text-yellow-400">🪙 {coins}</span>
              </div>
              <div className="glass px-2 sm:px-3 py-1 rounded-lg">
                <span className="text-xs text-purple-400">⭐ {score}</span>
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
                <span className="text-xs text-cyan-400">Lvl {level}</span>
              </div>
            </div>
          )}
        </div>
      </motion.header>

      <div className="max-w-5xl mx-auto relative z-10">
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
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🐜
              </motion.div>
              <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400">
                  Mice Squash
                </span>
              </h1>
              <p className="text-gray-400 mb-6 text-sm sm:text-base">
                Squash the bugs & collect the coins!
              </p>

              <div className="glass rounded-2xl p-4 sm:p-6 mb-6 max-w-md mx-auto text-left">
                <h3 className="text-white font-bold mb-3 text-center">🎮 How to Play</h3>
                <ul className="text-gray-300 text-sm space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="text-2xl">👆</span>
                    <span><strong>LEFT CLICK</strong> on the left side to squash bugs!</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-2xl">👆</span>
                    <span><strong>RIGHT CLICK</strong> on the right side to collect coins!</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-2xl">🔥</span>
                    <span>Build combos for bonus points!</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-center gap-4 mb-6">
                {Object.entries(bugTypes).map(([key, bug]) => (
                  <motion.div
                    key={key}
                    className="text-center"
                    whileHover={{ scale: 1.2, y: -5 }}
                  >
                    <div className="text-4xl">{bug.emoji}</div>
                    <div className="text-xs text-gray-400">+{bug.points}</div>
                  </motion.div>
                ))}
              </div>

              {highScore > 0 && (
                <p className="text-yellow-400 mb-4">🏆 High Score: {highScore}</p>
              )}

              <motion.button
                onClick={startGame}
                className="px-10 py-4 rounded-2xl text-xl font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 shadow-lg shadow-orange-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🎮 Start Squashing!
              </motion.button>
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
              <div className="flex gap-2 sm:gap-4">
                {/* Left Zone - Bug Squashing */}
                <div
                  ref={leftZoneRef}
                  className="flex-1 relative rounded-2xl overflow-hidden cursor-crosshair"
                  style={{
                    height: 'calc(100vh - 150px)',
                    maxHeight: 500,
                    background: 'linear-gradient(180deg, rgba(139, 69, 19, 0.3) 0%, rgba(101, 67, 33, 0.4) 100%)',
                    border: '3px solid rgba(139, 69, 19, 0.5)',
                  }}
                  onClick={handleLeftClick}
                >
                  <div className="absolute top-2 left-2 text-xs text-orange-300 font-bold bg-black/30 px-2 py-1 rounded">
                    👆 LEFT CLICK - Squash Bugs!
                  </div>

                  {/* Computer at bottom */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-4xl">
                    🖥️
                  </div>

                  {/* Bugs */}
                  {bugs.map((bug) => (
                    <motion.div
                      key={bug.id}
                      className="absolute text-3xl sm:text-4xl cursor-pointer"
                      style={{
                        left: `${bug.x}%`,
                        top: `${bug.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ 
                        scale: 1, 
                        rotate: 0,
                        y: [0, -3, 0],
                      }}
                      transition={{ 
                        scale: { duration: 0.2 },
                        y: { duration: 0.3, repeat: Infinity }
                      }}
                      whileHover={{ scale: 1.3 }}
                    >
                      {bugTypes[bug.type].emoji}
                    </motion.div>
                  ))}

                  {/* Splats */}
                  {splats.map((splat) => (
                    <motion.div
                      key={splat.id}
                      className="absolute text-2xl pointer-events-none"
                      style={{
                        left: `${splat.x}%`,
                        top: `${splat.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      💥
                    </motion.div>
                  ))}
                </div>

                {/* Right Zone - Coin Collection */}
                <div
                  ref={rightZoneRef}
                  className="flex-1 relative rounded-2xl overflow-hidden"
                  style={{
                    height: 'calc(100vh - 150px)',
                    maxHeight: 500,
                    background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.3) 100%)',
                    border: '3px solid rgba(34, 197, 94, 0.5)',
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleRightClick(e);
                  }}
                >
                  <div className="absolute top-2 left-2 text-xs text-green-300 font-bold bg-black/30 px-2 py-1 rounded">
                    👆 RIGHT CLICK - Collect Coins!
                  </div>

                  {/* Collectibles */}
                  {collectibles.map((coin) => (
                    <motion.div
                      key={coin.id}
                      className="absolute text-3xl sm:text-4xl cursor-pointer"
                      style={{
                        left: `${coin.x}%`,
                        top: `${coin.y}%`,
                        transform: 'translate(-50%, -50%)',
                        opacity: coin.timeLeft / 100,
                      }}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{ 
                        duration: 0.5,
                        repeat: Infinity,
                      }}
                      whileHover={{ scale: 1.4 }}
                    >
                      {collectibleTypes[coin.type].emoji}
                    </motion.div>
                  ))}

                  {/* Hungry bug indicator */}
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    Bugs want these! 🐜
                  </div>
                </div>
              </div>

              {/* Instructions reminder */}
              <div className="mt-3 text-center text-gray-400 text-xs">
                <span className="mr-4">🖱️ Left = Squash</span>
                <span>🖱️ Right = Collect</span>
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
              <div className="text-6xl mb-4">🐜</div>
              <h2 className="text-3xl font-bold text-red-400 mb-2">Game Over!</h2>
              <p className="text-gray-300 mb-4">The bugs got through!</p>
              
              <div className="glass rounded-xl p-4 mb-4">
                <div className="text-2xl font-bold text-yellow-400 mb-2">Score: {score}</div>
                <div className="text-sm text-gray-400">Coins: 🪙 {coins}</div>
                <div className="text-sm text-gray-400">Level: {level}</div>
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
                  onClick={startGame}
                  className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold"
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
