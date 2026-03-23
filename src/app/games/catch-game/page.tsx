'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';

const CANVAS_W = 400;
const CANVAS_H = 500;
const PLAYER_W = 40;
const PLAYER_H = 20;
const PLAYER_Y = 460;
const OBJ_SIZE = 10;
const FALL_SPEED = 3;
const MOVE_STEP = 20;

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export default function CatchGamePage() {
  const router = useRouter();
  const { incrementGamesPlayed } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerXRef = useRef(180);
  const [score, setScore] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    incrementGamesPlayed();
  }, [incrementGamesPlayed]);

  useEffect(() => {
    playerXRef.current = 180;
    setScore(0);
  }, [resetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const objectsRef = { current: [] as { x: number; y: number }[] };
    const scoreRef = { current: 0 };

    const clampPlayer = (x: number) => Math.max(0, Math.min(CANVAS_W - PLAYER_W, x));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        playerXRef.current = clampPlayer(playerXRef.current - MOVE_STEP);
        e.preventDefault();
      }
      if (e.key === 'ArrowRight') {
        playerXRef.current = clampPlayer(playerXRef.current + MOVE_STEP);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);

    const spawnInterval = window.setInterval(() => {
      objectsRef.current.push({
        x: Math.random() * (CANVAS_W - OBJ_SIZE),
        y: 0,
      });
    }, 1000);

    let raf = 0;

    const tick = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      const px = playerXRef.current;
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(px, PLAYER_Y, PLAYER_W, PLAYER_H);

      const objs = objectsRef.current;
      ctx.fillStyle = '#facc15';

      for (let i = objs.length - 1; i >= 0; i--) {
        objs[i].y += FALL_SPEED;
        const o = objs[i];

        const hit = rectsOverlap(o.x, o.y, OBJ_SIZE, OBJ_SIZE, px, PLAYER_Y, PLAYER_W, PLAYER_H);

        if (hit) {
          objs.splice(i, 1);
          scoreRef.current += 1;
          setScore(scoreRef.current);
        } else if (o.y > CANVAS_H) {
          objs.splice(i, 1);
        }
      }

      for (const o of objs) {
        ctx.fillRect(o.x, o.y, OBJ_SIZE, OBJ_SIZE);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('keydown', onKey);
      clearInterval(spawnInterval);
      cancelAnimationFrame(raf);
    };
  }, [resetKey]);

  const nudge = (dir: -1 | 1) => {
    const clamp = (x: number) => Math.max(0, Math.min(CANVAS_W - PLAYER_W, x));
    playerXRef.current = clamp(playerXRef.current + dir * MOVE_STEP);
  };

  const resetGame = () => {
    setResetKey((k) => k + 1);
  };

  const sampleCode = `// 🎯 VARIABLES
let playerX = 180;
let score = 0;
let objects = []; // ARRAY

// 🎮 PLAYER — draw a paddle
function drawPlayer() {
  ctx.fillStyle = "cyan";
  ctx.fillRect(playerX, 460, 40, 20);
}

// 🌧️ CREATE OBJECT
function createObject() {
  let x = Math.random() * 360;
  objects.push({ x: x, y: 0 });
}

// 🔄 MOVE OBJECTS (LOOP)
function updateObjects() {
  for (let i = 0; i < objects.length; i++) {
    objects[i].y += 3;
    // collision with paddle…
  }
}

// 🎨 DRAW OBJECTS
for (let obj of objects) {
  ctx.fillRect(obj.x, obj.y, 10, 10);
}

// 🔁 GAME LOOP
function gameLoop() {
  ctx.clearRect(0, 0, 400, 500);
  drawPlayer();
  drawObjects();
  updateObjects();
  requestAnimationFrame(gameLoop);
}

setInterval(createObject, 1000);
gameLoop();`;

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 md:p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-lg mx-auto relative z-10">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-2 mb-6"
        >
          <motion.button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="glass px-3 py-2 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px]"
            whileTap={{ scale: 0.97 }}
          >
            ← Dashboard
          </motion.button>
          <motion.button
            type="button"
            onClick={resetGame}
            className="px-3 py-2 rounded-xl text-sm bg-white/10 hover:bg-white/15 border border-white/10 min-h-[44px]"
            whileTap={{ scale: 0.97 }}
          >
            🔄 Reset
          </motion.button>
        </motion.header>

        <motion.div className="text-center mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">🎮 Catch the Falling Objects</h1>
          <p className="text-gray-400 text-sm">Use ← → arrows to move the paddle (or buttons below).</p>
          <p className="text-cyan-400 text-xl font-bold mt-3">Score: {score}</p>
        </motion.div>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="bg-black border-2 border-white/80 rounded-lg shadow-lg shadow-cyan-900/20 max-w-full h-auto"
          />
        </div>

        <div className="flex justify-center gap-3 mt-4">
          <motion.button
            type="button"
            aria-label="Move left"
            onClick={() => nudge(-1)}
            className="flex-1 max-w-[120px] py-3 rounded-xl font-bold bg-cyan-600/80 text-white border border-cyan-400/50"
            whileTap={{ scale: 0.95 }}
          >
            ← Left
          </motion.button>
          <motion.button
            type="button"
            aria-label="Move right"
            onClick={() => nudge(1)}
            className="flex-1 max-w-[120px] py-3 rounded-xl font-bold bg-cyan-600/80 text-white border border-cyan-400/50"
            whileTap={{ scale: 0.95 }}
          >
            Right →
          </motion.button>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowCode((s) => !s)}
            className="w-full text-sm text-gray-400 hover:text-cyan-400 transition-colors py-2"
          >
            {showCode ? '▼ Hide' : '▶ Show'} how this maps to code (variables, array, loops)
          </button>
          {showCode && (
            <motion.pre
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 p-4 rounded-xl bg-black/60 border border-white/10 text-left text-xs text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed"
            >
              {sampleCode}
            </motion.pre>
          )}
        </div>
      </div>
    </main>
  );
}
