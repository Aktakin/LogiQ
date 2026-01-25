'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MOBILE_BREAKPOINT = 768;

export default function FloatingShapes() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    setIsMobile(mq.matches);
    const fn = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  // On mobile: skip heavy blurred animated shapes to prevent GPU overload and crashes
  if (isMobile) return null;

  const shapes = [
    { size: 300, x: '10%', y: '20%', delay: 0 },
    { size: 200, x: '70%', y: '60%', delay: 2 },
    { size: 250, x: '80%', y: '10%', delay: 4 },
    { size: 180, x: '20%', y: '70%', delay: 1 },
    { size: 220, x: '50%', y: '40%', delay: 3 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: shape.size,
            height: shape.size,
            left: shape.x,
            top: shape.y,
            background: `linear-gradient(${135 + i * 30}deg, 
              rgba(139, 92, 246, ${0.1 + i * 0.02}), 
              rgba(236, 72, 153, ${0.05 + i * 0.02}))`,
            filter: 'blur(60px)',
          }}
          animate={{
            y: [0, -40, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20 + i * 2,
            repeat: Infinity,
            delay: shape.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}


