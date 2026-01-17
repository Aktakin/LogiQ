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
    id: 'robot',
    title: 'Robot Navigator',
    description: 'Guide the robot through mazes using movement commands!',
    icon: '🤖',
    color: '#3b82f6',
    bgGradient: 'from-blue-600/20 to-cyan-600/20',
    levels: 12,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/robot',
  },
  {
    id: 'functions',
    title: 'Function Factory',
    description: 'Create your own reusable command blocks!',
    icon: '📦',
    color: '#10b981',
    bgGradient: 'from-emerald-600/20 to-teal-600/20',
    levels: 10,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/functions',
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
    title: 'Loop Master',
    description: 'Learn to repeat actions with loops and patterns!',
    icon: '🔄',
    color: '#8b5cf6',
    bgGradient: 'from-purple-600/20 to-violet-600/20',
    levels: 10,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/loops',
  },
  {
    id: 'conditions',
    title: 'If-Then Detective',
    description: 'Make decisions with conditional logic!',
    icon: '🔍',
    color: '#f59e0b',
    bgGradient: 'from-amber-600/20 to-orange-600/20',
    levels: 10,
    completed: 0,
    locked: false,
    comingSoon: false,
    path: '/games/programming/conditions',
  },
  {
    id: 'algorithms',
    title: 'Algorithm Arena',
    description: 'Solve complex puzzles with algorithms!',
    icon: '🧩',
    color: '#06b6d4',
    bgGradient: 'from-cyan-600/20 to-sky-600/20',
    levels: 12,
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
    <main className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      <FloatingShapes />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="glass px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-colors"
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
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="text-7xl mb-4"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💻
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Code Quest
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Learn programming concepts through fun visual challenges!
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                className={`w-full p-5 rounded-2xl text-left transition-all relative overflow-hidden group ${
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
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="glass rounded-2xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-white mb-2">🎯 Learning Path</h3>
            <p className="text-gray-400 text-sm">
              Start with <span className="text-blue-400 font-semibold">Robot Navigator</span> to learn basic commands, 
              then <span className="text-emerald-400 font-semibold">Function Factory</span> for reusable code,
              <span className="text-pink-400 font-semibold"> Variable Vault</span> for data storage, 
              <span className="text-purple-400 font-semibold"> Loop Master</span> for repetition, and
              <span className="text-amber-400 font-semibold"> If-Then Detective</span> for conditional logic!
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
