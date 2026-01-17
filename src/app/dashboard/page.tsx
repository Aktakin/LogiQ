'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import FloatingShapes from '@/components/FloatingShapes';

type TabType = 'code-quest' | 'games' | 'more-challenges';

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

const codeQuestGames: GameItem[] = [
  {
    id: 'robot',
    title: 'Robot Navigator',
    description: 'Guide the robot through mazes using movement commands',
    icon: '🤖',
    href: '/games/programming/robot',
    color: '#3b82f6',
    tags: ['Sequences', 'Commands'],
  },
  {
    id: 'functions',
    title: 'Function Factory',
    description: 'Create your own reusable command blocks',
    icon: '📦',
    href: '/games/programming/functions',
    color: '#10b981',
    tags: ['Functions', 'Abstraction'],
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
    title: 'Loop Master',
    description: 'Master the power of repetition with loops',
    icon: '🔄',
    href: '/games/programming/loops',
    color: '#8b5cf6',
    tags: ['Loops', 'Repetition'],
  },
  {
    id: 'conditions',
    title: 'If-Then Detective',
    description: 'Make decisions with conditional logic',
    icon: '🔍',
    href: '/games/programming/conditions',
    color: '#f59e0b',
    tags: ['Conditions', 'Logic'],
  },
  {
    id: 'logic-leap',
    title: 'Logic Leap',
    description: 'Jump through platforms by evaluating code conditions',
    icon: '🐸',
    href: '/games/programming/logic-leap',
    color: '#06b6d4',
    tags: ['Boolean', 'Operators'],
    isNew: true,
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

const funGames: GameItem[] = [
  {
    id: 'dino',
    title: 'Space Dino Runner',
    description: 'Jump over obstacles and survive as long as you can!',
    icon: '🦖',
    href: '/games/dino',
    color: '#10b981',
    tags: ['Endless Runner', 'Action'],
    isNew: true,
  },
  {
    id: 'maze',
    title: 'Maze Runner',
    description: 'Navigate through randomly generated mazes',
    icon: '🌀',
    href: '/games/maze',
    color: '#06b6d4',
    tags: ['Puzzle', 'Navigation'],
  },
  {
    id: 'marble-shooter',
    title: 'Marble Blaster',
    description: 'Match 3+ colored marbles to clear the path!',
    icon: '🐸',
    href: '/games/marble-shooter',
    color: '#8b5cf6',
    tags: ['Puzzle', 'Shooter'],
    isNew: true,
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Find matching pairs and test your memory!',
    icon: '🧠',
    href: '/games/memory-match',
    color: '#ec4899',
    tags: ['Memory', 'Puzzle'],
    isNew: true,
  },
];

const moreChallenges: GameItem[] = [
  {
    id: 'patterns',
    title: 'Pattern Quest',
    description: 'Find the missing piece in colorful patterns',
    icon: '🎨',
    href: '/games/patterns',
    color: '#ec4899',
    tags: ['Patterns', 'Visual'],
  },
  {
    id: 'sequences',
    title: 'Sequence Master',
    description: 'Discover what comes next in the sequence',
    icon: '🔢',
    href: '/games/sequences',
    color: '#3b82f6',
    tags: ['Numbers', 'Logic'],
  },
  {
    id: 'deduction',
    title: 'Logic Detective',
    description: 'Use clues to solve mysteries',
    icon: '🕵️',
    href: '/games/deduction',
    color: '#10b981',
    tags: ['Deduction', 'Clues'],
  },
  {
    id: 'spatial',
    title: 'Shape Shifter',
    description: 'Rotate and match shapes in space',
    icon: '🧊',
    href: '/games/spatial',
    color: '#f97316',
    tags: ['Spatial', '3D'],
  },
];

const tabs = [
  { id: 'code-quest' as TabType, label: 'Code Quest', icon: '💻', color: '#8b5cf6' },
  { id: 'games' as TabType, label: 'Games', icon: '🎮', color: '#06b6d4' },
  { id: 'more-challenges' as TabType, label: 'More Challenges', icon: '🎯', color: '#f59e0b' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { ageGroup, playerName, progress } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabType>('code-quest');

  useEffect(() => {
    if (!ageGroup) {
      router.push('/');
    }
  }, [ageGroup, router]);

  if (!ageGroup) return null;


  const getGamesForTab = (tab: TabType): GameItem[] => {
    switch (tab) {
      case 'code-quest': return codeQuestGames;
      case 'games': return funGames;
      case 'more-challenges': return moreChallenges;
    }
  };

  const currentGames = getGamesForTab(activeTab);

  return (
    <main className="min-h-screen p-4 md:p-8 relative">
      <FloatingShapes />
      
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <motion.h1
              className="text-2xl md:text-3xl font-bold text-white mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Hello, <span className="text-pink-400">{playerName || 'Explorer'}</span>! 🌟
            </motion.h1>
            <motion.p
              className="text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Ready for some brain-boosting fun?
            </motion.p>
          </div>

          <motion.button
            onClick={() => router.push('/')}
            className="glass px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-colors text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⚙️ Settings
          </motion.button>
        </div>
      </motion.header>


      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 mb-8"
      >
        <div className="flex gap-2 p-1.5 glass rounded-2xl">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm md:text-base transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? `${tab.color}40` : 'transparent',
                border: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent',
              }}
              whileHover={{ scale: activeTab === tab.id ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10"
      >
        {/* Tab Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span>{tabs.find(t => t.id === activeTab)?.icon}</span>
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <span className="text-gray-500 text-sm">
            {currentGames.length} {currentGames.length === 1 ? 'game' : 'games'}
          </span>
        </div>

        {/* Games Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`grid gap-4 ${
              activeTab === 'code-quest' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : activeTab === 'games'
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {currentGames.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
                level={progress.levelsByGame[game.id as keyof typeof progress.levelsByGame] || 1}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State for Games tab */}
        {activeTab === 'games' && currentGames.length === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 glass rounded-2xl p-6 text-center"
          >
            <span className="text-4xl mb-3 block">🎮</span>
            <p className="text-gray-400">More games coming soon!</p>
          </motion.div>
        )}
      </motion.section>

      {/* Quick Stats Footer */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-10 relative z-10"
      >
        <div 
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-5xl"
              >
                🎁
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Daily Challenge
                </h3>
                <p className="text-gray-300 text-sm">
                  Complete today&apos;s puzzle for bonus stars!
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-cosmic px-6 py-2.5 text-sm"
            >
              <span>Play Now →</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
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
        transition={{ delay: index * 0.05 }}
        className="h-full p-5 rounded-2xl cursor-pointer group relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${game.color}15, ${game.color}05)`,
          border: `2px solid ${game.color}30`,
        }}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* New Badge */}
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

        {/* Icon */}
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

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-1">{game.title}</h3>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{game.description}</p>

        {/* Tags */}
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

        {/* Level & Play */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Level {level}</span>
          <span className="text-sm font-semibold" style={{ color: game.color }}>
            Play →
          </span>
        </div>

        {/* Hover glow */}
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
