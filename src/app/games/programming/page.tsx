'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import FloatingShapes from '@/components/FloatingShapes';

interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  levels: number;
  completed: number;
  locked: boolean;
  comingSoon: boolean;
  path?: string;
}

const categories: Category[] = [
  {
    id: 'code-critter',
    title: 'Code Critter',
    description: 'Help the bunny collect carrots using simple arrow commands! Perfect for beginners.',
    icon: '🐰',
    color: '#4ade80',
    bgGradient: 'from-green-600/25 to-emerald-600/20',
    levels: 40,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/code-critter',
  },
  {
    id: 'frog-hop-quest-2',
    title: 'Frog Hop Quest 2',
    description: 'Massive maze ponds — only one path uses the fewest hops; detours cost extra steps!',
    icon: '🧭',
    color: '#059669',
    bgGradient: 'from-emerald-700/25 to-cyan-700/20',
    levels: 8,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/frog-hop-quest-2',
  },
  {
    id: 'functions',
    title: 'Frog Function Pond',
    description: 'Hop lily pads and save moves as functions!',
    icon: '🐸',
    color: '#10b981',
    bgGradient: 'from-emerald-600/20 to-teal-600/20',
    levels: 10,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/functions',
  },
  {
    id: 'event-pond',
    title: 'Bell Lily Pond',
    description: 'When you land on a bell, extra code runs — learn event-driven programming!',
    icon: '🔔',
    color: '#8b5cf6',
    bgGradient: 'from-violet-600/25 to-indigo-600/20',
    levels: 8,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/event-pond',
  },
  {
    id: 'variables',
    title: 'Variable Vault',
    description: 'Store and use data with variables!',
    icon: '📊',
    color: '#ec4899',
    bgGradient: 'from-pink-600/20 to-rose-600/20',
    levels: 10,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/variables',
  },
  {
    id: 'objects',
    title: 'Object Locker',
    description: 'Build, read, and update key→value lockers!',
    icon: '🗄️',
    color: '#22d3ee',
    bgGradient: 'from-cyan-600/20 to-sky-600/20',
    levels: 37,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/objects',
  },
  {
    id: 'case-cipher',
    title: 'Case Cipher',
    description: 'Speed + precision: type tokens exactly; beat your best time (saved locally).',
    icon: '🔐',
    color: '#2dd4bf',
    bgGradient: 'from-teal-600/25 to-emerald-600/20',
    levels: 1,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/case-cipher',
  },
  {
    id: 'arrays',
    title: 'Array Pond',
    description: 'Help frogs reach lily pads using array methods!',
    icon: '🐸',
    color: '#14b8a6',
    bgGradient: 'from-teal-600/20 to-emerald-600/20',
    levels: 10,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/arrays',
  },
  {
    id: 'loops',
    title: 'Loop Blaster',
    description: 'Blast aliens by writing for, while, and for…of loops!',
    icon: '💥',
    color: '#8b5cf6',
    bgGradient: 'from-purple-600/20 to-violet-600/20',
    levels: 19,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/loops',
  },
  {
    id: 'pattern-stack',
    title: 'Lilyfall',
    description: 'Frog pond Tetris: matching symbols clash and shrink the stack — clear lines to win; firefly every 8 drops!',
    icon: '🐸',
    color: '#34d399',
    bgGradient: 'from-emerald-600/25 to-teal-600/20',
    levels: 6,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/pattern-stack',
  },
  {
    id: 'conditions',
    title: 'Under One Condition',
    description: 'If, else, and choices — then block code with two routes!',
    icon: '🌓',
    color: '#f59e0b',
    bgGradient: 'from-amber-600/20 to-orange-600/20',
    levels: 10,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/deduction',
  },
  {
    id: 'logic-leap',
    title: 'Logic Leap',
    description: 'Jump through platforms by evaluating true/false conditions!',
    icon: '🐸',
    color: '#06b6d4',
    bgGradient: 'from-cyan-600/20 to-sky-600/20',
    levels: 10,
    completed: 0,
    locked: true,
    comingSoon: true,
  },
  {
    id: 'debugging',
    title: 'Bug Hunter',
    description: 'Find and fix bugs in broken programs!',
    icon: '🐛',
    color: '#ef4444',
    bgGradient: 'from-red-600/20 to-orange-600/20',
    levels: 14,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/debugging',
  },
  {
    id: 'rock-paper-scissors',
    title: 'Rock Paper Scissors Showdown',
    description: 'Beat the computer! Code your game and play — rock, paper, or scissors?',
    icon: '✂️',
    color: '#8b5cf6',
    bgGradient: 'from-purple-600/20 to-violet-600/20',
    levels: 1,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/projects/rock-paper-scissors',
  },
  {
    id: 'guess-the-number',
    title: 'Secret Number Challenge',
    description: 'Crack the secret number! Guess 1–10 and see if you\'re right.',
    icon: '🎲',
    color: '#06b6d4',
    bgGradient: 'from-cyan-600/20 to-sky-600/20',
    levels: 1,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/projects/guess-the-number',
  },
  {
    id: 'coin-flip',
    title: 'Coin Flip Challenge',
    description: 'Heads or tails! Code the flip, track wins, and beat luck.',
    icon: '🪙',
    color: '#f59e0b',
    bgGradient: 'from-amber-600/20 to-orange-600/20',
    levels: 1,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/projects/coin-flip',
  },
  {
    id: 'memory-match',
    title: 'Lily Pad Memory Match',
    description: 'Full memory card game — shuffle, timer, hints, pause, and victory screen.',
    icon: '🪷',
    color: '#10b981',
    bgGradient: 'from-emerald-600/20 to-teal-600/20',
    levels: 1,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/projects/memory-match',
  },
  {
    id: 'pick-a-card',
    title: 'Magic Card Deck',
    description: 'Draw a card and see what you get! Code your deck and try your luck.',
    icon: '🃏',
    color: '#10b981',
    bgGradient: 'from-emerald-600/20 to-teal-600/20',
    levels: 1,
    completed: 0,
    locked: true,
    comingSoon: true,
  },
  {
    id: 'events',
    title: 'Event Explorer',
    description: 'Trigger actions with events and signals!',
    icon: '⚡',
    color: '#fbbf24',
    bgGradient: 'from-yellow-600/20 to-amber-600/20',
    levels: 8,
    completed: 0,
    locked: true,
    comingSoon: true,
  },
];

export default function CodeQuestHub() {
  const router = useRouter();

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-4 md:p-8 relative overflow-hidden">
      <FloatingShapes />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-4 sm:mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="glass px-4 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors min-h-[44px] touch-target text-sm sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back to Dashboard
          </motion.button>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Title */}
        <motion.div
          className="text-center mb-6 sm:mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="text-5xl sm:text-7xl mb-3 sm:mb-4"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💻
          </motion.div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 px-1">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Code Quest
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg max-w-xl mx-auto px-2">
            Learn programming concepts through fun visual challenges!
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <motion.button
                onClick={() => !category.comingSoon && category.path && router.push(category.path)}
                disabled={category.comingSoon}
                className={`w-full p-4 sm:p-5 rounded-2xl text-left transition-all relative overflow-hidden group min-h-[140px] ${
                  category.comingSoon
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer hover:scale-[1.02]'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${category.color}15, ${category.color}05)`,
                  border: `2px solid ${category.color}30`,
                }}
                whileHover={!category.comingSoon ? { y: -4 } : {}}
                whileTap={!category.comingSoon ? { scale: 0.98 } : {}}
              >
                {/* Coming Soon Badge */}
                {category.comingSoon && (
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold bg-gray-700/80 text-gray-300">
                    Coming Soon
                  </div>
                )}

                {/* Icon */}
                <motion.div
                  className="text-5xl mb-3"
                  animate={!category.comingSoon ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                >
                  {category.icon}
                </motion.div>

                {/* Title */}
                <h3
                  className="text-xl font-bold mb-1"
                  style={{ color: category.comingSoon ? '#9ca3af' : category.color }}
                >
                  {category.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {category.description}
                </p>

                {/* Progress */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {category.levels} levels
                  </span>
                  {!category.comingSoon && (
                    <span style={{ color: category.color }}>
                      Play →
                    </span>
                  )}
                </div>

                {/* Hover glow effect */}
                {!category.comingSoon && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, ${category.color}10, transparent 70%)`,
                    }}
                  />
                )}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Learning Path Info */}
        <motion.div
          className="mt-6 sm:mt-10 text-center px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="glass rounded-2xl p-4 sm:p-6 max-w-2xl mx-auto">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">🎯 Learning Path</h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              Start with <span className="text-green-400 font-semibold">Code Critter</span> for beginners (ages 6-9),
              then <span className="text-emerald-400 font-semibold">Frog Hop Quest</span> to learn more commands, 
              then <span className="text-teal-400 font-semibold">Frog Function Pond</span> for reusable code,
              <span className="text-violet-400 font-semibold"> Bell Lily Pond</span> for events and reactions,
              <span className="text-pink-400 font-semibold"> Variable Vault</span> for data storage, 
              <span className="text-purple-400 font-semibold"> Loop Blaster</span> for repetition, and
              <span className="text-amber-400 font-semibold"> Under One Condition</span> for if, then, else!
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
