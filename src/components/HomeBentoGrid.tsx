'use client';

import { motion } from 'framer-motion';
import { AccentMarks, GridPattern, HOME, LogiQuestMark } from './home/HomeTheme';

const highlights = [
  { label: 'Fun Games', color: '#3949AB' },
  { label: 'Smart Puzzles', color: '#2D9B83' },
  { label: 'Earn Stars', color: '#FF8A65' },
  { label: 'Track Progress', color: '#4FC3F7' },
];

export function HomeBentoGrid({
  playerName,
  onStart,
}: {
  playerName: string;
  onStart: () => void;
}) {
  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
      {/* Hero — royal blue */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="md:col-span-7 rounded-[1.75rem] sm:rounded-[2rem] p-6 sm:p-8 text-white relative overflow-hidden min-h-[220px] flex flex-col justify-between"
        style={{ backgroundColor: HOME.blue }}
      >
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        />
        <div>
          <p className="text-sm sm:text-base font-semibold text-white/90 leading-snug max-w-xs">
            Logic &amp; coding for curious minds
          </p>
        </div>
        <div className="flex justify-center py-4 relative">
          <AccentMarks />
          <LogiQuestMark size="lg" />
        </div>
        {playerName && (
          <p className="text-center text-sm text-white/80">
            Welcome back, <span className="font-bold text-[#FFE566]">{playerName}</span>
          </p>
        )}
      </motion.section>

      {/* Yellow pattern card */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="md:col-span-5 rounded-[1.75rem] sm:rounded-[2rem] p-5 sm:p-6 relative overflow-hidden flex flex-col justify-center"
        style={{ backgroundColor: HOME.yellow }}
      >
        <GridPattern />
        <p className="relative z-10 text-sm sm:text-base font-bold leading-snug mb-4" style={{ color: HOME.ink }}>
          Learn by playing.
          <br />
          Grow by building.
        </p>
        <div className="relative z-10 grid grid-cols-2 gap-2">
          {highlights.map((h) => (
            <div
              key={h.label}
              className="rounded-xl bg-white/70 px-3 py-2.5 text-xs font-semibold text-center shadow-sm"
              style={{ color: h.color }}
            >
              {h.label}
            </div>
          ))}
        </div>
      </motion.section>

      {/* Teal age banner */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="md:col-span-4 rounded-[1.75rem] sm:rounded-[2rem] px-5 py-4 flex items-center gap-3 relative overflow-hidden"
        style={{ backgroundColor: HOME.teal }}
      >
        <div className="relative shrink-0">
          <AccentMarks className="scale-75" />
          <LogiQuestMark size="sm" />
        </div>
        <p className="text-white font-bold text-sm sm:text-base leading-tight">
          Designed for kids ages 7–12
        </p>
      </motion.section>

      {/* Brand strip */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="md:col-span-8 rounded-[1.75rem] sm:rounded-[2rem] py-5 sm:py-6 flex items-center justify-center"
        style={{ backgroundColor: HOME.blue }}
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight lowercase">
          logiquest
        </h1>
      </motion.section>

      {/* Yellow bullets */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="md:col-span-6 rounded-[1.75rem] sm:rounded-[2rem] p-5 sm:p-6 flex items-center gap-4"
        style={{ backgroundColor: HOME.yellow }}
      >
        <LogiQuestMark size="sm" variant="onLight" />
        <ul className="text-sm sm:text-base font-semibold space-y-1" style={{ color: HOME.blue }}>
          <li>• A playful teacher.</li>
          <li>• A puzzle challenger.</li>
          <li>• A coding companion.</li>
        </ul>
      </motion.section>

      {/* Coral CTA */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="md:col-span-6 rounded-[1.75rem] sm:rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between gap-4"
        style={{ backgroundColor: HOME.coral }}
      >
        <div>
          <p className="font-bold text-base sm:text-lg leading-snug mb-1" style={{ color: HOME.ink }}>
            Talk, learn, explore.
          </p>
          <p className="text-sm text-[#5c4a42] leading-relaxed">
            Code Quest, puzzles, and projects — variables, loops, conditions, and more in your browser.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="w-full py-4 rounded-full font-bold text-white text-base sm:text-lg min-h-[48px] shadow-lg transition-colors"
          style={{ backgroundColor: HOME.blue }}
        >
          {playerName ? 'Continue' : 'Get started'}
        </motion.button>
      </motion.section>
    </div>
  );
}
