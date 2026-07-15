import { motion } from 'framer-motion';

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function FeatureIcon({ type }: { type: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="text-slate-200" aria-hidden>
      {type === 'games' && (
        <>
          <path
            {...iconProps}
            d="M8 14h2v2H8zM14 13h2v2h-2zM6 10h12a3 3 0 013 3v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1a3 3 0 013-3z"
          />
          <path {...iconProps} d="M8.5 10V8a3.5 3.5 0 017 0v2" />
        </>
      )}
      {type === 'puzzles' && (
        <>
          <path {...iconProps} d="M8 4h3l1 3 3 1v3l-3 1-1 3H8l-1-3-3-1V8l3-1 1-3z" />
          <circle {...iconProps} cx="17.5" cy="17.5" r="2.5" />
        </>
      )}
      {type === 'stars' && (
        <path
          {...iconProps}
          d="M12 3.5l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.7l5-.7L12 3.5z"
        />
      )}
      {type === 'progress' && (
        <path {...iconProps} d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
      )}
    </svg>
  );
}

const features = [
  {
    id: 'games',
    title: 'Fun Games',
    description: 'Arcade action and quick puzzles',
    accent: '#38bdf8',
  },
  {
    id: 'puzzles',
    title: 'Smart Puzzles',
    description: 'Logic, patterns, and reasoning',
    accent: '#a78bfa',
  },
  {
    id: 'stars',
    title: 'Earn Stars',
    description: 'Clear levels and collect rewards',
    accent: '#fbbf24',
  },
  {
    id: 'progress',
    title: 'Track Progress',
    description: 'Pick up where you left off',
    accent: '#34d399',
  },
];

export function HomeFeatureCards() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 sm:mb-10 max-w-xl mx-auto w-full"
    >
      {features.map((feature, i) => (
        <motion.div
          key={feature.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 + i * 0.08 }}
          whileHover={{ y: -2 }}
          className="flex items-start gap-3 rounded-xl border border-slate-600/50 bg-slate-800/40 backdrop-blur-sm px-4 py-3.5"
          style={{ borderLeftWidth: 3, borderLeftColor: feature.accent }}
        >
          <div className="w-9 h-9 rounded-lg bg-slate-700/60 border border-slate-600/50 flex items-center justify-center shrink-0">
            <FeatureIcon type={feature.id} />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-slate-100 text-sm">{feature.title}</p>
            <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{feature.description}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
