'use client';

import { motion } from 'framer-motion';

export function ScratchBlock({
  color,
  children,
  className = '',
  variant = 'palette',
}: {
  color: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'palette' | 'script';
}) {
  return (
    <motion.div
      className={`relative text-left w-full rounded-lg px-3 py-2.5 font-medium text-white text-xs sm:text-sm shadow-lg ${className}`}
      style={{
        background: `linear-gradient(180deg, ${color}ee 0%, ${color} 55%, ${color}cc 100%)`,
        borderTop: `2px solid ${color}ff`,
        borderBottom: `3px solid ${color}88`,
        boxShadow: `0 4px 0 ${color}66, 0 6px 14px ${color}33, inset 0 1px 0 rgba(255,255,255,0.2)`,
      }}
    >
      {variant === 'script' && (
        <div
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-4 rounded-r-full"
          style={{ background: color }}
        />
      )}
      {variant === 'palette' && (
        <div
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-4 rounded-l-full opacity-60"
          style={{ background: color }}
        />
      )}
      {children}
    </motion.div>
  );
}

export function ScriptArea({
  children,
  isOver,
  empty,
}: {
  children: React.ReactNode;
  isOver: boolean;
  empty: boolean;
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden min-h-[220px] p-4 transition-colors"
      style={{
        background: `
          radial-gradient(circle at 1px 1px, rgba(245,158,11,0.12) 1px, transparent 0),
          linear-gradient(180deg, rgba(15,23,42,0.95), rgba(8,15,30,0.98))
        `,
        backgroundSize: '18px 18px, 100% 100%',
        border: `2px solid ${isOver ? 'rgba(245,158,11,0.5)' : 'rgba(245,158,11,0.2)'}`,
        boxShadow: isOver ? 'inset 0 0 40px rgba(245,158,11,0.08)' : 'inset 0 0 30px rgba(0,0,0,0.2)',
      }}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
        <span className="text-lg">📜</span>
        <div>
          <p className="text-sm font-semibold text-white">Frog program</p>
          <p className="text-[10px] text-gray-500">Drag blocks here — top runs first</p>
        </div>
      </div>
      {empty ? (
        <div className="flex flex-col items-center justify-center py-10 text-center pointer-events-none">
          <span className="text-3xl opacity-30 mb-2">⬇️</span>
          <p className="text-sm text-gray-500">Drop blocks here</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
