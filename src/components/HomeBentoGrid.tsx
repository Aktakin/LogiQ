'use client';

import { motion } from 'framer-motion';
import { LogiQuestMark } from './home/HomeTheme';

const pillars = [
  { title: 'Code Quest', blurb: 'Sequences, loops, and functions', tint: 'from-purple-600/30 to-violet-600/10', accent: '#a78bfa' },
  { title: 'Logic Builders', blurb: 'Puzzles that stretch your thinking', tint: 'from-fuchsia-600/25 to-purple-600/10', accent: '#e879f9' },
  { title: 'Fun Games', blurb: 'Arcade skills with a purpose', tint: 'from-cyan-600/25 to-teal-600/10', accent: '#22d3ee' },
  { title: 'Favourite', blurb: 'Hand-picked adventures to start', tint: 'from-rose-600/25 to-pink-600/10', accent: '#fb7185' },
];

export function HomeBentoGrid({
  playerName,
  onStart,
}: {
  playerName: string;
  onStart: () => void;
}) {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 sm:gap-8">
      {/* Hero — one composition */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass rounded-3xl p-8 sm:p-12 border border-white/10 relative overflow-hidden text-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/15 pointer-events-none" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="mb-5"
          >
            <LogiQuestMark size="lg" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-3"
          >
            Logi<span className="text-pink-400">Quest</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="text-gray-300 text-base sm:text-lg max-w-md mx-auto mb-2"
          >
            Logic &amp; coding adventures for curious minds ages 7–12
          </motion.p>

          {playerName ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.32 }}
              className="text-sm text-gray-400 mb-8"
            >
              Welcome back, <span className="text-pink-400 font-semibold">{playerName}</span>
            </motion.p>
          ) : (
            <div className="mb-8" />
          )}

          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="btn-cosmic px-10 py-4 rounded-xl text-lg font-semibold min-h-[48px] shadow-lg shadow-purple-900/40"
          >
            {playerName ? 'Continue adventure' : 'Start exploring'}
          </motion.button>
        </div>
      </motion.section>

      {/* Feature pillars — same glass language as dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {pillars.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.07 }}
            className={`glass rounded-2xl p-5 border border-white/10 bg-gradient-to-br ${p.tint}`}
          >
            <div
              className="w-2 h-2 rounded-full mb-3"
              style={{ backgroundColor: p.accent, boxShadow: `0 0 12px ${p.accent}` }}
            />
            <h2 className="text-white font-bold text-lg mb-1">{p.title}</h2>
            <p className="text-gray-400 text-sm">{p.blurb}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
