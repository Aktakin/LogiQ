'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import FloatingShapes from '@/components/FloatingShapes';
import {
  CategoryLineIcon,
  LineGridIcon,
  LineSettingsIcon,
  LineStarIcon,
  type CategoryIconId,
} from '@/components/CategoryLineIcon';

interface Category {
  id: CategoryIconId;
  title: string;
  description: string;
  color: string;
  bgGradient: string;
  href: string;
  gameCount: number;
  features: string[];
}

const categories: Category[] = [
  {
    id: 'favourite',
    title: 'Favourite',
    description: 'Hand-picked games to jump into fast — variables, conditions, arrays, functions and more!',
    color: '#f43f5e',
    bgGradient: 'from-rose-600/30 to-pink-600/20',
    href: '/sections/favourite',
    gameCount: 8,
    features: ['Variables', 'Conditions', 'Arrays', 'Functions'],
  },
  {
    id: 'code-quest',
    title: 'Code Quest',
    description: 'Learn programming through fun interactive games! Master sequences, loops, functions and more.',
    color: '#8b5cf6',
    bgGradient: 'from-purple-600/30 to-violet-600/20',
    href: '/sections/code-quest',
    gameCount: 15,
    features: ['Sequences', 'Functions', 'Loops', 'Variables'],
  },
  {
    id: 'logic-builders',
    title: 'Logic Builders',
    description: 'Build your brain power with logic puzzles and reasoning challenges!',
    color: '#a855f7',
    bgGradient: 'from-fuchsia-600/30 to-purple-600/20',
    href: '/sections/logic-builders',
    gameCount: 10,
    features: ['Patterns', 'Reasoning', 'Problem Solving', 'Deduction'],
  },
  {
    id: 'games',
    title: 'Fun Games',
    description: 'Enjoy exciting arcade and puzzle games while learning valuable skills!',
    color: '#06b6d4',
    bgGradient: 'from-cyan-600/30 to-teal-600/20',
    href: '/sections/games',
    gameCount: 5,
    features: ['Arcade', 'Puzzles', 'Memory', 'Action'],
  },
  {
    id: 'game-dev',
    title: 'Game Dev Studio',
    description: 'Learn to create your own video games! Design characters, levels, and game mechanics.',
    color: '#ef4444',
    bgGradient: 'from-red-600/30 to-rose-600/20',
    href: '/sections/game-dev',
    gameCount: 1,
    features: ['Sprites', 'Physics', 'Level Design', 'Game Logic'],
  },
  {
    id: 'programming',
    title: 'Coding Projects',
    description: 'Build real mini-projects by typing actual code! Create games you can play.',
    color: '#f59e0b',
    bgGradient: 'from-amber-600/30 to-orange-600/20',
    href: '/sections/programming',
    gameCount: 5,
    features: ['Real Code', 'Projects', 'Interactive', 'Build Games'],
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { ageGroup, playerName, progress } = useGameStore();

  useEffect(() => {
    if (!ageGroup) {
      router.push('/');
    }
  }, [ageGroup, router]);

  if (!ageGroup) return null;

  const totalGames = categories.reduce((sum, cat) => sum + cat.gameCount, 0);
  const totalStars = progress.totalStars || 0;

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative">
      <FloatingShapes />
      
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-6 sm:mb-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Hello, <span className="text-pink-400">{playerName || 'Explorer'}</span>!
            </motion.h1>
            <motion.p
              className="text-gray-400 text-sm sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Choose a category to start your adventure
            </motion.p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Stats badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="glass px-3 py-2 rounded-xl text-center"
            >
              <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-lg sm:text-xl font-bold">
                <LineStarIcon size={18} />
                {totalStars}
              </div>
              <div className="text-gray-400 text-xs">Stars</div>
            </motion.div>

            <motion.button
              onClick={() => router.push('/')}
              className="glass px-3 sm:px-4 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors text-sm min-h-[44px] touch-target flex-shrink-0 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Settings"
              aria-label="Settings"
            >
              <LineSettingsIcon />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Category Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {categories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>
      </motion.section>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative z-10"
      >
        <div className="glass rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10">
                <LineGridIcon size={28} className="text-white/90" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                  {totalGames} Games Available
                </h3>
                <p className="text-gray-400 text-sm">
                  Explore all categories and collect stars!
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              {categories.map((cat) => (
                <motion.div
                  key={cat.id}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10"
                  whileHover={{ scale: 1.05 }}
                >
                  <CategoryLineIcon id={cat.id} size={22} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

function CategoryCard({ category, index }: { category: Category; index: number }) {
  return (
    <Link href={category.href}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 + index * 0.1 }}
        className={`relative p-5 sm:p-6 rounded-2xl cursor-pointer group overflow-hidden bg-gradient-to-br ${category.bgGradient}`}
        style={{ border: `2px solid ${category.color}40` }}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Game count badge */}
        <div
          className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold"
          style={{ backgroundColor: `${category.color}30`, color: category.color }}
        >
          {category.gameCount} games
        </div>

        {/* Icon */}
        <motion.div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-4 bg-white/5 border border-white/15"
          style={{
            boxShadow: `0 8px 24px ${category.color}25`,
          }}
          whileHover={{ scale: 1.05 }}
        >
          <CategoryLineIcon id={category.id} size={36} className="text-white" />
        </motion.div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{category.title}</h2>

        {/* Description */}
        <p className="text-gray-300 text-sm sm:text-base mb-4 line-clamp-2">
          {category.description}
        </p>

        {/* Feature tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {category.features.map((feature) => (
            <span
              key={feature}
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${category.color}25`, color: category.color }}
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Explore button */}
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
            Explore
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </span>
        </div>

        {/* Hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${category.color}15, transparent 70%)`,
          }}
        />
      </motion.div>
    </Link>
  );
}
