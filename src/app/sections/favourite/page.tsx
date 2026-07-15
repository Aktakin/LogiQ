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
}

const favouriteGames: GameItem[] = [
  {
    id: 'functions-2',
    title: 'Frog Function Pond 2',
    description: 'Harder kernels — nest functions inside functions under tight script caps',
    icon: '🐸',
    href: '/games/programming/functions-2',
    color: '#7c3aed',
    tags: ['Nesting', 'Composition'],
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
    id: 'functions',
    title: 'Frog Function Pond',
    description: 'Hop lily pads and bundle moves into reusable functions',
    icon: '🐸',
    href: '/games/programming/functions',
    color: '#10b981',
    tags: ['Functions', 'Abstraction'],
  },
  {
    id: 'rock-paper-scissors',
    title: 'Rock Paper Scissors Showdown',
    description: 'Beat the computer! Type the code and make your game — win with rock, paper, or scissors!',
    icon: '✂️',
    href: '/games/programming/projects/rock-paper-scissors',
    color: '#8b5cf6',
    tags: ['Fun', 'Win or lose', 'Code it yourself'],
    isNew: true,
  },
  {
    id: 'memory-match',
    title: 'Lily Pad Memory Match',
    description: 'Full memory card game — ~500+ lines of HTML, CSS and JS with timer, hints, and win screen!',
    icon: '🪷',
    href: '/games/programming/projects/memory-match',
    color: '#10b981',
    tags: ['Memory', 'Big project', 'Code it yourself'],
    isNew: true,
  },
];

export default function FavouriteSection() {
  const router = useRouter();
  const { progress } = useGameStore();

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative bg-gradient-to-b from-rose-950/50 via-slate-950 to-slate-950">
      <FloatingShapes />

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
            <span className="text-gray-400 text-sm">{favouriteGames.length} games</span>
          </div>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 mb-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-600/50 to-pink-600/30 mb-4">
          <span className="text-4xl">⭐</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Favourite</h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          Hand-picked games to jump into fast — including Frog Function Pond 2, conditions, arrays, and more!
        </p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10"
      >
        <AnimatePresence>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favouriteGames.map((game, index) => (
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
