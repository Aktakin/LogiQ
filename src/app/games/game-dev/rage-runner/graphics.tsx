'use client';

import { motion } from 'framer-motion';

export type GameTheme = 'lava' | 'forest' | 'neon';

export interface CharacterConfig {
  bodyColor: string;
  skinColor: string;
  accessory: 'none' | 'cap' | 'crown' | 'visor' | 'headphones';
  trail: 'none' | 'fire' | 'sparkle' | 'neon';
  name: string;
}

export type CityBuildingType = 'skyscraper' | 'house' | 'shop' | 'tree' | 'lamp' | 'billboard';

export interface EnvironmentConfig {
  sky: 'sunset' | 'day' | 'night' | 'storm';
  ground: 'asphalt' | 'neon' | 'brick';
  slots: (CityBuildingType | null)[];
}

export const DEFAULT_CHARACTER: CharacterConfig = {
  bodyColor: '#f97316',
  skinColor: '#fbbf24',
  accessory: 'none',
  trail: 'fire',
  name: 'Runner',
};

export const DEFAULT_ENVIRONMENT: EnvironmentConfig = {
  sky: 'sunset',
  ground: 'asphalt',
  slots: ['skyscraper', 'house', null, 'shop', 'tree', 'skyscraper', null, 'lamp', 'billboard', 'house'],
};

export const SKY_GRADIENTS: Record<EnvironmentConfig['sky'], string> = {
  sunset: 'linear-gradient(180deg, #1e1b4b 0%, #7c2d12 35%, #ea580c 70%, #fbbf24 100%)',
  day: 'linear-gradient(180deg, #38bdf8 0%, #7dd3fc 40%, #bae6fd 100%)',
  night: 'linear-gradient(180deg, #020617 0%, #1e1b4b 50%, #312e81 100%)',
  storm: 'linear-gradient(180deg, #0f172a 0%, #334155 50%, #475569 100%)',
};

interface ThemeVisual {
  sky: string;
  mid: string;
  ground: string;
  track: string;
  trackGlow: string;
  accent: string;
  particle: string;
}

export const THEME_VISUALS: Record<GameTheme, ThemeVisual> = {
  lava: {
    sky: 'linear-gradient(180deg, #1a0a0a 0%, #3d1212 40%, #7c2d12 100%)',
    mid: '#ea580c',
    ground: 'linear-gradient(180deg, #451a03 0%, #292524 100%)',
    track: '#ea580c',
    trackGlow: 'rgba(234, 88, 12, 0.5)',
    accent: '#f97316',
    particle: '#fb923c',
  },
  forest: {
    sky: 'linear-gradient(180deg, #052e16 0%, #14532d 45%, #166534 100%)',
    mid: '#22c55e',
    ground: 'linear-gradient(180deg, #14532d 0%, #1c1917 100%)',
    track: '#4ade80',
    trackGlow: 'rgba(74, 222, 128, 0.4)',
    accent: '#22c55e',
    particle: '#86efac',
  },
  neon: {
    sky: 'linear-gradient(180deg, #0f0520 0%, #2e1065 45%, #581c87 100%)',
    mid: '#d946ef',
    ground: 'linear-gradient(180deg, #3b0764 0%, #1e1b4b 100%)',
    track: '#e879f9',
    trackGlow: 'rgba(232, 121, 249, 0.5)',
    accent: '#d946ef',
    particle: '#f0abfc',
  },
};

export function GameBackground({
  theme,
  scrollOffset = 0,
  compact = false,
}: {
  theme: GameTheme;
  scrollOffset?: number;
  compact?: boolean;
}) {
  const v = THEME_VISUALS[theme];
  const offset = scrollOffset % 400;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: v.sky }} />

      {/* Stars / embers */}
      {[...Array(compact ? 8 : 16)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full"
          style={{
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            left: `${(i * 17 + 5) % 100}%`,
            top: `${(i * 13 + 8) % 55}%`,
            backgroundColor: v.particle,
            boxShadow: `0 0 ${i % 2 ? 6 : 10}px ${v.particle}`,
          }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 1.5 + (i % 3), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      {/* Parallax silhouettes */}
      <div
        className="absolute bottom-16 left-0 right-0 h-32 opacity-30"
        style={{
          backgroundImage: theme === 'lava'
            ? `repeating-linear-gradient(90deg, transparent, transparent 80px, #7c2d12 80px, #7c2d12 84px)`
            : theme === 'forest'
            ? `radial-gradient(ellipse 40px 60px at 50% 100%, #166534 0%, transparent 70%)`
            : `linear-gradient(90deg, transparent 0%, #a855f7 50%, transparent 100%)`,
          backgroundSize: theme === 'forest' ? '60px 100%' : '200px 100%',
          transform: `translateX(-${offset * 0.3}px)`,
        }}
      />

      {theme === 'neon' && (
        <div
          className="absolute bottom-20 left-0 right-0 h-24 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(90deg, transparent 0%, #d946ef 2%, transparent 4%, transparent 48%, #06b6d4 50%, transparent 52%)',
            backgroundSize: '120px 100%',
            transform: `translateX(-${offset * 0.5}px)`,
          }}
        />
      )}

      {theme === 'lava' && (
        <div className="absolute bottom-14 left-0 right-0 h-8 opacity-40 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`lava-${i}`}
              className="absolute bottom-0 w-16 h-4 rounded-t-full"
              style={{
                left: `${i * 18}%`,
                background: 'radial-gradient(ellipse at bottom, #f97316, transparent)',
              }}
              animate={{ scaleY: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function GroundTrack({
  theme,
  scrollOffset = 0,
}: {
  theme: GameTheme;
  scrollOffset?: number;
}) {
  const v = THEME_VISUALS[theme];
  const offset = scrollOffset % 80;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-20">
      <div className="absolute inset-0" style={{ background: v.ground }} />
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: v.track, boxShadow: `0 0 12px ${v.trackGlow}` }}
      />
      {/* Lane markings */}
      <div
        className="absolute top-6 left-0 right-0 h-2 opacity-60"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${v.track} 0px, ${v.track} 24px, transparent 24px, transparent 48px)`,
          transform: `translateX(-${offset}px)`,
        }}
      />
      <div className="absolute top-10 left-0 right-0 h-px bg-white/10" />
    </div>
  );
}

export function RunnerSprite({
  isJumping,
  isDucking,
  rageMode,
  hasShield,
  isAuto,
  character = DEFAULT_CHARACTER,
}: {
  isJumping: boolean;
  isDucking: boolean;
  rageMode: boolean;
  hasShield: boolean;
  isAuto: boolean;
  character?: CharacterConfig;
}) {
  const bodyColor = rageMode ? '#ef4444' : character.bodyColor;
  const skinColor = rageMode ? '#fca5a5' : character.skinColor;
  const glow = rageMode
    ? '0 0 24px #ef4444, 0 0 48px #f97316'
    : character.trail === 'neon'
    ? `0 0 20px ${bodyColor}`
    : `0 0 12px ${bodyColor}88`;

  return (
    <div className="relative" style={{ filter: `drop-shadow(${glow})` }}>
      {hasShield && (
        <motion.div
          className="absolute -inset-3 rounded-full border-2 border-cyan-400/80"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)' }}
        />
      )}
      {rageMode && (
        <motion.div
          className="absolute -inset-4 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 0.25, repeat: Infinity }}
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.5), transparent 70%)' }}
        />
      )}

      {(character.trail === 'fire' || rageMode) && (
        <motion.div
          className="absolute -left-6 top-1/2 w-8 h-1 rounded-full"
          style={{ background: 'linear-gradient(90deg, #ef4444, transparent)' }}
          animate={{ opacity: [0.5, 1, 0.5], scaleX: [0.8, 1.2, 0.8] }}
          transition={{ duration: 0.15, repeat: Infinity }}
        />
      )}
      {character.trail === 'sparkle' && !rageMode && (
        <motion.div
          className="absolute -left-4 top-1/3 text-[10px]"
          animate={{ opacity: [0, 1, 0], x: [-4, -12] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          ✨
        </motion.div>
      )}
      {character.trail === 'neon' && !rageMode && (
        <motion.div
          className="absolute -left-5 top-1/2 w-6 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${bodyColor}, transparent)`, boxShadow: `0 0 8px ${bodyColor}` }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      )}

      <motion.div
        className="relative flex flex-col items-center"
        animate={isJumping ? { rotate: [-8, 8, 0] } : isDucking ? { scaleY: 0.55, scaleX: 1.1 } : {}}
        transition={{ duration: 0.35 }}
      >
        {/* Accessory */}
        {character.accessory === 'cap' && (
          <div className="absolute -top-2 z-20 w-7 h-2 rounded-sm bg-red-500 border border-red-700" style={{ left: '50%', transform: 'translateX(-50%)' }} />
        )}
        {character.accessory === 'crown' && (
          <div className="absolute -top-3 z-20 text-[12px]" style={{ left: '50%', transform: 'translateX(-50%)' }}>👑</div>
        )}
        {character.accessory === 'visor' && (
          <div className="absolute top-2 z-20 w-5 h-1.5 rounded-sm bg-cyan-400/90" style={{ left: '50%', transform: 'translateX(-50%)' }} />
        )}
        {character.accessory === 'headphones' && (
          <div className="absolute top-1 z-20 flex gap-3">
            <div className="w-2 h-2 rounded-full bg-gray-800 border border-gray-600" />
            <div className="w-2 h-2 rounded-full bg-gray-800 border border-gray-600" />
          </div>
        )}

        {/* Head */}
        <div
          className="relative z-10 rounded-full"
          style={{
            width: 22,
            height: 22,
            background: `linear-gradient(135deg, ${skinColor}, ${skinColor}cc)`,
            border: '2px solid rgba(255,255,255,0.3)',
          }}
        >
          <div className="absolute top-1.5 left-1 w-1.5 h-1.5 rounded-full bg-gray-900" />
          <div className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-gray-900" />
          {rageMode && (
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px]">💢</div>
          )}
        </div>

        {/* Body */}
        <div
          className="rounded-lg -mt-1"
          style={{
            width: 28,
            height: isDucking ? 16 : 26,
            background: `linear-gradient(180deg, ${bodyColor}, ${bodyColor}cc)`,
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        />

        {/* Legs */}
        {!isDucking && (
          <div className="flex gap-1 -mt-0.5">
            <motion.div
              className="rounded-full"
              style={{ width: 8, height: 14, background: '#1e293b' }}
              animate={isJumping ? {} : { rotate: [20, -20, 20] }}
              transition={{ duration: 0.2, repeat: Infinity }}
            />
            <motion.div
              className="rounded-full"
              style={{ width: 8, height: 14, background: '#1e293b' }}
              animate={isJumping ? {} : { rotate: [-20, 20, -20] }}
              transition={{ duration: 0.2, repeat: Infinity }}
            />
          </div>
        )}

        {isAuto && !rageMode && (
          <div className="absolute -right-5 top-0 text-[10px] opacity-80">🤖</div>
        )}
      </motion.div>
    </div>
  );
}

export function ObstacleSprite({
  type,
  height,
}: {
  type: 'spike' | 'fireball' | 'barrier';
  height: 'low' | 'high';
}) {
  if (type === 'spike') {
    return (
      <div className="relative flex items-end justify-center" style={{ width: 36, height: height === 'low' ? 44 : 56 }}>
        <svg viewBox="0 0 40 50" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="spikeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#7f1d1d" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <polygon points="20,2 38,48 2,48" fill="url(#spikeGrad)" stroke="#fca5a5" strokeWidth="1.5" />
          <polygon points="20,12 30,42 10,42" fill="#450a0a" opacity="0.4" />
        </svg>
      </div>
    );
  }

  if (type === 'fireball') {
    return (
      <motion.div
        className="relative"
        style={{ width: 40, height: 40 }}
        animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, #fef08a 0%, #f97316 40%, #dc2626 70%, transparent 100%)',
            boxShadow: '0 0 20px #f97316, 0 0 40px #ef4444',
          }}
        />
        <div className="absolute inset-2 rounded-full bg-yellow-200/80" />
      </motion.div>
    );
  }

  return (
    <div
      className="rounded-md border-2 border-stone-500 relative overflow-hidden"
      style={{
        width: 20,
        height: height === 'low' ? 48 : 72,
        background: 'linear-gradient(90deg, #57534e, #78716c, #57534e)',
        boxShadow: 'inset 0 0 12px rgba(0,0,0,0.5), 4px 0 8px rgba(0,0,0,0.3)',
      }}
    >
      <div className="absolute inset-x-1 top-2 h-1 bg-stone-400/50 rounded" />
      <div className="absolute inset-x-1 top-8 h-1 bg-stone-400/50 rounded" />
      <div className="absolute inset-x-1 top-14 h-1 bg-stone-400/50 rounded" />
    </div>
  );
}

export function CoinSprite() {
  return (
    <motion.div
      className="relative"
      style={{ width: 28, height: 28 }}
      animate={{ rotateY: [0, 180, 360], y: [0, -4, 0] }}
      transition={{ rotateY: { duration: 1.2, repeat: Infinity }, y: { duration: 0.8, repeat: Infinity } }}
    >
      <div
        className="absolute inset-0 rounded-full border-2 border-yellow-300"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #fef08a, #eab308, #a16207)',
          boxShadow: '0 0 16px #fbbf24, inset 0 -2px 4px rgba(0,0,0,0.3)',
        }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-yellow-900 font-bold text-sm">$</span>
    </motion.div>
  );
}

export function CityBuilding({ type, scale = 1 }: { type: CityBuildingType; scale?: number }) {
  const h = scale;
  switch (type) {
    case 'skyscraper':
      return (
        <div className="flex flex-col items-center" style={{ transform: `scale(${h})` }}>
          <div className="w-8 h-20 rounded-t-sm relative overflow-hidden" style={{ background: 'linear-gradient(90deg, #1e293b, #334155, #1e293b)', border: '1px solid #475569' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute w-1.5 h-1.5 bg-yellow-300/60 rounded-sm" style={{ left: 4 + (i % 2) * 12, top: 4 + Math.floor(i / 2) * 8 }} />
            ))}
          </div>
        </div>
      );
    case 'house':
      return (
        <div style={{ transform: `scale(${h})` }}>
          <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-b-[12px] border-l-transparent border-r-transparent border-b-red-700 mx-auto" />
          <div className="w-10 h-10 rounded-sm" style={{ background: 'linear-gradient(180deg, #fcd34d, #d97706)', border: '1px solid #b45309' }} />
        </div>
      );
    case 'shop':
      return (
        <div style={{ transform: `scale(${h})` }}>
          <div className="w-12 h-3 rounded-t-lg" style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
          <div className="w-12 h-10 rounded-sm" style={{ background: '#78716c', border: '1px solid #57534e' }}>
            <div className="w-6 h-6 mx-auto mt-1 rounded-sm bg-sky-300/40 border border-white/20" />
          </div>
        </div>
      );
    case 'tree':
      return (
        <div className="flex flex-col items-center" style={{ transform: `scale(${h})` }}>
          <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[20px] border-l-transparent border-r-transparent border-b-green-600" />
          <div className="w-2 h-4 bg-amber-900 rounded-sm" />
        </div>
      );
    case 'lamp':
      return (
        <div className="flex flex-col items-center" style={{ transform: `scale(${h})` }}>
          <div className="w-4 h-4 rounded-full bg-yellow-300" style={{ boxShadow: '0 0 12px #fbbf24' }} />
          <div className="w-1 h-10 bg-gray-600" />
        </div>
      );
    case 'billboard':
      return (
        <div className="flex flex-col items-center" style={{ transform: `scale(${h})` }}>
          <div className="w-14 h-8 rounded flex items-center justify-center text-[8px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', border: '2px solid #fff3' }}>
            AD
          </div>
          <div className="w-1 h-8 bg-gray-700" />
        </div>
      );
  }
}

export function CitySkyline({
  environment,
  scrollOffset = 0,
  compact = false,
}: {
  environment: EnvironmentConfig;
  scrollOffset?: number;
  compact?: boolean;
}) {
  const offset = scrollOffset % 600;

  return (
    <div className={`absolute left-0 right-0 ${compact ? 'bottom-16 h-28' : 'bottom-20 h-36'} overflow-hidden pointer-events-none`}>
      <div
        className="absolute bottom-0 flex items-end gap-1"
        style={{ transform: `translateX(-${offset * 0.4}px)`, left: -100 }}
      >
        {environment.slots.map((building, i) => (
          <div
            key={i}
            className="flex items-end justify-center"
            style={{ width: compact ? 36 : 48, minHeight: compact ? 60 : 80 }}
          >
            {building ? <CityBuilding type={building} scale={compact ? 0.7 : 1} /> : null}
          </div>
        ))}
        {/* Repeat for seamless scroll */}
        {environment.slots.map((building, i) => (
          <div
            key={`dup-${i}`}
            className="flex items-end justify-center"
            style={{ width: compact ? 36 : 48, minHeight: compact ? 60 : 80 }}
          >
            {building ? <CityBuilding type={building} scale={compact ? 0.7 : 1} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function IfElseBlock({
  condition,
  thenLabel,
  elseLabel,
  color,
  onRemove,
  compact,
}: {
  condition: string;
  thenLabel: string;
  elseLabel: string;
  color: string;
  onRemove?: () => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-0">
      <ScratchBlock color={color} variant="hat" className="rounded-b-none">
        <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          <span className="bg-black/25 px-2 py-0.5 rounded font-black text-[10px]">IF</span>
          <span className="flex-1 font-medium">{condition}</span>
          {onRemove && (
            <button onClick={onRemove} className="w-6 h-6 rounded-full bg-black/20 hover:bg-red-500/40 flex items-center justify-center text-sm">×</button>
          )}
        </div>
      </ScratchBlock>
      <div className="ml-4 border-l-4 pl-2 space-y-1" style={{ borderColor: `${color}88` }}>
        <ScratchBlock color="#3b82f6" variant="script" className={compact ? 'text-xs' : 'text-sm'}>
          <span className="bg-black/25 px-2 py-0.5 rounded font-black text-[10px] mr-2">THEN</span>
          {thenLabel}
        </ScratchBlock>
        <ScratchBlock color="#f59e0b" variant="script" className={compact ? 'text-xs' : 'text-sm'}>
          <span className="bg-black/25 px-2 py-0.5 rounded font-black text-[10px] mr-2">ELSE</span>
          {elseLabel}
        </ScratchBlock>
      </div>
    </div>
  );
}

/* ─── Block Studio Components ─── */

export function ScratchBlock({
  color,
  children,
  onClick,
  className = '',
  variant = 'palette',
}: {
  color: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'palette' | 'script' | 'hat' | 'c-block';
}) {
  const base = variant === 'hat'
    ? 'rounded-t-2xl rounded-b-lg'
    : variant === 'c-block'
    ? 'rounded-lg'
    : 'rounded-lg';

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      onClick={onClick}
      className={`relative text-left w-full ${base} px-4 py-2.5 font-medium text-white text-sm shadow-lg ${className}`}
      style={{
        background: `linear-gradient(180deg, ${color}ee 0%, ${color} 50%, ${color}cc 100%)`,
        borderTop: `2px solid ${color}ff`,
        borderBottom: `3px solid ${color}88`,
        boxShadow: `0 4px 0 ${color}66, 0 6px 16px ${color}33, inset 0 1px 0 rgba(255,255,255,0.25)`,
      }}
      whileHover={onClick ? { y: -2, boxShadow: `0 6px 0 ${color}66, 0 10px 24px ${color}44` } : {}}
      whileTap={onClick ? { y: 2, boxShadow: `0 2px 0 ${color}66` } : {}}
    >
      {/* Puzzle notch left */}
      {variant === 'script' && (
        <div
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-4 rounded-r-full"
          style={{ background: color, boxShadow: `inset -1px 0 2px ${color}88` }}
        />
      )}
      {/* Puzzle bump right */}
      {variant === 'palette' && (
        <div
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-4 rounded-l-full opacity-60"
          style={{ background: color }}
        />
      )}
      {children}
    </Component>
  );
}

export function BlockStudioGrid({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: `
          radial-gradient(circle at 1px 1px, rgba(139,92,246,0.15) 1px, transparent 0),
          linear-gradient(180deg, rgba(15,10,30,0.95), rgba(10,8,20,0.98))
        `,
        backgroundSize: '20px 20px, 100% 100%',
        border: '2px solid rgba(139, 92, 246, 0.25)',
        boxShadow: 'inset 0 0 60px rgba(139, 92, 246, 0.08), 0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 flex items-center gap-2"
      style={{
        background: `linear-gradient(135deg, ${color}18, ${color}08)`,
        border: `1px solid ${color}35`,
      }}
    >
      <span className="text-lg">{icon}</span>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
        <div className="text-sm font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

export function GameCanvasFrame({
  children,
  theme,
  rageMode,
  compact,
}: {
  children: React.ReactNode;
  theme: GameTheme;
  rageMode: boolean;
  compact?: boolean;
}) {
  const v = THEME_VISUALS[theme];

  return (
    <div
      className={`relative ${compact ? 'h-[240px]' : 'h-[340px]'} rounded-2xl overflow-hidden`}
      style={{
        border: rageMode ? '3px solid #ef4444' : `2px solid ${v.accent}66`,
        boxShadow: rageMode
          ? '0 0 40px rgba(239,68,68,0.5), inset 0 0 30px rgba(239,68,68,0.1)'
          : `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${v.trackGlow}`,
      }}
    >
      {/* CRT scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-20 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)' }}
      />
      {children}
    </div>
  );
}
