/** Doozy-inspired palette for LogiQuest home */
export const HOME = {
  blue: '#3949AB',
  blueDark: '#283593',
  yellow: '#FFE566',
  yellowDark: '#F5D547',
  teal: '#2D9B83',
  tealDark: '#238B74',
  coral: '#FFB4A2',
  coralDark: '#FF9A85',
  canvas: '#F7F2EC',
  white: '#FFFFFF',
  ink: '#1A1A2E',
} as const;

const DROP_COLORS = ['#FFE566', '#FF8A65', '#4FC3F7', '#81C784', '#FFB74D', '#F06292'];

export function AccentMarks({ className = '' }: { className?: string }) {
  const drops = [
    { x: -28, y: -20, r: -35, c: 0 },
    { x: 32, y: -24, r: 25, c: 1 },
    { x: -36, y: 18, r: -55, c: 2 },
    { x: 38, y: 12, r: 45, c: 3 },
    { x: -8, y: -38, r: 0, c: 4 },
    { x: 10, y: 36, r: 180, c: 5 },
    { x: -42, y: -4, r: -70, c: 0 },
    { x: 44, y: -6, r: 60, c: 1 },
  ];

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden>
      {drops.map((d, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 w-2.5 h-3.5 sm:w-3 sm:h-4 rounded-full"
          style={{
            backgroundColor: DROP_COLORS[d.c % DROP_COLORS.length],
            transform: `translate(calc(-50% + ${d.x}px), calc(-50% + ${d.y}px)) rotate(${d.r}deg)`,
            borderRadius: '60% 60% 60% 10%',
          }}
        />
      ))}
    </div>
  );
}

export function GridPattern({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none opacity-25 rounded-[inherit] ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(rgba(57, 73, 171, 0.15) 1.5px, transparent 1.5px),
          linear-gradient(90deg, rgba(57, 73, 171, 0.15) 1.5px, transparent 1.5px)
        `,
        backgroundSize: '28px 28px',
      }}
    />
  );
}

export function LogiQuestMark({ size = 'lg', variant = 'onBlue' }: { size?: 'sm' | 'lg'; variant?: 'onBlue' | 'onLight' }) {
  const box = size === 'lg' ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-12 h-12';
  const icon = size === 'lg' ? 40 : 24;
  const stroke = variant === 'onBlue' ? 'white' : HOME.blue;
  const boxClass =
    variant === 'onBlue'
      ? 'bg-white/15 backdrop-blur-sm border-2 border-white/25'
      : 'bg-white border-2 shadow-sm';
  const boxStyle = variant === 'onLight' ? { borderColor: `${HOME.blue}33` } : undefined;

  return (
    <div
      className={`${box} rounded-2xl ${boxClass} flex items-center justify-center shadow-lg relative z-10`}
      style={boxStyle}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 4h3l1 3 3 1v3l-3 1-1 3H8l-1-3-3-1V8l3-1 1-3z"
          stroke={stroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="17.5" cy="17.5" r="2.5" stroke={stroke} strokeWidth="1.75" />
        <path d="M15.5 15.5L13 13" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    </div>
  );
}
