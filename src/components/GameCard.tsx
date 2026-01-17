'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  level: number;
  delay?: number;
}

export default function GameCard({
  title,
  description,
  icon,
  href,
  color,
  level,
  delay = 0,
}: GameCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.02, y: -8 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={href} className="block">
        <div 
          className="card-cosmic relative overflow-hidden group"
          style={{
            background: `linear-gradient(135deg, 
              rgba(26, 26, 58, 0.9), 
              ${color}15)`,
          }}
        >
          {/* Glow effect on hover */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at center, ${color}30, transparent 70%)`,
            }}
          />
          
          {/* Icon container */}
          <motion.div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 relative"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}80)`,
              boxShadow: `0 10px 30px ${color}40`,
            }}
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-4xl">{icon}</span>
          </motion.div>

          {/* Content */}
          <h3 className="text-2xl font-bold mb-2 text-white">{title}</h3>
          <p className="text-gray-400 mb-4">{description}</p>

          {/* Level badge */}
          <div className="flex items-center gap-2">
            <div 
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{ 
                backgroundColor: `${color}30`,
                color: color,
              }}
            >
              Level {level}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(level, 5) }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + 0.1 * i }}
                >
                  ⭐
                </motion.span>
              ))}
            </div>
          </div>

          {/* Arrow indicator */}
          <motion.div
            className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-0 group-hover:opacity-100"
            initial={{ x: -10 }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ color }}
          >
            →
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}


