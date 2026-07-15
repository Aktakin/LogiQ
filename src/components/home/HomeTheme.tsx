/** Cosmic palette — matches the rest of LogiQuest */
export const HOME = {
  purple: '#8b5cf6',
  purpleDeep: '#6b21a8',
  pink: '#ec4899',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  amber: '#fbbf24',
  glass: 'rgba(255,255,255,0.06)',
  ink: '#e2e8f0',
} as const;

export function LogiQuestMark({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const icon = size === 'lg' ? 40 : 24;

  return (
    <div
      className={`${
        size === 'lg' ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-12 h-12'
      } rounded-2xl bg-gradient-to-br from-purple-600/50 to-pink-600/30 border border-white/20 flex items-center justify-center shadow-lg shadow-purple-950/40 relative z-10`}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 4h3l1 3 3 1v3l-3 1-1 3H8l-1-3-3-1V8l3-1 1-3z"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="17.5" cy="17.5" r="2.5" stroke="white" strokeWidth="1.75" />
        <path d="M15.5 15.5L13 13" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    </div>
  );
}
