'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import FloatingShapes from '@/components/FloatingShapes';

interface GameItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  tags?: string[];
  isNew?: boolean;
  comingSoon?: boolean;
}

const codeQuestGames: GameItem[] = [
  {
    id: 'code-critter',
    title: 'Code Critter',
    description: 'Help the bunny collect carrots with simple arrows! Perfect for ages 6-9',
    icon: '🐰',
    href: '/games/programming/code-critter',
    color: '#4ade80',
    tags: ['Beginner', 'Sequences'],
    isNew: true,
  },
  {
    id: 'mice-squash',
    title: 'Mice Squash',
    description: 'Left click to squash bugs, right click to collect coins! Fast reflexes win!',
    icon: '🐜',
    href: '/games/mice-squash',
    color: '#f97316',
    tags: ['Action', 'Mouse Skills'],
    isNew: true,
  },
  {
    id: 'key-speed',
    title: 'Key Speed',
    description: 'Type falling letters as fast as you can! Build combos for bonus points!',
    icon: '⌨️',
    href: '/games/key-speed',
    color: '#8b5cf6',
    tags: ['Typing', 'Speed'],
    isNew: true,
  },
  {
    id: 'robot',
    title: 'Frog Hop Quest',
    description: 'Hop the pond with sequences — reach the golden lily in 15 levels',
    icon: '🐸',
    href: '/games/programming/robot',
    color: '#10b981',
    tags: ['Sequences', 'Commands'],
  },
  {
    id: 'frog-hop-quest-2',
    title: 'Frog Hop Quest 2',
    description: 'Huge maze grids — find the unique shortest hop route past rocks',
    icon: '🧭',
    href: '/games/programming/frog-hop-quest-2',
    color: '#059669',
    tags: ['Mazes', 'Planning'],
  },
  {
    id: 'functions',
    title: 'Frog Function Pond',
    description: 'Hop lily pads and bundle moves into reusable functions',
    icon: '🐸',
    href: '/games/programming/functions',
    color: '#10b981',
    tags: ['Functions', 'Abstraction'],
  },
  {
    id: 'functions-2',
    title: 'Frog Function Pond 2',
    description: 'Harder kernels — nest functions inside functions under tight script caps',
    icon: '🧬',
    href: '/games/programming/functions-2',
    color: '#6366f1',
    tags: ['Nesting', 'Composition'],
    isNew: true,
  },
  {
    id: 'event-pond',
    title: 'Bell Lily Pond',
    description: 'Bell pads trigger bonus hops — same idea as events in real apps',
    icon: '🔔',
    href: '/games/programming/event-pond',
    color: '#8b5cf6',
    tags: ['Events', 'Handlers'],
    isNew: true,
  },
  {
    id: 'variables',
    title: 'Variable Vault',
    description: 'Learn how computers store and manipulate data',
    icon: '📊',
    href: '/games/programming/variables',
    color: '#ec4899',
    tags: ['Variables', 'Memory'],
  },
  {
    id: 'case-cipher',
    title: 'Case Cipher',
    description: 'Timed typing — exact case; personal best in ms',
    icon: '🔐',
    href: '/games/programming/case-cipher',
    color: '#2dd4bf',
    tags: ['Speed', 'Case'],
    isNew: true,
  },
  {
    id: 'arrays',
    title: 'Array Pond',
    description: 'Help frogs reach lily pads using array methods!',
    icon: '🐸',
    href: '/games/programming/arrays',
    color: '#14b8a6',
    tags: ['Arrays', 'Methods'],
    isNew: true,
  },
  {
    id: 'loops',
    title: 'Loop Blaster',
    description: 'Blast aliens by writing for, while, and for…of loops!',
    icon: '💥',
    href: '/games/programming/loops',
    color: '#8b5cf6',
    tags: ['Loops', 'Shooting'],
  },
  {
    id: 'pattern-stack',
    title: 'Lilyfall',
    description: 'Pond Tetris: touch matching symbols to pop them and shrink the pond; clear full rows',
    icon: '🐸',
    href: '/games/programming/pattern-stack',
    color: '#34d399',
    tags: ['Tetris', 'Frog', 'Matching'],
    isNew: true,
  },
  {
    id: 'conditions',
    title: 'Under One Condition',
    description: 'Real maze ponds — 2, 3, and 5-route levels where you map the path before coding',
    icon: '🌓',
    href: '/games/deduction',
    color: '#f59e0b',
    tags: ['Conditions', 'If/Else', 'Frog'],
    isNew: true,
  },
  {
    id: 'logic-leap',
    title: 'Logic Leap',
    description: 'Jump through platforms by evaluating code conditions',
    icon: '🐸',
    href: '/games/programming/logic-leap',
    color: '#06b6d4',
    tags: ['Boolean', 'Operators'],
    comingSoon: true,
  },
  {
    id: 'debugging',
    title: 'Bug Hunter',
    description: 'Find and squash bugs in broken code!',
    icon: '🐛',
    href: '/games/programming/debugging',
    color: '#ef4444',
    tags: ['Debugging', 'Problem Solving'],
    isNew: true,
  },
];

export default function CodeQuestSection() {
  const router = useRouter();
  const { progress } = useGameStore();

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative bg-gradient-to-b from-purple-950/50 via-slate-950 to-slate-950">
      <FloatingShapes />
      
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-6"
      >
        <div className="flex items-center justify-between gap-3">
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="glass px-4 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors text-sm min-h-[44px] touch-target"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back to Hub
          </motion.button>

          <div className="glass px-4 py-2 rounded-xl text-center">
            <span className="text-gray-400 text-sm">{codeQuestGames.length} games</span>
          </div>
        </div>
      </motion.header>

      {/* Title Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 mb-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600/50 to-violet-600/30 mb-4">
          <span className="text-4xl">💻</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Code Quest</h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          Learn programming through fun interactive games! Master sequences, loops, functions and more.
        </p>
      </motion.div>

      {/* Games Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10"
      >
        <AnimatePresence>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {codeQuestGames.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
                level={progress.levelsByGame[game.id as keyof typeof progress.levelsByGame] || 1}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.section>
    </main>
  );
}

function GameCard({
  game,
  index,
  level,
}: {
  game: GameItem;
  index: number;
  level: number;
}) {
  if (game.comingSoon) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="h-full p-5 rounded-2xl relative overflow-hidden opacity-65 cursor-not-allowed"
        style={{
          background: `linear-gradient(135deg, ${game.color}12, ${game.color}05)`,
          border: `2px solid ${game.color}30`,
        }}
      >
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: `${game.color}30`, color: game.color }}
        >
          COMING SOON
        </div>
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-3"
          style={{
            background: `linear-gradient(135deg, ${game.color}40, ${game.color}20)`,
            boxShadow: `0 8px 20px ${game.color}30`,
          }}
        >
          {game.icon}
        </div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-1">{game.title}</h3>
        <p className="text-gray-400 text-xs sm:text-sm mb-3 line-clamp-2">{game.description}</p>
        {game.tags && (
          <div className="flex flex-wrap gap-1">
            {game.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: `${game.color}20`, color: `${game.color}` }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <Link href={game.href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="h-full p-5 rounded-2xl cursor-pointer group relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${game.color}15, ${game.color}05)`,
          border: `2px solid ${game.color}30`,
        }}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
      >
        {game.isNew && (
          <motion.div
            className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: `${game.color}30`, color: game.color }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            NEW
          </motion.div>
        )}

        <motion.div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-3"
          style={{
            background: `linear-gradient(135deg, ${game.color}40, ${game.color}20)`,
            boxShadow: `0 8px 20px ${game.color}30`,
          }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          {game.icon}
        </motion.div>

        <h3 className="text-base sm:text-lg font-bold text-white mb-1">{game.title}</h3>
        <p className="text-gray-400 text-xs sm:text-sm mb-3 line-clamp-2">{game.description}</p>

        {game.tags && (
          <div className="flex flex-wrap gap-1 mb-3">
            {game.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: `${game.color}20`, color: `${game.color}` }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Level {level}</span>
          <span className="text-sm font-semibold" style={{ color: game.color }}>
            Play →
          </span>
        </div>

        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${game.color}10, transparent 70%)`,
          }}
        />
      </motion.div>
    </Link>
  );
}
