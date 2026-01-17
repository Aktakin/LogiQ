'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
}

export default function Confetti({ show }: { show: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (show) {
      const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#fbbf24', '#f97316'];
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        size: 8 + Math.random() * 8,
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="fixed z-50 pointer-events-none"
          initial={{
            left: `${piece.x}%`,
            top: -20,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            top: '110%',
            rotate: piece.rotation + 720,
            opacity: 0,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 2 + Math.random(),
            delay: piece.delay,
            ease: 'easeOut',
          }}
          style={{
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </AnimatePresence>
  );
}


