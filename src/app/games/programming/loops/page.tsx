'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

interface Level {
  id: number;
  title: string;
  story: string;
  concept: string;
  targetCount: number;
  hint: string;
  starterCode: string;
  maxIterations: number;
  collectible: string;
  bonusThreshold?: number;
}

const levels: Level[] = [
  {
    id: 1,
    title: 'First Launch',
    story: '🚀 Your rocket needs exactly 5 fuel cells to reach the moon!',
    concept: 'A loop repeats code multiple times. The number controls how many times!',
    targetCount: 5,
    hint: 'for (let i = 0; i < 5; i++)',
    starterCode: 'for (let i = 0; i < ',
    maxIterations: 10,
    collectible: '⚡',
  },
  {
    id: 2,
    title: 'Star Collector',
    story: '⭐ Collect exactly 8 stars to unlock the next galaxy!',
    concept: 'The loop variable "i" counts each repetition.',
    targetCount: 8,
    hint: 'for (let i = 0; i < 8; i++)',
    starterCode: 'for (let i = 0; i < ',
    maxIterations: 15,
    collectible: '⭐',
  },
  {
    id: 3,
    title: 'Alien Eggs',
    story: '🥚 The alien queen needs 12 eggs hatched for her babies!',
    concept: 'Loops save time - instead of writing code 12 times, write it once in a loop!',
    targetCount: 12,
    hint: 'for (let i = 0; i < 12; i++)',
    starterCode: 'for (let i = 0; i < ',
    maxIterations: 20,
    collectible: '🥚',
  },
  {
    id: 4,
    title: 'Countdown Launch',
    story: '🔢 Program the countdown: Start from 10 and count down to 1!',
    concept: 'Loops can count DOWN too! Use i-- to decrease.',
    targetCount: 10,
    hint: 'for (let i = 10; i > 0; i--)',
    starterCode: 'for (let i = 10; i > 0; i--)',
    maxIterations: 15,
    collectible: '🔢',
    bonusThreshold: 10,
  },
  {
    id: 5,
    title: 'Crystal Cave',
    story: '💎 Mine exactly 15 crystals from the asteroid belt!',
    concept: 'The condition (i < 15) tells the loop WHEN to stop.',
    targetCount: 15,
    hint: 'The condition checks if we should keep going',
    starterCode: 'for (let i = 0; i < ',
    maxIterations: 25,
    collectible: '💎',
  },
  {
    id: 6,
    title: 'Double Jump',
    story: '🦘 Jump by 2s! Collect every other gem (0, 2, 4, 6, 8).',
    concept: 'Use i += 2 to skip numbers! This is called the "step".',
    targetCount: 5,
    hint: 'for (let i = 0; i < 10; i += 2)',
    starterCode: 'for (let i = 0; i < 10; i += 2)',
    maxIterations: 10,
    collectible: '💠',
    bonusThreshold: 5,
  },
  {
    id: 7,
    title: 'Planet Hopper',
    story: '🪐 Visit exactly 7 planets on your space tour!',
    concept: 'Loops are perfect for repeating actions a specific number of times.',
    targetCount: 7,
    hint: 'How many planets? Set the condition!',
    starterCode: 'for (let i = 0; i < ',
    maxIterations: 15,
    collectible: '🪐',
  },
  {
    id: 8,
    title: 'Meteor Shield',
    story: '☄️ Activate 20 shield units to survive the meteor storm!',
    concept: 'Master loops can handle big numbers easily!',
    targetCount: 20,
    hint: 'for (let i = 0; i < 20; i++)',
    starterCode: 'for (let i = 0; i < ',
    maxIterations: 30,
    collectible: '🛡️',
  },
  {
    id: 9,
    title: 'Warp Speed',
    story: '🌀 Charge the warp drive with 25 energy bursts!',
    concept: 'Loops make repetitive tasks simple and fast!',
    targetCount: 25,
    hint: 'Big number, but loops make it easy!',
    starterCode: 'for (let i = 0; i < ',
    maxIterations: 35,
    collectible: '🌀',
  },
  {
    id: 10,
    title: 'Galaxy Master',
    story: '🌌 The final challenge: Power up ALL 30 space stations!',
    concept: 'You\'ve mastered loops! They repeat code any number of times.',
    targetCount: 30,
    hint: 'You know this! Set the right number.',
    starterCode: 'for (let i = 0; i < ',
    maxIterations: 40,
    collectible: '🏆',
  },
];

export default function LoopMasterGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [collectedItems, setCollectedItems] = useState<number[]>([]);
  const [showResult, setShowResult] = useState<'success' | 'fail' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [iterationDisplay, setIterationDisplay] = useState<number | null>(null);
  const [characterPosition, setCharacterPosition] = useState(0);
  const [itemsOnPath, setItemsOnPath] = useState<number[]>([]);
  const [totalLoopCount, setTotalLoopCount] = useState(0);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const level = levels[currentLevelIndex];

  useEffect(() => {
    setUserInput('');
    setCollectedItems([]);
    setShowResult(null);
    setIterationDisplay(null);
    setCharacterPosition(0);
    setItemsOnPath([]);
    setTotalLoopCount(0);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
  }, [currentLevelIndex]);

  const parseLoopCount = useCallback((code: string): number => {
    // Handle countdown loops
    if (code.includes('i--') || code.includes('i > 0')) {
      const match = code.match(/let i = (\d+)/);
      if (match) return parseInt(match[1]);
    }
    
    // Handle step loops (i += 2)
    if (code.includes('i += 2')) {
      const match = code.match(/i < (\d+)/);
      if (match) return Math.ceil(parseInt(match[1]) / 2);
    }
    
    // Handle standard for loops
    const match = code.match(/i < (\d+)/);
    if (match) return parseInt(match[1]);
    
    // Handle <= condition
    const matchLe = code.match(/i <= (\d+)/);
    if (matchLe) return parseInt(matchLe[1]) + 1;
    
    return 0;
  }, []);

  const runLoop = useCallback(() => {
    const fullCode = level.starterCode + userInput + (level.starterCode.includes('i-') || level.starterCode.includes('i +=') ? '' : '; i++) { }');
    const count = parseLoopCount(fullCode);
    
    if (count <= 0 || count > level.maxIterations) {
      setShowResult('fail');
      return;
    }

    setIsRunning(true);
    setCollectedItems([]);
    setIterationDisplay(0);
    setCharacterPosition(0);
    setTotalLoopCount(count);
    
    // Create items on the path
    setItemsOnPath(Array.from({ length: count }, (_, i) => i));

    let currentIteration = 0;
    const runIteration = () => {
      if (currentIteration < count) {
        // Move character to next position
        setCharacterPosition(currentIteration);
        
        // Small delay, then collect item
        setTimeout(() => {
          setCollectedItems(prev => [...prev, currentIteration]);
          setItemsOnPath(prev => prev.filter(i => i !== currentIteration));
          setIterationDisplay(currentIteration + 1);
          currentIteration++;
          animationRef.current = setTimeout(runIteration, 400);
        }, 200);
      } else {
        setIsRunning(false);
        setCharacterPosition(-1); // Move character to collected area
        if (count === level.targetCount) {
          setShowResult('success');
          setShowConfetti(true);
          addStars(2);
          recordAnswer(true);
          incrementGamesPlayed();
          setTimeout(() => setShowConfetti(false), 3000);
        } else {
          setShowResult('fail');
          recordAnswer(false);
        }
      }
    };

    runIteration();
  }, [level, userInput, parseLoopCount, addStars, recordAnswer, incrementGamesPlayed]);

  const resetLevel = () => {
    setUserInput('');
    setCollectedItems([]);
    setShowResult(null);
    setIterationDisplay(null);
    setCharacterPosition(0);
    setItemsOnPath([]);
    setTotalLoopCount(0);
    setIsRunning(false);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
    } else {
      router.push('/games/programming');
    }
  };

  // Calculate display items count for path
  const displayCount = totalLoopCount || Math.min(level.targetCount, 12);

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-900 p-4 md:p-6 relative overflow-hidden">
      <Confetti show={showConfetti} />

      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="max-w-4xl mx-auto mb-4 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <motion.button
            onClick={() => router.push('/games/programming')}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:text-white transition-all text-sm backdrop-blur"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Back
          </motion.button>
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 border border-white/20">
              <span className="text-gray-300 text-sm">Level </span>
              <span className="text-white font-bold">{currentLevelIndex + 1}/{levels.length}</span>
            </div>
            <div className="bg-purple-500/20 backdrop-blur rounded-xl px-4 py-2 border border-purple-500/30">
              <span className="text-purple-300 text-sm">Target: </span>
              <span className="text-purple-200 font-bold">{level.targetCount} {level.collectible}</span>
            </div>
          </div>
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
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              🔄 Loop Launcher 🚀
            </span>
          </h1>
        </motion.div>

        {/* Level Story */}
        <motion.div
          className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-bold text-white mb-1">{level.title}</h2>
          <p className="text-xl mb-2">{level.story}</p>
          <div className="bg-cyan-500/20 rounded-xl px-3 py-1.5 inline-block">
            <span className="text-cyan-400 text-sm">💡 {level.concept}</span>
          </div>
        </motion.div>

        {/* Game Area - Collection Path */}
        <motion.div
          className="bg-slate-900/80 backdrop-blur rounded-2xl border border-purple-500/30 p-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold flex items-center gap-2">
              <span>🎮</span> Collection Path
            </h3>
            {iterationDisplay !== null && (
              <motion.div
                className="bg-purple-500/30 px-3 py-1 rounded-full"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-purple-300 text-sm">
                  Loop #{iterationDisplay}
                </span>
              </motion.div>
            )}
          </div>

          {/* Animated Path */}
          <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-xl p-4 min-h-[160px] overflow-hidden">
            {/* Ground/Path line */}
            <div className="absolute bottom-10 left-16 right-16 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-full" />
            
            {/* Start/End markers */}
            <div className="absolute bottom-8 left-2 text-xs text-green-400 font-bold bg-green-500/20 px-2 py-1 rounded">START</div>
            <div className="absolute bottom-8 right-2 text-xs text-red-400 font-bold bg-red-500/20 px-2 py-1 rounded">END</div>

            {/* Items on path - evenly distributed */}
            <div className="relative h-28 mx-16">
              {/* Items and positions */}
              <div className="absolute inset-0 flex items-end justify-between">
                {Array.from({ length: displayCount }).map((_, index) => {
                  const isCollected = collectedItems.includes(index);
                  // Show item if: not collected, OR if running and still on path
                  const shouldShowItem = !isCollected && (isRunning ? itemsOnPath.includes(index) : true);
                  const isRobotHere = isRunning && characterPosition === index;
                  
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center relative"
                    >
                      {/* Robot at this position */}
                      <AnimatePresence>
                        {isRobotHere && (
                          <motion.div
                            initial={{ scale: 0, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0, y: -20 }}
                            className="absolute -top-4 text-3xl z-10"
                          >
                            <motion.div
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 0.3, repeat: Infinity }}
                            >
                              🤖
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Item */}
                      <AnimatePresence mode="wait">
                        {shouldShowItem && (
                          <motion.div
                            key={`item-${index}`}
                            initial={{ scale: 0, y: -20 }}
                            animate={{ 
                              scale: isRobotHere ? [1, 1.2, 0] : 1, 
                              y: isRobotHere ? [0, -10, -30] : 0,
                              opacity: isRobotHere ? [1, 1, 0] : 1,
                            }}
                            exit={{ scale: 0, y: -30, opacity: 0 }}
                            transition={{ duration: isRobotHere ? 0.3 : 0.2 }}
                            className="text-2xl mb-1"
                          >
                            {level.collectible}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Position number - ABOVE the line */}
                      <div className={`text-xs font-mono font-bold mb-1 ${
                        isCollected ? 'text-green-400' : 
                        isRobotHere ? 'text-yellow-400' : 
                        'text-gray-400'
                      }`}>
                        {index}
                      </div>
                      
                      {/* Position dot on path */}
                      <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                        isCollected ? 'bg-green-500 shadow-lg shadow-green-500/50' : 
                        isRobotHere ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' : 
                        'bg-purple-500'
                      }`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Collected Items Display */}
          <div className="mt-4 bg-slate-800/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">🎒 Collected Items:</span>
              <span className={`font-bold ${collectedItems.length === level.targetCount ? 'text-green-400' : 'text-white'}`}>
                {collectedItems.length} / {level.targetCount}
              </span>
            </div>
            
            {/* Collected items row */}
            <div className="flex flex-wrap gap-1 min-h-[40px] items-center">
              {collectedItems.length === 0 ? (
                <span className="text-gray-500 text-sm">Items will appear here...</span>
              ) : (
                <AnimatePresence>
                  {collectedItems.map((item, index) => (
                    <motion.span
                      key={index}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-xl"
                    >
                      {level.collectible}
                    </motion.span>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  collectedItems.length === level.targetCount 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                    : collectedItems.length > level.targetCount 
                      ? 'bg-gradient-to-r from-red-500 to-orange-400' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((collectedItems.length / level.targetCount) * 100, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Result Message */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mt-4 p-4 rounded-xl text-center ${
                  showResult === 'success' 
                    ? 'bg-green-500/20 border border-green-500/50' 
                    : 'bg-red-500/20 border border-red-500/50'
                }`}
              >
                {showResult === 'success' ? (
                  <>
                    <div className="text-3xl mb-2">🎉</div>
                    <div className="text-green-400 font-bold text-lg">Perfect Loop!</div>
                    <div className="text-green-300 text-sm">Robot collected exactly {level.targetCount} items!</div>
                    <div className="text-yellow-400 mt-2">⭐ +2 Stars!</div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl mb-2">😅</div>
                    <div className="text-red-400 font-bold">
                      {collectedItems.length > level.targetCount ? 'Too many!' : 'Not enough!'}
                    </div>
                    <div className="text-red-300 text-sm">
                      Robot got {collectedItems.length}, but needed {level.targetCount}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Code Input */}
        <motion.div
          className="bg-slate-900/80 backdrop-blur rounded-2xl border border-cyan-500/30 overflow-hidden mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-3 text-slate-400 text-sm font-mono">loop.js</span>
          </div>

          <div className="p-4">
            <div className="bg-slate-800/50 rounded-xl p-3 font-mono text-sm">
              <div className="text-gray-500 mb-1">// Program the robot&apos;s loop:</div>
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-purple-400">{level.starterCode}</span>
                {!level.starterCode.includes('i-') && !level.starterCode.includes('i +=') ? (
                  <>
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-14 px-2 py-1 bg-purple-500/20 border border-purple-500 rounded text-purple-300 text-center font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder="?"
                      disabled={isRunning}
                      maxLength={3}
                    />
                    <span className="text-gray-400">; i++) {'{'}</span>
                  </>
                ) : (
                  <span className="text-gray-400">{'{'}</span>
                )}
              </div>
              <div className="text-cyan-400 ml-4 my-1">
                robot.collect({level.collectible});
              </div>
              <div className="text-gray-400">{'}'}</div>
            </div>

            <div className="mt-2 text-sm text-gray-500">
              <span className="text-yellow-400">Hint:</span> {level.hint}
            </div>
          </div>

          {/* Buttons */}
          <div className="p-4 border-t border-slate-700 flex gap-2">
            <motion.button
              onClick={runLoop}
              disabled={isRunning || (!userInput && !level.starterCode.includes('i-') && !level.starterCode.includes('i +='))}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                isRunning
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
              }`}
              whileHover={!isRunning ? { scale: 1.02 } : {}}
              whileTap={!isRunning ? { scale: 0.98 } : {}}
            >
              {isRunning ? '🤖 Robot Running...' : '▶️ Run Loop'}
            </motion.button>

            {showResult && (
              <motion.button
                onClick={resetLevel}
                className="px-6 py-3 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                🔄
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Next Level Button */}
        {showResult === 'success' && (
          <motion.div
            className="text-center mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              onClick={nextLevel}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-600 to-cyan-600 text-white font-bold text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {currentLevelIndex < levels.length - 1 ? 'Next Mission →' : '🏆 Complete Quest!'}
            </motion.button>
          </motion.div>
        )}

        {/* Loop Anatomy */}
        <motion.div
          className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="text-white font-bold mb-2">🔬 Loop Anatomy:</h4>
          <div className="bg-slate-900/50 rounded-xl p-3 font-mono text-sm overflow-x-auto">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-purple-400">for</span>
              <span className="text-gray-400">(</span>
              <span className="px-2 py-0.5 bg-blue-500/20 rounded text-blue-400 text-xs">let i = 0</span>
              <span className="text-gray-400">;</span>
              <span className="px-2 py-0.5 bg-green-500/20 rounded text-green-400 text-xs">i &lt; 5</span>
              <span className="text-gray-400">;</span>
              <span className="px-2 py-0.5 bg-yellow-500/20 rounded text-yellow-400 text-xs">i++</span>
              <span className="text-gray-400">)</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded"></span>
                <span className="text-gray-400">Start</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded"></span>
                <span className="text-gray-400">Condition</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded"></span>
                <span className="text-gray-400">Step</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
