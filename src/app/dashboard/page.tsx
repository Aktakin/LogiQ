'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import FloatingShapes from '@/components/FloatingShapes';

type TabType = 'code-quest' | 'games' | 'programming';

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
    title: 'Under One Condition',
    description: 'If, else, and choices — then block code with two routes',
    icon: '🌓',
    href: '/games/deduction',
    color: '#f59e0b',
    tags: ['Conditions', 'If/Else'],
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

const programmingProjects: GameItem[] = [
  {
    id: 'rock-paper-scissors',
    title: '🪨 Rock Paper Scissors Showdown',
    description: 'Beat the computer! Type the code and make your game — win with rock, paper, or scissors!',
    icon: '✂️',
    href: '/games/programming/projects/rock-paper-scissors',
    color: '#8b5cf6',
    tags: ['Fun', 'Win or lose', 'Code it yourself'],
    isNew: true,
  },
  {
    id: 'guess-the-number',
    title: '🎲 Secret Number Challenge',
    description: 'Can you crack the secret number? Type the code and play — guess 1 to 10 and see if you’re right!',
    icon: '🎲',
    href: '/games/programming/projects/guess-the-number',
    color: '#06b6d4',
    tags: ['Mystery', 'Guess', 'You can do it'],
    isNew: true,
  },
  {
    id: 'pick-a-card',
    title: '🃏 Magic Card Deck',
    description: 'Draw a card and see what you get! Type the code and watch your deck come to life.',
    icon: '🃏',
    href: '/games/programming/projects/pick-a-card',
    color: '#10b981',
    tags: ['Lucky', 'Surprise', 'Arrays'],
    isNew: true,
  },
];

const tabs = [
  { id: 'code-quest' as TabType, label: 'Code Quest', icon: '💻', color: '#8b5cf6' },
  { id: 'games' as TabType, label: 'Games', icon: '🎮', color: '#06b6d4' },
  { id: 'programming' as TabType, label: 'Programming', icon: '⌨️', color: '#f59e0b' },
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
      case 'programming': return programmingProjects;
    }
  };

  const currentGames = getGamesForTab(activeTab);

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative">
      <FloatingShapes />
      
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-4 sm:mb-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <motion.h1
              className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1 truncate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Hello, <span className="text-pink-400">{playerName || 'Explorer'}</span>! 🌟
            </motion.h1>
            <motion.p
              className="text-gray-400 text-xs sm:text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Ready for some brain-boosting fun?
            </motion.p>
          </div>

          <motion.button
            onClick={() => router.push('/')}
            className="glass px-4 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors text-sm min-h-[44px] touch-target flex-shrink-0"
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
        className="relative z-10 mb-4 sm:mb-8"
      >
        <div className="flex gap-1 sm:gap-2 p-1.5 glass rounded-2xl overflow-x-auto">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 py-3 px-2 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-1.5 sm:gap-2 min-h-[48px] touch-target ${
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
              <span className="text-lg sm:text-xl flex-shrink-0">{tab.icon}</span>
              <span className="hidden xs:inline sm:inline truncate">{tab.label}</span>
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
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="flex-shrink-0">{tabs.find(t => t.id === activeTab)?.icon}</span>
            <span className="truncate">{tabs.find(t => t.id === activeTab)?.label}</span>
          </h2>
          <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0">
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
                  : 'grid-cols-1 md:grid-cols-2'
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
        className="mt-6 sm:mt-10 relative z-10"
      >
        <div 
          className="rounded-2xl p-4 sm:p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-left">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl sm:text-5xl flex-shrink-0"
              >
                🎁
              </motion.div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-0.5 sm:mb-1">
                  Daily Challenge
                </h3>
                <p className="text-gray-300 text-xs sm:text-sm">
                  Complete today&apos;s puzzle for bonus stars!
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-cosmic px-5 sm:px-6 py-2.5 text-sm min-h-[44px] touch-target w-full sm:w-auto"
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
        <h3 className="text-base sm:text-lg font-bold text-white mb-1 line-clamp-2">{game.title}</h3>

        {/* Description */}
        <p className="text-gray-400 text-xs sm:text-sm mb-3 line-clamp-2">{game.description}</p>

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
