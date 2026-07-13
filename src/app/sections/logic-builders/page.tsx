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

const logicBuildersGames: GameItem[] = [
  {
    id: 'matrix-reasoning',
    title: 'Matrix Mind',
    description: 'Complete visual matrices to spot abstract rules and patterns.',
    icon: '🧩',
    href: '/games/logic-builders/matrix-reasoning',
    color: '#8b5cf6',
    tags: ['Matrix', 'Abstract'],
    isNew: true,
  },
  {
    id: 'analogy-lab',
    title: 'Analogy Lab',
    description: 'A is to B as C is to ? Map relationships and transform shapes.',
    icon: '🔗',
    href: '/games/logic-builders/analogy-lab',
    color: '#06b6d4',
    tags: ['Analogy', 'Mapping'],
    isNew: true,
  },
  {
    id: 'transitive-trails',
    title: 'Transitive Trails',
    description: 'Use "A > B > C" clues to infer the hidden order.',
    icon: '🧭',
    href: '/games/logic-builders/transitive-trails',
    color: '#10b981',
    tags: ['Inference', 'Order'],
    isNew: true,
  },
  {
    id: 'rule-switch',
    title: 'Rule Switch',
    description: 'Sort cards by the rule — then adapt when the rule changes.',
    icon: '🔀',
    href: '/games/logic-builders/rule-switch',
    color: '#f59e0b',
    tags: ['Flexibility', 'Attention'],
    isNew: true,
  },
  {
    id: 'syllogism-snap',
    title: 'Syllogism Snap',
    description: 'Pick the conclusion that must be true from simple statements.',
    icon: '✅',
    href: '/games/logic-builders/syllogism-snap',
    color: '#ec4899',
    tags: ['Deduction', 'Reasoning'],
    isNew: true,
  },
  {
    id: 'truth-gates',
    title: 'Truth Gates',
    description: 'Feed shapes through AND, OR, NOT gates and predict the output!',
    icon: '⚡',
    href: '/games/logic-builders/truth-gates',
    color: '#f59e0b',
    tags: ['Boolean', 'Gates'],
    isNew: true,
  },
  {
    id: 'loop-lab',
    title: 'Loop Lab',
    description: 'How many shapes does the loop create? Count and predict!',
    icon: '🔄',
    href: '/games/logic-builders/loop-lab',
    color: '#3b82f6',
    tags: ['Loops', 'Counting'],
    isNew: true,
  },
  {
    id: 'output-oracle',
    title: 'Output Oracle',
    description: 'Read the code, pick the shapes it produces!',
    icon: '🔮',
    href: '/games/logic-builders/output-oracle',
    color: '#8b5cf6',
    tags: ['Code Reading', 'Prediction'],
    isNew: true,
  },
  {
    id: 'shape-sorter',
    title: 'Shape Sorter',
    description: 'Filter shapes with JS conditions — which ones pass?',
    icon: '🗂️',
    href: '/games/logic-builders/shape-sorter',
    color: '#06b6d4',
    tags: ['Filter', 'Arrays'],
    isNew: true,
  },
  {
    id: 'color-coder',
    title: 'Color Coder',
    description: 'Trace color variables through code — what color is the result?',
    icon: '🎨',
    href: '/games/logic-builders/color-coder',
    color: '#ec4899',
    tags: ['Variables', 'Tracing'],
    isNew: true,
  },
];

export default function LogicBuildersSection() {
  const router = useRouter();
  const { progress } = useGameStore();

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative bg-gradient-to-b from-fuchsia-950/50 via-slate-950 to-slate-950">
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
            <span className="text-gray-400 text-sm">{logicBuildersGames.length} games</span>
          </div>
        </div>
      </motion.header>

      {/* Title Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 mb-6 text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-fuchsia-600/50 to-purple-600/30 mb-4">
          <span className="text-4xl">🧩</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Logic Builders</h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          Build your brain power with logic puzzles and reasoning challenges!
        </p>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="relative z-10 mb-8 glass rounded-2xl p-4 sm:p-5 border border-purple-500/30"
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl sm:text-3xl">🧠</div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm sm:text-base mb-1">
              Research-backed logic assessments
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              These assessments are inspired by cognitive science tasks that build
              abstract reasoning, analogical mapping, transitive inference,
              cognitive flexibility, and syllogistic deduction.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['Matrix reasoning', 'Analogies', 'Transitive inference', 'Rule switching', 'Syllogisms'].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs text-purple-200"
                  style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
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
            {logicBuildersGames.map((game, index) => (
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
