'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import FloatingShapes from '@/components/FloatingShapes';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  badge?: string;
}

const kidsChallenges: Challenge[] = [
  {
    id: 'memory-match',
    title: 'Match the Pairs',
    description: 'Flip cards and find matching friends!',
    icon: '🧠',
    href: '/games/memory-match',
    color: '#ec4899',
    badge: 'Memory',
  },
  {
    id: 'sequences',
    title: 'What Comes Next?',
    description: 'See the pattern and pick the next number!',
    icon: '🔢',
    href: '/games/sequences',
    color: '#3b82f6',
    badge: 'Patterns',
  },
  {
    id: 'patterns',
    title: 'Find the Missing Shape',
    description: 'Which shape fits in the pattern?',
    icon: '🎨',
    href: '/games/patterns',
    color: '#8b5cf6',
    badge: 'Shapes',
  },
  {
    id: 'spatial',
    title: 'Shape Shifter',
    description: 'Find the matching shape before time runs out!',
    icon: '🧊',
    href: '/games/spatial',
    color: '#06b6d4',
    badge: 'Quick match',
  },
  {
    id: 'maze',
    title: 'Maze Runner',
    description: 'Find your way from start to the star!',
    icon: '🌀',
    href: '/games/maze',
    color: '#06b6d4',
    badge: 'Adventure',
  },
  {
    id: 'dino',
    title: 'Dino Runner',
    description: 'Jump over obstacles with your dino!',
    icon: '🦖',
    href: '/games/dino',
    color: '#10b981',
    badge: 'Action',
  },
  {
    id: 'deduction',
    title: 'Under One Condition',
    description: 'Help the robot choose the right path to the star!',
    icon: '🌓',
    href: '/games/deduction',
    color: '#f59e0b',
    badge: 'If & Then',
  },
  {
    id: 'robot',
    title: 'Robot Navigator',
    description: 'Tell the robot how to reach the goal!',
    icon: '🤖',
    href: '/games/programming/robot',
    color: '#3b82f6',
    badge: 'Commands',
  },
  {
    id: 'marble-shooter',
    title: 'Marble Blaster',
    description: 'Match colorful marbles and clear the board!',
    icon: '🐸',
    href: '/games/marble-shooter',
    color: '#8b5cf6',
    badge: 'Puzzle',
  },
];

export default function KidsCenterPage() {
  const router = useRouter();
  const { setAgeGroup, playerName, progress } = useGameStore();

  useEffect(() => {
    setAgeGroup('7-9');
  }, [setAgeGroup]);

  const idToStoreKey: Record<string, keyof typeof progress.levelsByGame> = {
    sequences: 'sequences',
    patterns: 'patterns',
    spatial: 'spatial',
    maze: 'maze',
    dino: 'dino',
    deduction: 'deduction',
    robot: 'programming',
  };
  const getLevel = (id: string) =>
    (idToStoreKey[id] && progress.levelsByGame[idToStoreKey[id]]) ?? 1;

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <FloatingShapes />

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-6 sm:mb-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <motion.button
            onClick={() => router.push('/')}
            className="glass px-4 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors min-h-[44px] touch-target text-sm sm:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Back to Home
          </motion.button>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🌟</span>
            <span className="text-amber-400 font-bold text-sm sm:text-base">Ages 5–9</span>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-8 sm:mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-2 border-amber-400/50 mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-4xl sm:text-5xl">👶</span>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 px-2">
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Kids Center
            </span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
            {playerName
              ? `Hi, ${playerName}! Pick a challenge and have fun! 🎉`
              : 'Pick a challenge and have fun! 🎉'}
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🎯</span> Your challenges
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kidsChallenges.map((challenge, index) => (
              <Link key={challenge.id} href={challenge.href}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="h-full p-4 sm:p-5 rounded-2xl cursor-pointer group relative overflow-hidden border-2 transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${challenge.color}20, ${challenge.color}08)`,
                    borderColor: `${challenge.color}40`,
                  }}
                  whileHover={{ scale: 1.03, y: -6 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {challenge.badge && (
                    <span
                      className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: `${challenge.color}40`, color: challenge.color }}
                    >
                      {challenge.badge}
                    </span>
                  )}
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl mb-3"
                    style={{
                      background: `linear-gradient(135deg, ${challenge.color}50, ${challenge.color}30)`,
                      boxShadow: `0 8px 20px ${challenge.color}30`,
                    }}
                  >
                    {challenge.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1 line-clamp-2 pr-16">
                    {challenge.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{challenge.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Level {getLevel(challenge.id)}</span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: challenge.color }}
                    >
                      Play →
                    </span>
                  </div>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at center, ${challenge.color}15, transparent 70%)`,
                    }}
                  />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-4 sm:p-6 text-center"
        >
          <p className="text-gray-400 text-sm">
            <span className="text-amber-400 font-semibold">Kids Center</span> is made for ages 5–9.
            Try the main <button type="button" onClick={() => router.push('/dashboard')} className="text-cyan-400 underline hover:text-cyan-300">Dashboard</button> for more challenges!
          </p>
        </motion.div>
      </div>
    </main>
  );
}
