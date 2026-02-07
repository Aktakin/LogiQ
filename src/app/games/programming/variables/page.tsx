'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

interface Variable {
  name: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'undefined';
  isSealed: boolean;
}

interface Level {
  id: number;
  title: string;
  concept: string;
  instruction: string;
  hint: string;
  starterCode: string;
  targetVariables: Variable[];
  explanation: string;
  teachingSemicolon?: boolean;
  teachingReassignment?: boolean;
  teachingTypes?: boolean;
}

const levels: Level[] = [
  {
    id: 1,
    title: 'Your First Variable',
    concept: 'Variables are containers that store data',
    instruction: 'Create a variable called "age" and store the number 10 in it.',
    hint: 'Type: let age = 10;',
    starterCode: 'let age = ',
    targetVariables: [{ name: 'age', value: '10', type: 'number', isSealed: true }],
    explanation: 'You created a box named "age" and put the number 10 inside! The box keeps your data safe.',
  },
  {
    id: 2,
    title: 'Naming Your Box',
    concept: 'Variable names are like labels on boxes',
    instruction: 'Create a variable called "playerName" and store "Alex" in it.',
    hint: 'Strings need quotes! Type: let playerName = "Alex";',
    starterCode: 'let playerName = ',
    targetVariables: [{ name: 'playerName', value: '"Alex"', type: 'string', isSealed: true }],
    explanation: 'Strings (text) need quotes around them. The variable name "playerName" is the label on your box!',
  },
  {
    id: 3,
    title: 'The Semicolon Door',
    concept: 'Semicolons seal your variable container',
    instruction: 'Create a variable "score" with value 100. Watch how the semicolon seals the box!',
    hint: 'The semicolon ; is like closing a door to save your data.',
    starterCode: 'let score = 100',
    targetVariables: [{ name: 'score', value: '100', type: 'number', isSealed: true }],
    explanation: 'The semicolon (;) is like closing and locking a door. It tells the computer "I\'m done with this line, save it!"',
    teachingSemicolon: true,
  },
  {
    id: 4,
    title: 'Changing What\'s Inside',
    concept: 'Variables can be reassigned - new values replace old ones',
    instruction: 'First create "lives" with 3, then change it to 2. Watch the old value get replaced!',
    hint: 'First: let lives = 3; Then: lives = 2;',
    starterCode: 'let lives = 3;\nlives = ',
    targetVariables: [{ name: 'lives', value: '2', type: 'number', isSealed: true }],
    explanation: 'When you reassign a variable, the NEW value replaces the OLD one. The box can only hold one thing at a time!',
    teachingReassignment: true,
  },
  {
    id: 5,
    title: 'Call It By Name',
    concept: 'You must use the exact variable name to access it',
    instruction: 'Create "secretCode" with value 1234. Variable names are case-sensitive!',
    hint: 'secretCode is different from SecretCode or secretcode',
    starterCode: 'let secretCode = ',
    targetVariables: [{ name: 'secretCode', value: '1234', type: 'number', isSealed: true }],
    explanation: 'Variable names are case-sensitive! "secretCode", "SecretCode", and "SECRETCODE" are all different boxes.',
  },
  {
    id: 6,
    title: 'Types of Data: Numbers',
    concept: 'Numbers are for math - no quotes needed',
    instruction: 'Create "price" with value 25 (a number, no quotes!)',
    hint: 'Numbers don\'t need quotes: let price = 25;',
    starterCode: 'let price = ',
    targetVariables: [{ name: 'price', value: '25', type: 'number', isSealed: true }],
    explanation: 'Numbers are written without quotes. They can be used for math operations like adding and subtracting!',
    teachingTypes: true,
  },
  {
    id: 7,
    title: 'Types of Data: Strings',
    concept: 'Strings are text - always use quotes',
    instruction: 'Create "greeting" with value "Hello World" (text needs quotes!)',
    hint: 'Strings need quotes: let greeting = "Hello World";',
    starterCode: 'let greeting = ',
    targetVariables: [{ name: 'greeting', value: '"Hello World"', type: 'string', isSealed: true }],
    explanation: 'Strings are text wrapped in quotes. The quotes tell the computer "this is text, not code!"',
    teachingTypes: true,
  },
  {
    id: 8,
    title: 'Types of Data: Booleans',
    concept: 'Booleans are true or false - for yes/no decisions',
    instruction: 'Create "isGameOver" with value false (no quotes for booleans!)',
    hint: 'Booleans are special: true or false without quotes',
    starterCode: 'let isGameOver = ',
    targetVariables: [{ name: 'isGameOver', value: 'false', type: 'boolean', isSealed: true }],
    explanation: 'Booleans can only be true or false. They\'re like light switches - on or off, yes or no!',
    teachingTypes: true,
  },
  {
    id: 9,
    title: 'Multiple Variables',
    concept: 'You can create many variables to store different data',
    instruction: 'Create both "health" = 100 and "coins" = 50',
    hint: 'Create two separate variables, each on its own line',
    starterCode: 'let health = 100;\nlet coins = ',
    targetVariables: [
      { name: 'health', value: '100', type: 'number', isSealed: true },
      { name: 'coins', value: '50', type: 'number', isSealed: true },
    ],
    explanation: 'You can create as many variables as you need! Each one is a separate box with its own name and value.',
  },
  {
    id: 10,
    title: 'Variable Master',
    concept: 'Combine everything you\'ve learned!',
    instruction: 'Create "username" = "Champion", then reassign it to "SuperChampion"',
    hint: 'First create, then reassign on a new line (no let for reassign)',
    starterCode: 'let username = "Champion";\nusername = ',
    targetVariables: [{ name: 'username', value: '"SuperChampion"', type: 'string', isSealed: true }],
    explanation: 'You\'ve mastered variables! You know how to create, name, reassign, and use different data types!',
    teachingReassignment: true,
  },
];

const typeColors = {
  string: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', label: '📝 String' },
  number: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', label: '🔢 Number' },
  boolean: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', label: '✓✗ Boolean' },
  undefined: { bg: 'bg-gray-500/20', border: 'border-gray-500', text: 'text-gray-400', label: '❓ Undefined' },
};

export default function VariableVaultGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [userCode, setUserCode] = useState('');
  const [variables, setVariables] = useState<Variable[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [semikolonAnimation, setSemikolonAnimation] = useState(false);
  const [reassignAnimation, setReassignAnimation] = useState<string | null>(null);

  const level = levels[currentLevelIndex];

  useEffect(() => {
    setUserCode(level.starterCode);
    setVariables([]);
    setIsCorrect(null);
    setShowExplanation(false);
    setSemikolonAnimation(false);
    setReassignAnimation(null);
  }, [currentLevelIndex, level.starterCode]);

  const parseCode = useCallback((code: string): Variable[] => {
    const vars: Variable[] = [];
    const lines = code.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Match variable declaration: let name = value;
      const declareMatch = trimmed.match(/^let\s+(\w+)\s*=\s*(.+?)(\s*;)?$/);
      if (declareMatch) {
        const [, name, rawValue, semicolon] = declareMatch;
        const value = rawValue.trim();
        let type: Variable['type'] = 'undefined';
        
        if (value.startsWith('"') || value.startsWith("'")) {
          type = 'string';
        } else if (value === 'true' || value === 'false') {
          type = 'boolean';
        } else if (!isNaN(Number(value))) {
          type = 'number';
        }

        const existingIndex = vars.findIndex(v => v.name === name);
        if (existingIndex >= 0) {
          vars[existingIndex] = { name, value, type, isSealed: !!semicolon };
        } else {
          vars.push({ name, value, type, isSealed: !!semicolon });
        }
        continue;
      }

      // Match reassignment: name = value;
      const reassignMatch = trimmed.match(/^(\w+)\s*=\s*(.+?)(\s*;)?$/);
      if (reassignMatch) {
        const [, name, rawValue, semicolon] = reassignMatch;
        const value = rawValue.trim();
        let type: Variable['type'] = 'undefined';
        
        if (value.startsWith('"') || value.startsWith("'")) {
          type = 'string';
        } else if (value === 'true' || value === 'false') {
          type = 'boolean';
        } else if (!isNaN(Number(value))) {
          type = 'number';
        }

        const existingIndex = vars.findIndex(v => v.name === name);
        if (existingIndex >= 0) {
          vars[existingIndex] = { name, value, type, isSealed: !!semicolon };
        }
      }
    }

    return vars;
  }, []);

  const handleCodeChange = (newCode: string) => {
    setUserCode(newCode);
    const parsed = parseCode(newCode);
    
    // Check for reassignment animation
    if (parsed.length > 0 && variables.length > 0) {
      const lastVar = parsed[parsed.length - 1];
      const prevVar = variables.find(v => v.name === lastVar.name);
      if (prevVar && prevVar.value !== lastVar.value) {
        setReassignAnimation(lastVar.name);
        setTimeout(() => setReassignAnimation(null), 1000);
      }
    }
    
    // Check for semicolon animation
    if (level.teachingSemicolon) {
      const hasNewSemicolon = newCode.includes(';') && !userCode.includes(';');
      if (hasNewSemicolon) {
        setSemikolonAnimation(true);
        setTimeout(() => setSemikolonAnimation(false), 1500);
      }
    }
    
    setVariables(parsed);
    setIsCorrect(null);
  };

  const checkAnswer = () => {
    const isMatch = level.targetVariables.every(target => {
      const found = variables.find(v => v.name === target.name);
      return found && 
        found.value === target.value && 
        found.type === target.type &&
        found.isSealed === target.isSealed;
    }) && variables.length === level.targetVariables.length;

    setIsCorrect(isMatch);
    
    if (isMatch) {
      setShowExplanation(true);
      setShowConfetti(true);
      addStars(2);
      recordAnswer(true);
      incrementGamesPlayed();
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
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

  return (
    <main className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-900 via-pink-950/20 to-slate-900 p-3 sm:p-4 md:p-6 relative overflow-hidden">
      <Confetti show={showConfetti} />

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            {['📦', '📊', '🗃️', '💾', '🔐'][i % 5]}
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <header className="max-w-5xl mx-auto mb-6 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <motion.button
            onClick={() => router.push('/games/programming')}
            className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:text-white transition-all text-sm backdrop-blur min-h-[44px] touch-target"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Back
          </motion.button>
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 border border-white/20">
            <span className="text-gray-300 text-sm">Level </span>
            <span className="text-white font-bold">{currentLevelIndex + 1}/{levels.length}</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Title */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              📦 Variable Vault 🔐
            </span>
          </h1>
          <p className="text-pink-300/80">Learn how to store data in containers!</p>
        </motion.div>

        {/* Level Info */}
        <motion.div
          className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-5 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-white mb-2">{level.title}</h2>
          <div className="bg-pink-500/20 rounded-xl px-4 py-2 mb-3 inline-block">
            <span className="text-pink-400 text-sm">💡 {level.concept}</span>
          </div>
          <p className="text-gray-300 mb-3">{level.instruction}</p>
          <div className="text-gray-500 text-sm">
            <span className="text-yellow-400">Hint:</span> {level.hint}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Editor */}
          <motion.div
            className="bg-slate-900/80 backdrop-blur rounded-2xl border border-pink-500/30 overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-3 text-slate-400 text-sm font-mono">variables.js</span>
            </div>

            <div className="p-4">
              <textarea
                value={userCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full h-40 bg-slate-800/50 text-green-400 font-mono text-sm p-4 rounded-xl border border-slate-600 focus:border-pink-500 focus:outline-none resize-none"
                placeholder="Type your code here..."
                spellCheck={false}
              />
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
                    <span className="text-green-400">✓ Perfect! Your variable is stored correctly!</span>
                  ) : (
                    <span className="text-red-400">✗ Not quite. Check your code and try again!</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4 border-t border-slate-700">
              <motion.button
                onClick={checkAnswer}
                disabled={isCorrect === true}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  isCorrect === true
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-500 hover:to-purple-500'
                }`}
                whileHover={isCorrect !== true ? { scale: 1.02 } : {}}
                whileTap={isCorrect !== true ? { scale: 0.98 } : {}}
              >
                {isCorrect === true ? '✓ Complete!' : '🚀 Run Code'}
              </motion.button>
            </div>
          </motion.div>

          {/* Variable Visualization */}
          <motion.div
            className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span>🗄️</span> Memory Storage
              <span className="text-xs text-gray-500 font-normal ml-auto">Variables are stored here</span>
            </h3>

            <div className="min-h-[200px] space-y-4">
              {variables.length === 0 ? (
                <div className="text-gray-500 text-center py-10">
                  <div className="text-4xl mb-2">📦</div>
                  <p>No variables yet. Write some code!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {variables.map((variable, index) => {
                    const colors = typeColors[variable.type];
                    const isReassigning = reassignAnimation === variable.name;
                    
                    return (
                      <motion.div
                        key={`${variable.name}-${index}`}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1, 
                          y: 0,
                          x: isReassigning ? [0, -5, 5, 0] : 0,
                        }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative"
                      >
                        {/* Variable Box */}
                        <div className={`
                          relative rounded-xl border-2 overflow-hidden transition-all
                          ${colors.border} ${colors.bg}
                          ${!variable.isSealed ? 'border-dashed animate-pulse' : ''}
                        `}>
                          {/* Variable Name Label */}
                          <div className={`px-3 py-1.5 ${colors.bg} border-b ${colors.border} flex items-center justify-between`}>
                            <span className={`font-mono font-bold ${colors.text}`}>
                              {variable.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {colors.label}
                            </span>
                          </div>

                          {/* Value Container */}
                          <div className="p-4 relative">
                            <motion.div
                              key={variable.value}
                              initial={isReassigning ? { opacity: 0, y: -20 } : { opacity: 1 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`font-mono text-2xl text-center ${colors.text}`}
                            >
                              {variable.value}
                            </motion.div>

                            {/* Reassignment indicator */}
                            {isReassigning && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 flex items-center justify-center bg-yellow-500/20 rounded"
                              >
                                <span className="text-yellow-400 text-sm font-bold">↻ Value Updated!</span>
                              </motion.div>
                            )}
                          </div>

                          {/* Semicolon Door */}
                          <motion.div
                            className={`
                              absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center
                              transition-all duration-500
                              ${variable.isSealed 
                                ? 'bg-green-500/30 border-l-2 border-green-500' 
                                : 'bg-red-500/20 border-l-2 border-red-500 border-dashed'
                              }
                            `}
                            animate={semikolonAnimation && variable.isSealed ? {
                              scale: [1, 1.2, 1],
                              backgroundColor: ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.6)', 'rgba(34, 197, 94, 0.3)'],
                            } : {}}
                          >
                            {variable.isSealed ? (
                              <motion.div
                                initial={{ rotate: 0 }}
                                animate={semikolonAnimation ? { rotate: [0, -10, 0] } : {}}
                                className="text-green-400 font-bold text-xl"
                                title="Sealed with semicolon!"
                              >
                                🔒
                              </motion.div>
                            ) : (
                              <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="text-red-400 font-bold text-xl"
                                title="Missing semicolon!"
                              >
                                🔓
                              </motion.div>
                            )}
                          </motion.div>
                        </div>

                        {/* Status message */}
                        <div className="mt-1 text-xs text-center">
                          {variable.isSealed ? (
                            <span className="text-green-400">✓ Sealed with semicolon</span>
                          ) : (
                            <span className="text-red-400">⚠ Add semicolon to seal!</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Type Legend */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="text-xs text-gray-400 mb-2">Data Types:</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(typeColors).map(([type, colors]) => (
                  <div
                    key={type}
                    className={`px-2 py-1 rounded text-xs ${colors.bg} ${colors.text} border ${colors.border}`}
                  >
                    {colors.label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Explanation Modal */}
        <AnimatePresence>
          {showExplanation && (
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
                className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-pink-500/30"
              >
                <div className="text-center mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-5xl mb-2"
                  >
                    🎉
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white">Great Job!</h3>
                </div>

                <div className="bg-pink-500/20 rounded-xl p-4 mb-4">
                  <p className="text-pink-300">{level.explanation}</p>
                </div>

                <div className="text-center text-yellow-400 text-lg mb-4">
                  ⭐ +2 Stars!
                </div>

                <motion.button
                  onClick={nextLevel}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {currentLevelIndex < levels.length - 1 ? 'Next Level →' : '🏆 Complete!'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Key Concepts Panel */}
        <motion.div
          className="mt-6 bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="text-white font-bold mb-3">📚 Key Concepts:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
              <div className="text-blue-400 font-bold mb-1">📦 Variables</div>
              <div className="text-gray-400">Containers that store data with a name</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
              <div className="text-green-400 font-bold mb-1">🔒 Semicolons</div>
              <div className="text-gray-400">The &quot;door&quot; that seals and saves your data</div>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
              <div className="text-purple-400 font-bold mb-1">🔄 Reassignment</div>
              <div className="text-gray-400">New values replace old ones in the box</div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
