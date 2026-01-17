'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

interface Frog {
  id: number;
  color: string;
  emoji: string;
}

interface Level {
  id: number;
  title: string;
  description: string;
  concept: string;
  hint: string;
  initialFrogs: Frog[];
  targetFrogs: Frog[];
  starterCode: string;
  solution: string[];
}

const frogColors = {
  green: { color: '#22c55e', emoji: '🐸' },
  blue: { color: '#3b82f6', emoji: '🐸' },
  purple: { color: '#8b5cf6', emoji: '🐸' },
  pink: { color: '#ec4899', emoji: '🐸' },
  orange: { color: '#f97316', emoji: '🐸' },
  yellow: { color: '#eab308', emoji: '🐸' },
};

const createFrog = (id: number, color: keyof typeof frogColors): Frog => ({
  id,
  color,
  emoji: frogColors[color].emoji,
});

const levels: Level[] = [
  {
    id: 1,
    title: 'Push to the Pond',
    description: 'Use push() to add the green frog to the end of the array!',
    concept: 'push() adds an element to the END of an array',
    hint: 'frogs.push(greenFrog)',
    initialFrogs: [createFrog(1, 'blue'), createFrog(2, 'purple')],
    targetFrogs: [createFrog(1, 'blue'), createFrog(2, 'purple'), createFrog(3, 'green')],
    starterCode: 'frogs.push(',
    solution: ['push(greenFrog)', 'push( greenFrog )', 'push(greenFrog);'],
  },
  {
    id: 2,
    title: 'Pop Goes the Frog',
    description: 'Use pop() to remove the last frog from the array!',
    concept: 'pop() removes the LAST element from an array',
    hint: 'frogs.pop()',
    initialFrogs: [createFrog(1, 'green'), createFrog(2, 'blue'), createFrog(3, 'pink')],
    targetFrogs: [createFrog(1, 'green'), createFrog(2, 'blue')],
    starterCode: 'frogs.',
    solution: ['pop()', 'pop();'],
  },
  {
    id: 3,
    title: 'Shift Away',
    description: 'Use shift() to remove the first frog from the array!',
    concept: 'shift() removes the FIRST element from an array',
    hint: 'frogs.shift()',
    initialFrogs: [createFrog(1, 'orange'), createFrog(2, 'green'), createFrog(3, 'blue')],
    targetFrogs: [createFrog(2, 'green'), createFrog(3, 'blue')],
    starterCode: 'frogs.',
    solution: ['shift()', 'shift();'],
  },
  {
    id: 4,
    title: 'Unshift to Front',
    description: 'Use unshift() to add the yellow frog to the START of the array!',
    concept: 'unshift() adds an element to the START of an array',
    hint: 'frogs.unshift(yellowFrog)',
    initialFrogs: [createFrog(1, 'blue'), createFrog(2, 'green')],
    targetFrogs: [createFrog(3, 'yellow'), createFrog(1, 'blue'), createFrog(2, 'green')],
    starterCode: 'frogs.',
    solution: ['unshift(yellowFrog)', 'unshift( yellowFrog )', 'unshift(yellowFrog);'],
  },
  {
    id: 5,
    title: 'Reverse Hop',
    description: 'Use reverse() to flip the order of all frogs!',
    concept: 'reverse() reverses the order of elements in an array',
    hint: 'frogs.reverse()',
    initialFrogs: [createFrog(1, 'green'), createFrog(2, 'blue'), createFrog(3, 'purple')],
    targetFrogs: [createFrog(3, 'purple'), createFrog(2, 'blue'), createFrog(1, 'green')],
    starterCode: 'frogs.',
    solution: ['reverse()', 'reverse();'],
  },
  {
    id: 6,
    title: 'Slice the Pond',
    description: 'Use slice(1, 3) to get only the middle frogs!',
    concept: 'slice(start, end) returns a portion of the array',
    hint: 'frogs = frogs.slice(1, 3)',
    initialFrogs: [createFrog(1, 'pink'), createFrog(2, 'green'), createFrog(3, 'blue'), createFrog(4, 'orange')],
    targetFrogs: [createFrog(2, 'green'), createFrog(3, 'blue')],
    starterCode: 'frogs = frogs.slice(',
    solution: ['slice(1, 3)', 'slice(1,3)', 'slice( 1, 3 )', 'slice(1, 3);'],
  },
  {
    id: 7,
    title: 'Splice In',
    description: 'Use splice(1, 0, purpleFrog) to insert purple frog at position 1!',
    concept: 'splice(index, deleteCount, item) can insert items',
    hint: 'frogs.splice(1, 0, purpleFrog)',
    initialFrogs: [createFrog(1, 'green'), createFrog(2, 'blue')],
    targetFrogs: [createFrog(1, 'green'), createFrog(3, 'purple'), createFrog(2, 'blue')],
    starterCode: 'frogs.splice(',
    solution: ['splice(1, 0, purpleFrog)', 'splice(1,0,purpleFrog)', 'splice(1, 0, purpleFrog);'],
  },
  {
    id: 8,
    title: 'Filter Friends',
    description: 'Use filter() to keep only the green frogs!',
    concept: 'filter() keeps elements that pass a test',
    hint: 'frogs = frogs.filter(f => f.color === "green")',
    initialFrogs: [createFrog(1, 'green'), createFrog(2, 'blue'), createFrog(3, 'green'), createFrog(4, 'pink')],
    targetFrogs: [createFrog(1, 'green'), createFrog(3, 'green')],
    starterCode: 'frogs = frogs.filter(f => f.color === "',
    solution: ['filter(f => f.color === "green")', 'filter(f=>f.color==="green")', 'filter(frog => frog.color === "green")'],
  },
  {
    id: 9,
    title: 'Concat Crew',
    description: 'Use concat() to join two groups of frogs!',
    concept: 'concat() merges two or more arrays',
    hint: 'frogs = frogs.concat(moreFrogs)',
    initialFrogs: [createFrog(1, 'green')],
    targetFrogs: [createFrog(1, 'green'), createFrog(2, 'blue'), createFrog(3, 'purple')],
    starterCode: 'frogs = frogs.',
    solution: ['concat(moreFrogs)', 'concat( moreFrogs )', 'concat(moreFrogs);'],
  },
  {
    id: 10,
    title: 'Array Master',
    description: 'Combine methods! First reverse, then pop the last frog!',
    concept: 'You can chain array methods together',
    hint: 'frogs.reverse().pop() or frogs.reverse(); frogs.pop()',
    initialFrogs: [createFrog(1, 'green'), createFrog(2, 'blue'), createFrog(3, 'purple')],
    targetFrogs: [createFrog(3, 'purple'), createFrog(2, 'blue')],
    starterCode: 'frogs.',
    solution: ['reverse(); frogs.pop()', 'reverse().pop()', 'reverse();frogs.pop()'],
  },
];

export default function ArrayPondGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [code, setCode] = useState('');
  const [currentFrogs, setCurrentFrogs] = useState<Frog[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const level = levels[currentLevelIndex];

  const resetLevel = useCallback(() => {
    setCurrentFrogs([...level.initialFrogs]);
    setCode(level.starterCode);
    setIsCorrect(null);
    setShowHint(false);
    setAttempts(0);
  }, [level]);

  useEffect(() => {
    resetLevel();
  }, [resetLevel, currentLevelIndex]);

  const checkSolution = () => {
    setAttempts(prev => prev + 1);
    
    // Normalize user's code for comparison (remove spaces and semicolons)
    const normalizedCode = code.toLowerCase().replace(/\s/g, '').replace(/;/g, '');
    
    // Check if the code contains the key method call with correct parameters
    const isValid = level.solution.some(sol => {
      // Extract the key part of the solution (e.g., "push(greenfrog)" from various formats)
      const normalizedSol = sol.toLowerCase().replace(/\s/g, '').replace(/;/g, '');
      return normalizedCode.includes(normalizedSol);
    });

    if (isValid) {
      setCurrentFrogs([...level.targetFrogs]);
      setIsCorrect(true);
      setShowConfetti(true);
      addStars(attempts === 0 ? 3 : attempts < 3 ? 2 : 1);
      recordAnswer(true);
      incrementGamesPlayed();
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      setIsCorrect(false);
      recordAnswer(false);
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
    } else {
      router.push('/games/programming');
    }
  };

  const arraysMatch = (arr1: Frog[], arr2: Frog[]) => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((frog, i) => frog.color === arr2[i].color);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-900 via-teal-900 to-cyan-900 p-4 md:p-6 relative overflow-hidden">
      <Confetti show={showConfetti} />

      {/* Pond background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-emerald-500/10"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="max-w-4xl mx-auto mb-6 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <motion.button
            onClick={() => router.push('/games/programming')}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:text-white transition-all text-sm backdrop-blur"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Back
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 border border-white/20">
              <span className="text-gray-300 text-sm">Level </span>
              <span className="text-white font-bold">{currentLevelIndex + 1}/{levels.length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Title */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              🐸 Array Pond 🪷
            </span>
          </h1>
          <p className="text-emerald-300/80">Help the frogs reach their lily pads using array methods!</p>
        </motion.div>

        {/* Level Info */}
        <motion.div
          className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-5 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-white mb-2">{level.title}</h2>
          <p className="text-emerald-300 mb-3">{level.description}</p>
          <div className="bg-emerald-500/20 rounded-xl px-4 py-2 inline-block">
            <span className="text-emerald-400 text-sm font-mono">💡 {level.concept}</span>
          </div>
        </motion.div>

        {/* Pond Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Current Array */}
          <motion.div
            className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span>📦</span> Your Array
            </h3>
            <div className="bg-cyan-900/50 rounded-xl p-4 min-h-[100px] flex items-center justify-center gap-2 flex-wrap">
              <span className="text-cyan-400 font-mono text-lg">[</span>
              {currentFrogs.map((frog, index) => (
                <motion.div
                  key={`${frog.id}-${index}`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: index * 0.1 }}
                  className="relative"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg"
                    style={{ backgroundColor: frogColors[frog.color as keyof typeof frogColors].color + '40' }}
                  >
                    🐸
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: frogColors[frog.color as keyof typeof frogColors].color }}
                  >
                    {index}
                  </div>
                  {index < currentFrogs.length - 1 && (
                    <span className="text-cyan-400 font-mono ml-1">,</span>
                  )}
                </motion.div>
              ))}
              {currentFrogs.length === 0 && (
                <span className="text-cyan-400/50 italic">empty</span>
              )}
              <span className="text-cyan-400 font-mono text-lg">]</span>
            </div>
          </motion.div>

          {/* Target Array */}
          <motion.div
            className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span>🎯</span> Target (Lily Pads)
            </h3>
            <div className="bg-emerald-900/50 rounded-xl p-4 min-h-[100px] flex items-center justify-center gap-2 flex-wrap">
              <span className="text-emerald-400 font-mono text-lg">[</span>
              {level.targetFrogs.map((frog, index) => (
                <motion.div
                  key={`target-${frog.id}-${index}`}
                  className="relative"
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.2,
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ 
                      backgroundColor: frogColors[frog.color as keyof typeof frogColors].color + '30',
                      border: `2px dashed ${frogColors[frog.color as keyof typeof frogColors].color}`,
                    }}
                  >
                    🪷
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: frogColors[frog.color as keyof typeof frogColors].color }}
                  >
                    {index}
                  </div>
                  {index < level.targetFrogs.length - 1 && (
                    <span className="text-emerald-400 font-mono ml-1">,</span>
                  )}
                </motion.div>
              ))}
              <span className="text-emerald-400 font-mono text-lg">]</span>
            </div>
            
            {/* Match indicator */}
            {arraysMatch(currentFrogs, level.targetFrogs) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-3 text-center text-green-400 font-bold"
              >
                ✓ Arrays Match!
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Code Editor */}
        <motion.div
          className="bg-slate-900/80 backdrop-blur rounded-2xl border border-emerald-500/30 overflow-hidden mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Editor Header */}
          <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-3 text-slate-400 text-sm">script.js</span>
          </div>

          {/* Code Area */}
          <div className="p-4">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-500 select-none">1</span>
              <span className="text-slate-500">│</span>
              <span className="text-purple-400">const</span>
              <span className="text-white">frogs =</span>
              <span className="text-yellow-400">[...]</span>
              <span className="text-slate-500">// Your frog array</span>
            </div>
            <div className="flex items-start gap-2 font-mono mt-2">
              <span className="text-slate-500 select-none">2</span>
              <span className="text-slate-500">│</span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isCorrect && checkSolution()}
                disabled={isCorrect === true}
                className="flex-1 bg-slate-800/50 text-emerald-400 px-3 py-2 rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none font-mono"
                placeholder="Type your code here..."
                autoFocus
              />
            </div>
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {isCorrect !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`px-4 py-3 ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}
              >
                {isCorrect ? (
                  <span className="text-green-400">✓ Correct! The frogs reached their lily pads!</span>
                ) : (
                  <span className="text-red-400">✗ Not quite right. Try again!</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {!isCorrect ? (
            <>
              <motion.button
                onClick={checkSolution}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🚀 Run Code
              </motion.button>
              <motion.button
                onClick={resetLevel}
                className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-gray-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔄 Reset
              </motion.button>
              {!showHint && (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-emerald-400/70 hover:text-emerald-400 text-sm"
                >
                  💡 Show Hint
                </button>
              )}
            </>
          ) : (
            <motion.button
              onClick={nextLevel}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {currentLevelIndex < levels.length - 1 ? 'Next Level →' : '🏆 Complete!'}
            </motion.button>
          )}
        </div>

        {/* Hint */}
        <AnimatePresence>
          {showHint && !isCorrect && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 text-center"
            >
              <div className="inline-block bg-yellow-500/20 border border-yellow-500/30 rounded-xl px-6 py-3">
                <span className="text-yellow-400 font-mono">💡 {level.hint}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Available Variables */}
        <motion.div
          className="mt-6 bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="text-white font-semibold mb-3">📝 Available Variables:</h4>
          <div className="flex flex-wrap gap-3">
            <code className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">frogs</code>
            <code className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">greenFrog</code>
            <code className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">blueFrog</code>
            <code className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm">purpleFrog</code>
            <code className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">yellowFrog</code>
            <code className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-lg text-sm">pinkFrog</code>
            <code className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm">orangeFrog</code>
            <code className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm">moreFrogs</code>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

