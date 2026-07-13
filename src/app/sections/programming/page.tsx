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
    description: "Can you crack the secret number? Type the code and play - guess 1 to 10 and see if you're right!",
    icon: '🎲',
    href: '/games/programming/projects/guess-the-number',
    color: '#06b6d4',
    tags: ['Mystery', 'Guess', 'You can do it'],
    isNew: true,
  },
  {
    id: 'coin-flip',
    title: '🪙 Coin Flip Challenge',
    description: 'Heads or tails! Type the code, flip the coin, and track your wins against the computer!',
    icon: '🪙',
    href: '/games/programming/projects/coin-flip',
    color: '#f59e0b',
    tags: ['Luck', 'Win or lose', 'Code it yourself'],
    isNew: true,
  },
  {
    id: 'memory-match',
    title: '🪷 Lily Pad Memory Match',
    description: 'A full memory card game! ~500+ lines of HTML, CSS and JS — shuffle, timer, hints, and win screen!',
    icon: '🪷',
    href: '/games/programming/projects/memory-match',
    color: '#10b981',
    tags: ['Memory', 'Big project', 'Arrays'],
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
    comingSoon: true,
  },
];

export default function ProgrammingSection() {
  const router = useRouter();
  const { progress } = useGameStore();

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative bg-gradient-to-b from-amber-950/50 via-slate-950 to-slate-950">
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
            <span className="text-gray-400 text-sm">{programmingProjects.length} projects</span>
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
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-600/50 to-orange-600/30 mb-4">
          <span className="text-4xl">⌨️</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Coding Projects</h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          Build real mini-projects by typing actual code! Create games you can play.
        </p>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="relative z-10 mb-8 glass rounded-2xl p-4 sm:p-5 border border-amber-500/30"
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl sm:text-3xl">💡</div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm sm:text-base mb-1">
              Write Real Code!
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              These projects let you type actual JavaScript code and see it run immediately. 
              Build games, solve puzzles, and learn how real programmers code!
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['JavaScript', 'Variables', 'Functions', 'Logic', 'Real Projects'].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs text-amber-200"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Projects Grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10"
      >
        <AnimatePresence>
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {programmingProjects.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
                level={progress.levelsByGame[game.id as keyof typeof progress.levelsByGame] || 1}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* More projects coming banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 glass rounded-2xl p-6 text-center border border-amber-500/30"
        >
          <span className="text-4xl mb-3 block">🚀</span>
          <h3 className="text-lg font-bold text-white mb-1">More projects coming soon!</h3>
          <p className="text-gray-400 text-sm">Build more games and apps with real code!</p>
        </motion.div>
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
            Start →
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
