'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Level {
  id: number;
  name: string;
  gridSize: number; // pairs count
  cols: number;
  timeLimit?: number; // optional time limit in seconds
}

const LEVELS: Level[] = [
  { id: 1, name: 'Tiny', gridSize: 4, cols: 4 },        // 4 pairs = 8 cards (4x2)
  { id: 2, name: 'Small', gridSize: 6, cols: 4 },       // 6 pairs = 12 cards (4x3)
  { id: 3, name: 'Medium', gridSize: 8, cols: 4 },      // 8 pairs = 16 cards (4x4)
  { id: 4, name: 'Large', gridSize: 10, cols: 5 },      // 10 pairs = 20 cards (5x4)
  { id: 5, name: 'XL', gridSize: 12, cols: 6 },         // 12 pairs = 24 cards (6x4)
  { id: 6, name: 'XXL', gridSize: 15, cols: 6 },        // 15 pairs = 30 cards (6x5)
  { id: 7, name: 'Timed Easy', gridSize: 8, cols: 4, timeLimit: 60 },
  { id: 8, name: 'Timed Hard', gridSize: 12, cols: 6, timeLimit: 90 },
];

const EMOJI_SETS = {
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥝', '🍅'],
  space: ['🚀', '🛸', '🌙', '⭐', '🌎', '🪐', '☄️', '🌌', '👽', '🛰️', '🌞', '🌛', '💫', '✨', '🌠'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '⛳', '🎯', '🏆', '🥇'],
  nature: ['🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🍀', '🌴', '🌵', '🍁', '🍂', '🌿', '🌾', '🍄', '🌲'],
};

type EmojiTheme = keyof typeof EMOJI_SETS;

export default function MemoryMatchGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'won' | 'lost'>('menu');
  const [level, setLevel] = useState(1);
  const [theme, setTheme] = useState<EmojiTheme>('animals');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bestScores, setBestScores] = useState<Record<number, number>>({});

  const currentLevel = LEVELS[level - 1];

  // Initialize cards
  const initializeGame = useCallback((selectedLevel: number) => {
    const lvl = LEVELS[selectedLevel - 1];
    const emojis = EMOJI_SETS[theme].slice(0, lvl.gridSize);
    
    // Create pairs
    const cardPairs = [...emojis, ...emojis].map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
    }));
    
    // Shuffle
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }
    
    setCards(cardPairs);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTimer(lvl.timeLimit || 0);
    setLevel(selectedLevel);
    setGameState('playing');
  }, [theme]);

  // Timer countdown for timed levels
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (!currentLevel.timeLimit) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setGameState('lost');
          recordAnswer(false);
          incrementGamesPlayed();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, currentLevel.timeLimit, recordAnswer, incrementGamesPlayed]);

  // Timer count up for non-timed levels
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (currentLevel.timeLimit) return;

    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, currentLevel.timeLimit]);

  // Handle card click
  const handleCardClick = (cardId: number) => {
    if (isChecking) return;
    if (flippedCards.length >= 2) return;
    if (cards[cardId].isFlipped || cards[cardId].isMatched) return;

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);
    
    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, isFlipped: true } : card
    ));

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setIsChecking(true);

      const [first, second] = newFlipped;
      
      if (cards[first].emoji === cards[second].emoji) {
        // Match found!
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isMatched: true } 
              : card
          ));
          setMatches(prev => {
            const newMatches = prev + 1;
            if (newMatches === currentLevel.gridSize) {
              // All matched - win!
              setGameState('won');
              setShowConfetti(true);
              const stars = Math.max(1, 4 - Math.floor(moves / currentLevel.gridSize));
              addStars(stars);
              recordAnswer(true);
              incrementGamesPlayed();
              
              // Save best score
              const currentBest = bestScores[level] || Infinity;
              if (moves + 1 < currentBest) {
                setBestScores(prev => ({ ...prev, [level]: moves + 1 }));
              }
              
              setTimeout(() => setShowConfetti(false), 3000);
            }
            return newMatches;
          });
          setFlippedCards([]);
          setIsChecking(false);
        }, 500);
      } else {
        // No match - flip back
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second 
              ? { ...card, isFlipped: false } 
              : card
          ));
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  // Load best scores
  useEffect(() => {
    const saved = localStorage.getItem('memoryMatchBestScores');
    if (saved) setBestScores(JSON.parse(saved));
  }, []);

  // Save best scores
  useEffect(() => {
    if (Object.keys(bestScores).length > 0) {
      localStorage.setItem('memoryMatchBestScores', JSON.stringify(bestScores));
    }
  }, [bestScores]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-900 p-4 md:p-6 relative overflow-hidden">
      <Confetti show={showConfetti} />

      {/* Header */}
      <header className="max-w-4xl mx-auto mb-4 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:text-white transition-all text-sm backdrop-blur"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Back
          </motion.button>
          
          {gameState === 'playing' && (
            <div className="flex gap-3">
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 border border-white/20">
                <span className="text-gray-400 text-sm">Moves: </span>
                <span className="text-white font-bold">{moves}</span>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 border border-white/20">
                <span className="text-gray-400 text-sm">Matches: </span>
                <span className="text-green-400 font-bold">{matches}/{currentLevel.gridSize}</span>
              </div>
              <div className={`backdrop-blur rounded-xl px-4 py-2 border ${
                currentLevel.timeLimit && timer <= 10 
                  ? 'bg-red-500/20 border-red-500/50 animate-pulse' 
                  : 'bg-white/10 border-white/20'
              }`}>
                <span className="text-gray-400 text-sm">{currentLevel.timeLimit ? '⏱️ ' : '🕐 '}</span>
                <span className={`font-bold ${currentLevel.timeLimit && timer <= 10 ? 'text-red-400' : 'text-white'}`}>
                  {formatTime(timer)}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Title */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              🧠 Memory Match 🎴
            </span>
          </h1>
          <p className="text-purple-300/80 text-sm">
            {gameState === 'playing' 
              ? `Level ${level}: ${currentLevel.name}` 
              : 'Find all matching pairs!'
            }
          </p>
        </motion.div>

        {/* Game Area */}
        <motion.div
          className="relative rounded-2xl overflow-hidden border-2 border-purple-500/50 mx-auto bg-slate-900/50 backdrop-blur p-4"
          style={{ maxWidth: 600 }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Playing State - Card Grid */}
          {gameState === 'playing' && (
            <div 
              className="grid gap-2 md:gap-3 justify-center"
              style={{ 
                gridTemplateColumns: `repeat(${currentLevel.cols}, minmax(0, 1fr))`,
              }}
            >
              {cards.map((card) => (
                <motion.button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`
                    aspect-square rounded-xl text-3xl md:text-4xl flex items-center justify-center
                    transition-all duration-200 cursor-pointer
                    ${card.isMatched 
                      ? 'bg-green-500/30 border-2 border-green-500/50' 
                      : card.isFlipped 
                        ? 'bg-purple-600/50 border-2 border-purple-400' 
                        : 'bg-gradient-to-br from-indigo-600 to-purple-700 border-2 border-indigo-400/50 hover:border-indigo-300'
                    }
                  `}
                  style={{ minWidth: 50, minHeight: 50 }}
                  whileHover={!card.isFlipped && !card.isMatched ? { scale: 1.05 } : {}}
                  whileTap={!card.isFlipped && !card.isMatched ? { scale: 0.95 } : {}}
                  animate={{
                    rotateY: card.isFlipped || card.isMatched ? 0 : 180,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatePresence mode="wait">
                    {(card.isFlipped || card.isMatched) ? (
                      <motion.span
                        key="emoji"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                      >
                        {card.emoji}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="back"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-2xl"
                      >
                        ❓
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>
          )}

          {/* Menu State */}
          {gameState === 'menu' && (
            <div className="py-4 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-6xl mb-4"
              >
                🎴
              </motion.div>
              
              {/* Theme Selection */}
              <div className="mb-6">
                <div className="text-white font-semibold mb-2">Choose Theme:</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {(Object.keys(EMOJI_SETS) as EmojiTheme[]).map((t) => (
                    <motion.button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
                        theme === t
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {EMOJI_SETS[t][0]} {t}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Level Selection */}
              <div className="mb-6">
                <div className="text-white font-semibold mb-2">Select Level:</div>
                <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                  {LEVELS.map((lvl) => (
                    <motion.button
                      key={lvl.id}
                      onClick={() => setLevel(lvl.id)}
                      className={`
                        p-3 rounded-xl font-medium transition-all text-center
                        ${level === lvl.id
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-2 border-green-400'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20 border-2 border-transparent'
                        }
                      `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-lg font-bold">{lvl.id}</div>
                      <div className="text-xs opacity-80">{lvl.name}</div>
                      {lvl.timeLimit && <div className="text-xs text-yellow-400">⏱️ {lvl.timeLimit}s</div>}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Level Info */}
              <div className="bg-white/10 rounded-xl px-6 py-3 mb-4 inline-block">
                <div className="text-purple-300">{currentLevel.gridSize} pairs • {currentLevel.gridSize * 2} cards</div>
                {currentLevel.timeLimit && (
                  <div className="text-yellow-400 text-sm">⏱️ {currentLevel.timeLimit} second limit!</div>
                )}
                {bestScores[level] && (
                  <div className="text-green-400 text-sm">🏆 Best: {bestScores[level]} moves</div>
                )}
              </div>

              <div>
                <motion.button
                  onClick={() => initializeGame(level)}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🎮 Start Game
                </motion.button>
              </div>
            </div>
          )}

          {/* Won State */}
          {gameState === 'won' && (
            <div className="py-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <div className="text-green-400 text-2xl font-bold mb-2">Level Complete!</div>
              <div className="text-white text-lg mb-2">
                Completed in <span className="text-purple-400 font-bold">{moves}</span> moves
              </div>
              <div className="text-gray-400 mb-4">
                Time: {formatTime(timer)}
              </div>
              <div className="text-yellow-400 text-xl mb-4">
                ⭐ +{Math.max(1, 4 - Math.floor(moves / currentLevel.gridSize))} Stars!
              </div>
              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={() => initializeGame(level)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Play Again
                </motion.button>
                <motion.button
                  onClick={() => setGameState('menu')}
                  className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Change Level
                </motion.button>
              </div>
            </div>
          )}

          {/* Lost State (Timed Out) */}
          {gameState === 'lost' && (
            <div className="py-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-6xl mb-4"
              >
                ⏰
              </motion.div>
              <div className="text-red-400 text-2xl font-bold mb-2">Time&apos;s Up!</div>
              <div className="text-white text-lg mb-4">
                You found <span className="text-green-400 font-bold">{matches}</span> of {currentLevel.gridSize} pairs
              </div>
              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={() => initializeGame(level)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
                <motion.button
                  onClick={() => setGameState('menu')}
                  className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Change Level
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Instructions */}
        {gameState === 'menu' && (
          <motion.div
            className="mt-4 glass rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-white font-semibold mb-2">How to Play:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👆</span>
                <span>Click cards to flip them</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span>Find matching pairs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                <span>Remember card positions!</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}


