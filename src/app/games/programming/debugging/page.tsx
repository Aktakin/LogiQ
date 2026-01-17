'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

interface CodeLine {
  id: number;
  code: string;
  hasBug: boolean;
  bugType?: string;
  correctCode?: string;
  hint?: string;
}

interface Level {
  id: number;
  title: string;
  story: string;
  concept: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  lines: CodeLine[];
  expectedOutput: string;
  bugCount: number;
}

const levels: Level[] = [
  // EASY - Syntax Errors
  {
    id: 1,
    title: 'The Missing Quote',
    story: '🤖 Robot wants to say hello, but something is broken!',
    concept: 'Strings need opening AND closing quotes',
    difficulty: 'Easy',
    expectedOutput: 'Hello, World!',
    bugCount: 1,
    lines: [
      { id: 1, code: 'let message = "Hello, World!;', hasBug: true, bugType: 'Missing closing quote', correctCode: 'let message = "Hello, World!";', hint: 'Strings need quotes on both ends!' },
      { id: 2, code: 'console.log(message);', hasBug: false },
    ],
  },
  {
    id: 2,
    title: 'The Forgotten Semicolon',
    story: '🎮 The game score won\'t update! Can you spot why?',
    concept: 'Statements end with semicolons',
    difficulty: 'Easy',
    expectedOutput: 'Score: 100',
    bugCount: 1,
    lines: [
      { id: 1, code: 'let score = 100', hasBug: true, bugType: 'Missing semicolon', correctCode: 'let score = 100;', hint: 'Every statement needs a semicolon at the end!' },
      { id: 2, code: 'console.log("Score: " + score);', hasBug: false },
    ],
  },
  // EASY - Variable Errors
  {
    id: 3,
    title: 'The Misspelled Variable',
    story: '🐱 Kitty\'s name got scrambled! Fix the typo!',
    concept: 'Variable names must match exactly',
    difficulty: 'Easy',
    expectedOutput: 'Whiskers',
    bugCount: 1,
    lines: [
      { id: 1, code: 'let catName = "Whiskers";', hasBug: false },
      { id: 2, code: 'console.log(catname);', hasBug: true, bugType: 'Wrong variable name (case matters!)', correctCode: 'console.log(catName);', hint: 'JavaScript cares about UPPERCASE and lowercase!' },
    ],
  },
  {
    id: 4,
    title: 'The Undeclared Variable',
    story: '🎂 We\'re counting candles but forgot something important!',
    concept: 'Variables must be declared before use',
    difficulty: 'Easy',
    expectedOutput: '8',
    bugCount: 1,
    lines: [
      { id: 1, code: 'candles = 8;', hasBug: true, bugType: 'Variable not declared', correctCode: 'let candles = 8;', hint: 'You need "let" to create a new variable!' },
      { id: 2, code: 'console.log(candles);', hasBug: false },
    ],
  },
  // MEDIUM - Array Errors
  {
    id: 5,
    title: 'The Wrong Index',
    story: '🍎 We want the FIRST fruit, but we\'re getting the wrong one!',
    concept: 'Arrays start at index 0, not 1',
    difficulty: 'Medium',
    expectedOutput: 'apple',
    bugCount: 1,
    lines: [
      { id: 1, code: 'let fruits = ["apple", "banana", "orange"];', hasBug: false },
      { id: 2, code: 'let firstFruit = fruits[1];', hasBug: true, bugType: 'Wrong index (arrays start at 0)', correctCode: 'let firstFruit = fruits[0];', hint: 'The first item is at position 0, not 1!' },
      { id: 3, code: 'console.log(firstFruit);', hasBug: false },
    ],
  },
  {
    id: 6,
    title: 'The Backwards Push',
    story: '🐸 We want to add a frog to our pond array!',
    concept: 'Use the correct array method',
    difficulty: 'Medium',
    expectedOutput: '["lily", "frog"]',
    bugCount: 1,
    lines: [
      { id: 1, code: 'let pond = ["lily"];', hasBug: false },
      { id: 2, code: 'pond.add("frog");', hasBug: true, bugType: 'Wrong method name', correctCode: 'pond.push("frog");', hint: 'To add items to an array, use push()!' },
      { id: 3, code: 'console.log(pond);', hasBug: false },
    ],
  },
  // MEDIUM - Loop Errors
  {
    id: 7,
    title: 'The Infinite Loop',
    story: '😵 This loop never stops! The computer is going crazy!',
    concept: 'Loops need to eventually end',
    difficulty: 'Medium',
    expectedOutput: '0, 1, 2, 3, 4',
    bugCount: 1,
    lines: [
      { id: 1, code: 'for (let i = 0; i < 5; i--) {', hasBug: true, bugType: 'Loop goes wrong direction', correctCode: 'for (let i = 0; i < 5; i++) {', hint: 'i-- makes i smaller, but we need it bigger!' },
      { id: 2, code: '  console.log(i);', hasBug: false },
      { id: 3, code: '}', hasBug: false },
    ],
  },
  {
    id: 8,
    title: 'The Off-By-One',
    story: '🔢 We want to count 1 to 5, but something\'s wrong!',
    concept: 'Check your loop boundaries',
    difficulty: 'Medium',
    expectedOutput: '1, 2, 3, 4, 5',
    bugCount: 1,
    lines: [
      { id: 1, code: 'for (let i = 1; i < 5; i++) {', hasBug: true, bugType: 'Wrong boundary (misses 5)', correctCode: 'for (let i = 1; i <= 5; i++) {', hint: 'Use <= to include the last number!' },
      { id: 2, code: '  console.log(i);', hasBug: false },
      { id: 3, code: '}', hasBug: false },
    ],
  },
  // HARD - Condition Errors
  {
    id: 9,
    title: 'The Assignment Trap',
    story: '🎯 This should check if score equals 100, but it\'s not working!',
    concept: '= assigns, == compares',
    difficulty: 'Hard',
    expectedOutput: 'You win!',
    bugCount: 1,
    lines: [
      { id: 1, code: 'let score = 100;', hasBug: false },
      { id: 2, code: 'if (score = 100) {', hasBug: true, bugType: 'Using = instead of ===', correctCode: 'if (score === 100) {', hint: 'Use === to compare, not = (that assigns!)' },
      { id: 3, code: '  console.log("You win!");', hasBug: false },
      { id: 4, code: '}', hasBug: false },
    ],
  },
  {
    id: 10,
    title: 'The Logic Flip',
    story: '🌡️ The AC should turn on when it\'s hot, not cold!',
    concept: 'Check your comparison operators',
    difficulty: 'Hard',
    expectedOutput: 'Turn on AC!',
    bugCount: 1,
    lines: [
      { id: 1, code: 'let temperature = 85;', hasBug: false },
      { id: 2, code: 'if (temperature < 80) {', hasBug: true, bugType: 'Wrong comparison operator', correctCode: 'if (temperature > 80) {', hint: 'We want AC when temp is ABOVE 80, not below!' },
      { id: 3, code: '  console.log("Turn on AC!");', hasBug: false },
      { id: 4, code: '}', hasBug: false },
    ],
  },
  // HARD - Multiple Bugs
  {
    id: 11,
    title: 'Double Trouble',
    story: '🎪 TWO bugs are hiding in this code! Can you find them both?',
    concept: 'Sometimes there\'s more than one bug!',
    difficulty: 'Hard',
    expectedOutput: 'Total: 15',
    bugCount: 2,
    lines: [
      { id: 1, code: 'let numbers = [5, 5, 5];', hasBug: false },
      { id: 2, code: 'let total = 0', hasBug: true, bugType: 'Missing semicolon', correctCode: 'let total = 0;', hint: 'Don\'t forget the semicolon!' },
      { id: 3, code: 'for (let i = 0; i <= 3; i++) {', hasBug: true, bugType: 'Off-by-one (index 3 doesn\'t exist)', correctCode: 'for (let i = 0; i < 3; i++) {', hint: 'Array has 3 items (index 0, 1, 2), not 4!' },
      { id: 4, code: '  total += numbers[i];', hasBug: false },
      { id: 5, code: '}', hasBug: false },
      { id: 6, code: 'console.log("Total: " + total);', hasBug: false },
    ],
  },
  // EXPERT - Function Errors
  {
    id: 12,
    title: 'The Missing Return',
    story: '🔧 This function calculates but never gives back the answer!',
    concept: 'Functions need to return values',
    difficulty: 'Expert',
    expectedOutput: '8',
    bugCount: 1,
    lines: [
      { id: 1, code: 'function double(num) {', hasBug: false },
      { id: 2, code: '  let result = num * 2;', hasBug: false },
      { id: 3, code: '  result;', hasBug: true, bugType: 'Missing return statement', correctCode: '  return result;', hint: 'Use "return" to send the value back!' },
      { id: 4, code: '}', hasBug: false },
      { id: 5, code: 'console.log(double(4));', hasBug: false },
    ],
  },
  {
    id: 13,
    title: 'The Parameter Mix-up',
    story: '📐 This function should add two numbers together!',
    concept: 'Use all parameters correctly',
    difficulty: 'Expert',
    expectedOutput: '15',
    bugCount: 1,
    lines: [
      { id: 1, code: 'function add(a, b) {', hasBug: false },
      { id: 2, code: '  return a + a;', hasBug: true, bugType: 'Using wrong parameter', correctCode: '  return a + b;', hint: 'We should add a AND b, not a twice!' },
      { id: 3, code: '}', hasBug: false },
      { id: 4, code: 'console.log(add(5, 10));', hasBug: false },
    ],
  },
  {
    id: 14,
    title: 'The Ultimate Debug',
    story: '🏆 The final challenge! Find ALL the bugs in this program!',
    concept: 'Combine everything you\'ve learned',
    difficulty: 'Expert',
    expectedOutput: 'Sum: 10, Product: 24',
    bugCount: 2,
    lines: [
      { id: 1, code: 'function calculate(nums) {', hasBug: false },
      { id: 2, code: '  let sum = 0;', hasBug: false },
      { id: 3, code: '  let product = 1;', hasBug: false },
      { id: 4, code: '  for (let i = 0; i <= nums.length; i++) {', hasBug: true, bugType: 'Off-by-one error', correctCode: '  for (let i = 0; i < nums.length; i++) {', hint: 'Use < not <= for array length!' },
      { id: 5, code: '    sum += nums[i];', hasBug: false },
      { id: 6, code: '    product *= nums[i];', hasBug: false },
      { id: 7, code: '  }', hasBug: false },
      { id: 8, code: '  return "Sum: " + sum + ", Product: " + product', hasBug: true, bugType: 'Missing semicolon', correctCode: '  return "Sum: " + sum + ", Product: " + product;', hint: 'Don\'t forget the semicolon!' },
      { id: 9, code: '}', hasBug: false },
      { id: 10, code: 'console.log(calculate([1, 2, 3, 4]));', hasBug: false },
    ],
  },
];

const difficultyColors = {
  Easy: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' },
  Medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500' },
  Hard: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500' },
  Expert: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' },
};

export default function BugHunterGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [foundBugs, setFoundBugs] = useState<number[]>([]);
  const [fixedBugs, setFixedBugs] = useState<number[]>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [gamePhase, setGamePhase] = useState<'hunting' | 'fixing' | 'complete'>('hunting');
  const [bugAnimation, setBugAnimation] = useState<number | null>(null);
  const [userFix, setUserFix] = useState('');
  const [fixAttemptResult, setFixAttemptResult] = useState<'none' | 'correct' | 'wrong'>('none');
  const [showSolution, setShowSolution] = useState(false);
  const [selfFixedBugs, setSelfFixedBugs] = useState<number[]>([]);

  const level = levels[currentLevelIndex];
  const diffColors = difficultyColors[level.difficulty];

  const resetLevel = () => {
    setFoundBugs([]);
    setFixedBugs([]);
    setSelectedLine(null);
    setShowHint(false);
    setWrongAttempts(0);
    setGamePhase('hunting');
    setBugAnimation(null);
    setUserFix('');
    setFixAttemptResult('none');
    setShowSolution(false);
    setSelfFixedBugs([]);
  };

  useEffect(() => {
    resetLevel();
  }, [currentLevelIndex]);

  const handleLineClick = (lineId: number) => {
    if (gamePhase === 'complete') return;

    const line = level.lines.find(l => l.id === lineId);
    if (!line) return;

    if (gamePhase === 'hunting') {
      if (line.hasBug && !foundBugs.includes(lineId)) {
        // Found a bug!
        setBugAnimation(lineId);
        setTimeout(() => {
          setFoundBugs([...foundBugs, lineId]);
          setBugAnimation(null);
          
          // Check if all bugs found
          const bugLines = level.lines.filter(l => l.hasBug).map(l => l.id);
          if ([...foundBugs, lineId].length === bugLines.length) {
            setGamePhase('fixing');
          }
        }, 500);
      } else if (!line.hasBug) {
        setWrongAttempts(prev => prev + 1);
      }
    } else if (gamePhase === 'fixing') {
      if (line.hasBug && foundBugs.includes(lineId) && !fixedBugs.includes(lineId)) {
        setSelectedLine(lineId);
      }
    }
  };

  const checkUserFix = (lineId: number) => {
    const buggyLine = level.lines.find(l => l.id === lineId);
    if (!buggyLine || !buggyLine.correctCode) return;

    // Normalize both strings for comparison (remove extra spaces, trim)
    const normalizedUser = userFix.trim().replace(/\s+/g, ' ');
    const normalizedCorrect = buggyLine.correctCode.trim().replace(/\s+/g, ' ');

    if (normalizedUser === normalizedCorrect) {
      setFixAttemptResult('correct');
      setSelfFixedBugs([...selfFixedBugs, lineId]);
      // Auto-apply after showing success
      setTimeout(() => {
        handleFix(lineId, true);
      }, 1000);
    } else {
      setFixAttemptResult('wrong');
      setWrongAttempts(prev => prev + 1);
    }
  };

  const handleFix = (lineId: number, selfFixed: boolean = false) => {
    const newFixedBugs = [...fixedBugs, lineId];
    setFixedBugs(newFixedBugs);
    setSelectedLine(null);
    setUserFix('');
    setFixAttemptResult('none');
    setShowSolution(false);

    // Check if all bugs fixed
    const bugLines = level.lines.filter(l => l.hasBug).map(l => l.id);
    if (newFixedBugs.length === bugLines.length) {
      setGamePhase('complete');
      setShowConfetti(true);
      // Bonus stars for fixing yourself!
      const selfFixBonus = selfFixedBugs.length + (selfFixed ? 1 : 0);
      const baseStars = wrongAttempts === 0 ? 2 : wrongAttempts < 3 ? 1 : 1;
      const totalStars = baseStars + selfFixBonus;
      addStars(totalStars);
      recordAnswer(true);
      incrementGamesPlayed();
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
    } else {
      router.push('/games/programming');
    }
  };

  const getLineStatus = (line: CodeLine) => {
    if (fixedBugs.includes(line.id)) return 'fixed';
    if (foundBugs.includes(line.id)) return 'found';
    if (bugAnimation === line.id) return 'animating';
    return 'normal';
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 p-4 md:p-6 relative overflow-hidden">
      <Confetti show={showConfetti} />

      {/* Floating bugs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, Math.random() * 20 - 10, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            {['🐛', '🐜', '🦗', '🪲', '🦟'][i % 5]}
          </motion.div>
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
            <div className={`${diffColors.bg} backdrop-blur rounded-xl px-4 py-2 border ${diffColors.border}`}>
              <span className={`${diffColors.text} font-bold`}>{level.difficulty}</span>
            </div>
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
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              🐛 Bug Hunter 🔍
            </span>
          </h1>
          <p className="text-indigo-300/80">Find and squash those pesky bugs!</p>
        </motion.div>

        {/* Level Info */}
        <motion.div
          className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-5 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-4">
            <motion.div
              className="text-4xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🔎
            </motion.div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">{level.title}</h2>
              <p className="text-indigo-300 mb-3">{level.story}</p>
              <div className="flex flex-wrap gap-3">
                <div className="bg-indigo-500/20 rounded-xl px-4 py-2">
                  <span className="text-indigo-400 text-sm">🐛 Bugs to find: <strong>{level.bugCount}</strong></span>
                </div>
                <div className="bg-green-500/20 rounded-xl px-4 py-2">
                  <span className="text-green-400 text-sm">✓ Found: <strong>{foundBugs.length}</strong></span>
                </div>
                <div className="bg-blue-500/20 rounded-xl px-4 py-2">
                  <span className="text-blue-400 text-sm">🔧 Fixed: <strong>{fixedBugs.length}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Phase Indicator */}
        <motion.div
          className="mb-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {gamePhase === 'hunting' && (
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-6 py-2">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🔍
              </motion.span>
              <span className="text-yellow-400 font-semibold">Phase 1: Find the bugs!</span>
              <span className="text-yellow-400/70 text-sm">(Click on buggy lines)</span>
            </div>
          )}
          {gamePhase === 'fixing' && (
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-6 py-2">
              <motion.span
                animate={{ rotate: [0, 20, -20, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🔧
              </motion.span>
              <span className="text-blue-400 font-semibold">Phase 2: Fix the bugs!</span>
              <span className="text-blue-400/70 text-sm">(Click bugs to see fixes)</span>
            </div>
          )}
          {gamePhase === 'complete' && (
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-6 py-2">
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                ✨
              </motion.span>
              <span className="text-green-400 font-semibold">All bugs squashed!</span>
            </div>
          )}
        </motion.div>

        {/* Code Editor */}
        <motion.div
          className="bg-slate-900/90 backdrop-blur rounded-2xl border-2 border-indigo-500/30 overflow-hidden mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)' }}
        >
          {/* Editor Header */}
          <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-3 text-slate-400 text-sm font-mono">buggy_code.js</span>
            {wrongAttempts > 0 && (
              <span className="ml-auto text-red-400 text-sm">❌ Wrong clicks: {wrongAttempts}</span>
            )}
          </div>

          {/* Code Lines */}
          <div className="p-4 font-mono text-sm">
            {level.lines.map((line) => {
              const status = getLineStatus(line);
              
              return (
                <motion.div
                  key={line.id}
                  onClick={() => handleLineClick(line.id)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all
                    ${status === 'fixed' ? 'bg-green-500/20 border border-green-500/50' : ''}
                    ${status === 'found' ? 'bg-red-500/20 border border-red-500/50' : ''}
                    ${status === 'animating' ? 'bg-yellow-500/30' : ''}
                    ${status === 'normal' ? 'hover:bg-white/5' : ''}
                  `}
                  animate={status === 'animating' ? { scale: [1, 1.02, 1], x: [0, -5, 5, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-slate-500 w-6 text-right select-none">{line.id}</span>
                  <span className="text-slate-600 select-none">│</span>
                  
                  {status === 'fixed' ? (
                    <span className="text-green-400">{line.correctCode}</span>
                  ) : (
                    <span className={`
                      ${status === 'found' ? 'text-red-400' : 'text-slate-300'}
                    `}>
                      {line.code}
                    </span>
                  )}

                  {/* Bug/Fixed indicators */}
                  {status === 'found' && !fixedBugs.includes(line.id) && (
                    <motion.span
                      className="ml-auto"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      🐛
                    </motion.span>
                  )}
                  {status === 'fixed' && (
                    <motion.span
                      className="ml-auto"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      ✅
                    </motion.span>
                  )}
                  {status === 'animating' && (
                    <motion.span
                      className="ml-auto text-xl"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      💥
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Expected Output */}
          <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700">
            <span className="text-slate-400 text-sm">Expected output: </span>
            <span className="text-green-400 font-mono">{level.expectedOutput}</span>
          </div>
        </motion.div>

        {/* Fix Modal */}
        <AnimatePresence>
          {selectedLine !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="bg-slate-800 rounded-2xl p-6 max-w-xl w-full border border-indigo-500/30 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span>🔧</span> Fix this bug!
                  <span className="ml-auto text-sm font-normal text-slate-400">Fix it to continue</span>
                </h3>
                
                {(() => {
                  const buggyLine = level.lines.find(l => l.id === selectedLine);
                  if (!buggyLine) return null;
                  
                  return (
                    <>
                      {/* Bug Info */}
                      <div className="mb-4">
                        <div className="text-sm text-red-400 mb-2">🐛 Bug type: {buggyLine.bugType}</div>
                        <div className="bg-red-500/20 rounded-xl p-3 font-mono text-red-400 text-sm">
                          {buggyLine.code}
                        </div>
                      </div>

                      {/* Hint */}
                      <div className="bg-indigo-500/20 rounded-xl p-3 mb-4">
                        <span className="text-indigo-400 text-sm">💡 Hint: {buggyLine.hint}</span>
                      </div>

                      {/* Success Message */}
                      {fixAttemptResult === 'correct' && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 mb-4 text-center"
                        >
                          <div className="text-3xl mb-2">🎉</div>
                          <div className="text-green-400 font-bold">Perfect! You fixed it yourself!</div>
                          <div className="text-green-400/70 text-sm">+1 Bonus Star!</div>
                        </motion.div>
                      )}

                      {/* User Input Section */}
                      {!showSolution && fixAttemptResult !== 'correct' && (
                        <div className="mb-4">
                          <div className="text-sm text-slate-400 mb-2">✏️ Type the corrected code:</div>
                          <input
                            type="text"
                            value={userFix}
                            onChange={(e) => {
                              setUserFix(e.target.value);
                              setFixAttemptResult('none');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && userFix.trim()) {
                                checkUserFix(selectedLine);
                              }
                            }}
                            placeholder={buggyLine.code}
                            className={`w-full px-4 py-3 rounded-xl font-mono text-sm border-2 transition-all
                              ${fixAttemptResult === 'wrong' 
                                ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                                : 'bg-slate-700/50 border-slate-600 text-white focus:border-indigo-500'
                              }
                            `}
                            autoFocus
                          />
                          {fixAttemptResult === 'wrong' && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-400 text-sm mt-2"
                            >
                              ❌ Not quite right. Try again or click &quot;Show Solution&quot;
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* Solution Display */}
                      {showSolution && fixAttemptResult !== 'correct' && (
                        <div className="mb-4">
                          <div className="text-sm text-slate-400 mb-2">✅ Correct code:</div>
                          <div className="bg-green-500/20 rounded-xl p-3 font-mono text-green-400 text-sm">
                            {buggyLine.correctCode}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {!showSolution && fixAttemptResult !== 'correct' && (
                          <>
                            <motion.button
                              onClick={() => checkUserFix(selectedLine)}
                              disabled={!userFix.trim()}
                              className={`flex-1 py-3 rounded-xl font-bold transition-all
                                ${userFix.trim() 
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }
                              `}
                              whileHover={userFix.trim() ? { scale: 1.02 } : {}}
                              whileTap={userFix.trim() ? { scale: 0.98 } : {}}
                            >
                              ✓ Check My Fix
                            </motion.button>
                            <motion.button
                              onClick={() => setShowSolution(true)}
                              className="px-4 py-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              👀 Show Solution
                            </motion.button>
                          </>
                        )}
                        
                        {showSolution && fixAttemptResult !== 'correct' && (
                          <motion.button
                            onClick={() => handleFix(selectedLine, false)}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            🔧 Apply Fix
                          </motion.button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {gamePhase !== 'complete' && (
            <>
              <motion.button
                onClick={resetLevel}
                className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-gray-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔄 Reset Level
              </motion.button>
              {!showHint && gamePhase === 'hunting' && (
                <motion.button
                  onClick={() => setShowHint(true)}
                  className="px-6 py-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  💡 Show Hint
                </motion.button>
              )}
            </>
          )}
          {gamePhase === 'complete' && (
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
          {showHint && gamePhase === 'hunting' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 text-center"
            >
              <div className="inline-block bg-yellow-500/20 border border-yellow-500/30 rounded-xl px-6 py-3">
                <span className="text-yellow-400">💡 {level.concept}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Concept Summary */}
        <motion.div
          className="mt-6 bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="text-white font-semibold mb-2">🎓 Learning Point:</h4>
          <p className="text-indigo-300">{level.concept}</p>
        </motion.div>
      </div>
    </main>
  );
}

