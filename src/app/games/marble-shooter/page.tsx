'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

interface Marble {
  id: number;
  color: string;
  x: number;
  y: number;
  pathProgress: number;
}

interface Projectile {
  id: number;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];
const COLOR_NAMES = ['red', 'blue', 'green', 'yellow', 'purple'];
const MARBLE_SIZE = 28;
const SHOOTER_X = 400;
const SHOOTER_Y = 300;
const PATH_POINTS = [
  { x: 50, y: 50 },
  { x: 200, y: 50 },
  { x: 300, y: 100 },
  { x: 350, y: 200 },
  { x: 300, y: 300 },
  { x: 200, y: 350 },
  { x: 100, y: 300 },
  { x: 50, y: 200 },
  { x: 100, y: 100 },
  { x: 200, y: 150 },
  { x: 300, y: 200 },
  { x: 400, y: 250 },
  { x: 500, y: 200 },
  { x: 600, y: 150 },
  { x: 700, y: 200 },
  { x: 750, y: 300 },
  { x: 700, y: 400 },
  { x: 600, y: 450 },
  { x: 500, y: 400 },
  { x: 450, y: 350 },
];

const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;

// Level configurations
const LEVEL_CONFIG = [
  { marbles: 12, speed: 0.0003, colors: 3, name: 'Beginner' },      // Level 1: Easy
  { marbles: 15, speed: 0.00035, colors: 3, name: 'Warm Up' },      // Level 2
  { marbles: 18, speed: 0.0004, colors: 4, name: 'Getting Started' }, // Level 3
  { marbles: 20, speed: 0.00045, colors: 4, name: 'Apprentice' },   // Level 4
  { marbles: 22, speed: 0.0005, colors: 4, name: 'Intermediate' },  // Level 5
  { marbles: 25, speed: 0.00055, colors: 5, name: 'Challenger' },   // Level 6
  { marbles: 28, speed: 0.0006, colors: 5, name: 'Advanced' },      // Level 7
  { marbles: 30, speed: 0.00065, colors: 5, name: 'Expert' },       // Level 8
  { marbles: 35, speed: 0.0007, colors: 5, name: 'Master' },        // Level 9
  { marbles: 40, speed: 0.00075, colors: 5, name: 'Legend' },       // Level 10
];

export default function MarbleShooterGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'won' | 'lost'>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [unlockedLevels, setUnlockedLevels] = useState(LEVEL_CONFIG.length); // All levels accessible

  const marblesRef = useRef<Marble[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const nextColorRef = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);
  const currentColorRef = useRef(COLORS[Math.floor(Math.random() * COLORS.length)]);
  const aimAngleRef = useRef(0);
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const lastMatchTimeRef = useRef(0);

  // Get position along path
  const getPathPosition = useCallback((progress: number) => {
    // Clamp progress to valid range
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    const totalSegments = PATH_POINTS.length - 1;
    const segment = Math.floor(clampedProgress * totalSegments);
    const segmentProgress = (clampedProgress * totalSegments) % 1;
    
    if (segment >= totalSegments) {
      return PATH_POINTS[PATH_POINTS.length - 1];
    }
    
    const p1 = PATH_POINTS[segment];
    const p2 = PATH_POINTS[segment + 1];
    
    return {
      x: p1.x + (p2.x - p1.x) * segmentProgress,
      y: p1.y + (p2.y - p1.y) * segmentProgress,
    };
  }, []);

  // Initialize marbles based on level config
  const initializeMarbles = useCallback((levelIndex: number) => {
    const config = LEVEL_CONFIG[Math.min(levelIndex - 1, LEVEL_CONFIG.length - 1)];
    const numMarbles = config.marbles;
    const numColors = config.colors;
    const availableColors = COLORS.slice(0, numColors);
    
    const marbles: Marble[] = [];
    for (let i = 0; i < numMarbles; i++) {
      const progress = i * 0.025; // Start at beginning, spaced apart along path
      const pos = getPathPosition(progress);
      marbles.push({
        id: i,
        color: availableColors[Math.floor(Math.random() * availableColors.length)],
        x: pos.x,
        y: pos.y,
        pathProgress: progress,
      });
    }
    return marbles;
  }, [getPathPosition]);

  // Check for matches
  const checkMatches = useCallback(() => {
    const marbles = marblesRef.current;
    if (marbles.length < 3) return;

    // Sort by path progress
    marbles.sort((a, b) => a.pathProgress - b.pathProgress);

    let matchStart = 0;
    let matchCount = 1;
    let foundMatch = false;

    for (let i = 1; i <= marbles.length; i++) {
      if (i < marbles.length && marbles[i].color === marbles[matchStart].color) {
        matchCount++;
      } else {
        if (matchCount >= 3) {
          // Remove matched marbles
          const idsToRemove = marbles.slice(matchStart, matchStart + matchCount).map(m => m.id);
          marblesRef.current = marbles.filter(m => !idsToRemove.includes(m.id));
          
          // Score
          const points = matchCount * 100 * (comboRef.current + 1);
          scoreRef.current += points;
          setScore(scoreRef.current);
          
          // Combo
          const now = Date.now();
          if (now - lastMatchTimeRef.current < 2000) {
            comboRef.current++;
          } else {
            comboRef.current = 1;
          }
          setCombo(comboRef.current);
          lastMatchTimeRef.current = now;
          
          foundMatch = true;
          break;
        }
        matchStart = i;
        matchCount = 1;
      }
    }

    if (foundMatch) {
      // Check for chain reactions
      setTimeout(() => checkMatches(), 100);
    }
  }, []);

  // Shoot marble
  const shootMarble = useCallback((targetX: number, targetY: number) => {
    if (gameState !== 'playing') return;

    const dx = targetX - SHOOTER_X;
    const dy = targetY - SHOOTER_Y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 15;

    const projectile: Projectile = {
      id: Date.now(),
      color: currentColorRef.current,
      x: SHOOTER_X,
      y: SHOOTER_Y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
    };

    projectilesRef.current.push(projectile);
    
    // Swap colors - use only colors available for current level
    const config = LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)];
    const availableColors = COLORS.slice(0, config.colors);
    currentColorRef.current = nextColorRef.current;
    nextColorRef.current = availableColors[Math.floor(Math.random() * availableColors.length)];
  }, [gameState, level]);

  // Handle mouse move for aiming
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    aimAngleRef.current = Math.atan2(y - SHOOTER_Y, x - SHOOTER_X);
  }, []);

  // Handle click to shoot
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    shootMarble(x, y);
  }, [gameState, shootMarble]);

  // Start game with specific level
  const startGame = useCallback((selectedLevel?: number) => {
    const lvl = selectedLevel || level;
    setLevel(lvl);
    const config = LEVEL_CONFIG[Math.min(lvl - 1, LEVEL_CONFIG.length - 1)];
    
    // Set available colors for shooting based on level
    const availableColors = COLORS.slice(0, config.colors);
    currentColorRef.current = availableColors[Math.floor(Math.random() * availableColors.length)];
    nextColorRef.current = availableColors[Math.floor(Math.random() * availableColors.length)];
    
    marblesRef.current = initializeMarbles(lvl);
    projectilesRef.current = [];
    scoreRef.current = 0;
    comboRef.current = 0;
    frameCountRef.current = 0;
    setScore(0);
    setCombo(0);
    setGameState('playing');
  }, [initializeMarbles, level]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      frameCountRef.current++;

      // Update marbles - use level config speed
      const config = LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)];
      const speed = config.speed;
      marblesRef.current.forEach(marble => {
        marble.pathProgress += speed;
        const pos = getPathPosition(marble.pathProgress);
        marble.x = pos.x;
        marble.y = pos.y;
      });

      // Check if marbles reached the end
      if (marblesRef.current.some(m => m.pathProgress >= 1)) {
        setGameState('lost');
        recordAnswer(false);
        incrementGamesPlayed();
        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
        }
        return;
      }

      // Check if all marbles cleared
      if (marblesRef.current.length === 0 && frameCountRef.current > 60) {
        setGameState('won');
        setShowConfetti(true);
        addStars(Math.floor(scoreRef.current / 500) + level);
        recordAnswer(true);
        incrementGamesPlayed();
        if (scoreRef.current > highScore) {
          setHighScore(scoreRef.current);
        }
        // Unlock next level
        if (level < LEVEL_CONFIG.length) {
          setUnlockedLevels(prev => Math.max(prev, level + 1));
        }
        setTimeout(() => setShowConfetti(false), 3000);
        return;
      }

      // Update projectiles
      projectilesRef.current = projectilesRef.current.filter(proj => {
        proj.x += proj.vx;
        proj.y += proj.vy;

        // Check collision with marbles
        for (let i = 0; i < marblesRef.current.length; i++) {
          const marble = marblesRef.current[i];
          const dx = proj.x - marble.x;
          const dy = proj.y - marble.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MARBLE_SIZE) {
            // Insert new marble at this position
            const newMarble: Marble = {
              id: Date.now() + Math.random(),
              color: proj.color,
              x: proj.x,
              y: proj.y,
              pathProgress: marble.pathProgress - 0.01,
            };
            marblesRef.current.splice(i, 0, newMarble);
            
            // Check for matches
            setTimeout(() => checkMatches(), 50);
            
            return false; // Remove projectile
          }
        }

        // Remove if off screen
        return proj.x > 0 && proj.x < GAME_WIDTH && proj.y > 0 && proj.y < GAME_HEIGHT;
      });

      // Draw
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw background
      const gradient = ctx.createRadialGradient(GAME_WIDTH/2, GAME_HEIGHT/2, 0, GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH);
      gradient.addColorStop(0, '#1e1b4b');
      gradient.addColorStop(1, '#0f0a1e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw path
      ctx.beginPath();
      ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
      for (let i = 1; i < PATH_POINTS.length; i++) {
        ctx.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
      }
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = MARBLE_SIZE + 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Draw end zone (danger)
      const endPos = PATH_POINTS[PATH_POINTS.length - 1];
      ctx.beginPath();
      ctx.arc(endPos.x, endPos.y, 25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw marbles
      marblesRef.current.forEach(marble => {
        if (marble.pathProgress < 0) return;
        
        ctx.beginPath();
        ctx.arc(marble.x, marble.y, MARBLE_SIZE / 2, 0, Math.PI * 2);
        
        // Gradient for 3D effect
        const marbleGradient = ctx.createRadialGradient(
          marble.x - 4, marble.y - 4, 0,
          marble.x, marble.y, MARBLE_SIZE / 2
        );
        marbleGradient.addColorStop(0, 'white');
        marbleGradient.addColorStop(0.3, marble.color);
        marbleGradient.addColorStop(1, marble.color);
        ctx.fillStyle = marbleGradient;
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw projectiles
      projectilesRef.current.forEach(proj => {
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, MARBLE_SIZE / 2, 0, Math.PI * 2);
        const projGradient = ctx.createRadialGradient(
          proj.x - 4, proj.y - 4, 0,
          proj.x, proj.y, MARBLE_SIZE / 2
        );
        projGradient.addColorStop(0, 'white');
        projGradient.addColorStop(0.3, proj.color);
        projGradient.addColorStop(1, proj.color);
        ctx.fillStyle = projGradient;
        ctx.fill();
      });

      // Draw shooter (frog)
      ctx.save();
      ctx.translate(SHOOTER_X, SHOOTER_Y);
      ctx.rotate(aimAngleRef.current);
      
      // Frog body
      ctx.beginPath();
      ctx.ellipse(0, 0, 35, 30, 0, 0, Math.PI * 2);
      const frogGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, 35);
      frogGradient.addColorStop(0, '#4ade80');
      frogGradient.addColorStop(1, '#16a34a');
      ctx.fillStyle = frogGradient;
      ctx.fill();
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Frog eyes
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(-10, -20, 10, 0, Math.PI * 2);
      ctx.arc(10, -20, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(-8, -20, 5, 0, Math.PI * 2);
      ctx.arc(12, -20, 5, 0, Math.PI * 2);
      ctx.fill();

      // Current marble preview
      ctx.beginPath();
      ctx.arc(25, 0, MARBLE_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fillStyle = currentColorRef.current;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      // Draw next marble indicator
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Next:', SHOOTER_X, SHOOTER_Y + 55);
      ctx.beginPath();
      ctx.arc(SHOOTER_X, SHOOTER_Y + 75, 12, 0, Math.PI * 2);
      ctx.fillStyle = nextColorRef.current;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw aim line
      ctx.beginPath();
      ctx.moveTo(SHOOTER_X, SHOOTER_Y);
      ctx.lineTo(
        SHOOTER_X + Math.cos(aimAngleRef.current) * 60,
        SHOOTER_Y + Math.sin(aimAngleRef.current) * 60
      );
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, getPathPosition, checkMatches, level, highScore, addStars, recordAnswer, incrementGamesPlayed]);

  // Draw menu/idle state
  useEffect(() => {
    if (gameState === 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    const gradient = ctx.createRadialGradient(GAME_WIDTH/2, GAME_HEIGHT/2, 0, GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(1, '#0f0a1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw path
    ctx.beginPath();
    ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
    for (let i = 1; i < PATH_POINTS.length; i++) {
      ctx.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
    }
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = MARBLE_SIZE + 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw frog
    ctx.save();
    ctx.translate(SHOOTER_X, SHOOTER_Y);
    ctx.beginPath();
    ctx.ellipse(0, 0, 35, 30, 0, 0, Math.PI * 2);
    const frogGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, 35);
    frogGradient.addColorStop(0, '#4ade80');
    frogGradient.addColorStop(1, '#16a34a');
    ctx.fillStyle = frogGradient;
    ctx.fill();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-10, -20, 10, 0, Math.PI * 2);
    ctx.arc(10, -20, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-8, -20, 5, 0, Math.PI * 2);
    ctx.arc(12, -20, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

  }, [gameState]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('marbleShooterHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Save high score
  useEffect(() => {
    localStorage.setItem('marbleShooterHighScore', highScore.toString());
  }, [highScore]);

  const nextLevel = () => {
    const newLevel = Math.min(level + 1, LEVEL_CONFIG.length);
    startGame(newLevel);
  };
  

  return (
    <main className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-900 p-3 sm:p-4 md:p-6 relative overflow-hidden">
      <Confetti show={showConfetti} />

      {/* Header */}
      <header className="max-w-4xl mx-auto mb-3 sm:mb-4 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:text-white transition-all text-sm backdrop-blur min-h-[44px] touch-target"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Back
          </motion.button>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <div className="bg-white/10 backdrop-blur rounded-xl px-3 sm:px-4 py-2 border border-white/20">
              <span className="text-gray-400 text-xs sm:text-sm">Score: </span>
              <span className="text-white font-bold">{score}</span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-3 sm:px-4 py-2 border border-white/20">
              <span className="text-gray-400 text-xs sm:text-sm">Best: </span>
              <span className="text-yellow-400 font-bold">{highScore}</span>
            </div>
            {combo > 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl px-4 py-2"
              >
                <span className="text-white font-bold">🔥 x{combo}</span>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Title */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              🐸 Marble Blaster 💎
            </span>
          </h1>
          <p className="text-purple-300/80 text-sm">
            Level {level}: {LEVEL_CONFIG[Math.min(level - 1, LEVEL_CONFIG.length - 1)]?.name} • Match 3+ colors!
          </p>
        </motion.div>

        {/* Game Canvas */}
        <motion.div
          className="relative rounded-2xl overflow-hidden border-2 border-purple-500/50 mx-auto"
          style={{ maxWidth: GAME_WIDTH }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="block w-full cursor-crosshair"
            onMouseMove={handleMouseMove}
            onClick={handleClick}
          />

          {/* Overlay for menu/won/lost */}
          <AnimatePresence>
            {gameState !== 'playing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm overflow-y-auto p-4 py-4"
              >
                {gameState === 'won' && (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-5xl mb-3"
                    >
                      🎉
                    </motion.div>
                    <div className="text-green-400 text-2xl font-bold mb-1">Level {level} Complete!</div>
                    <div className="text-white text-lg mb-4">Score: {score}</div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                      {level < LEVEL_CONFIG.length && (
                        <motion.button
                          onClick={nextLevel}
                          className="px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold min-h-[48px] touch-target"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Next Level →
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => setGameState('menu')}
                        className="px-5 sm:px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold min-h-[48px] touch-target"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Level Select
                      </motion.button>
                    </div>
                  </>
                )}
                {gameState === 'lost' && (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-4xl sm:text-5xl mb-3"
                    >
                      💥
                    </motion.div>
                    <div className="text-red-400 text-xl sm:text-2xl font-bold mb-1">Game Over!</div>
                    <div className="text-white text-base sm:text-lg mb-4">Final Score: {score}</div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                      <motion.button
                        onClick={() => startGame(level)}
                        className="px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold min-h-[48px] touch-target"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Retry Level
                      </motion.button>
                      <motion.button
                        onClick={() => setGameState('menu')}
                        className="px-5 sm:px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold min-h-[48px] touch-target"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Level Select
                      </motion.button>
                    </div>
                  </>
                )}
                {gameState === 'menu' && (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-4xl sm:text-5xl mb-2"
                    >
                      🐸
                    </motion.div>
                    <div className="text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">Select Level</div>
                    
                    {/* Level Grid */}
                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-3 sm:mb-4 px-2 sm:px-4">
                      {LEVEL_CONFIG.map((config, index) => {
                        const lvl = index + 1;
                        const isUnlocked = lvl <= unlockedLevels;
                        const isCurrent = lvl === level;
                        
                        return (
                          <motion.button
                            key={lvl}
                            onClick={() => isUnlocked && startGame(lvl)}
                            disabled={!isUnlocked}
                            className={`
                              w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-bold text-base sm:text-lg flex flex-col items-center justify-center touch-target
                              transition-all border-2
                              ${isUnlocked 
                                ? isCurrent
                                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 text-white'
                                  : 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-400 text-white hover:scale-105'
                                : 'bg-slate-800/50 border-slate-700 text-slate-600 cursor-not-allowed'
                              }
                            `}
                            whileHover={isUnlocked ? { scale: 1.1 } : {}}
                            whileTap={isUnlocked ? { scale: 0.95 } : {}}
                          >
                            {isUnlocked ? lvl : '🔒'}
                          </motion.button>
                        );
                      })}
                    </div>
                    
                    {/* Level Info */}
                    <div className="bg-white/10 rounded-xl px-4 sm:px-6 py-3 mb-3 sm:mb-4 text-center">
                      <div className="text-purple-300 text-xs sm:text-sm">Level {level}: {LEVEL_CONFIG[level - 1]?.name}</div>
                      <div className="text-gray-400 text-xs mt-1">
                        {LEVEL_CONFIG[level - 1]?.marbles} marbles • {LEVEL_CONFIG[level - 1]?.colors} colors
                      </div>
                    </div>
                    
                    <motion.button
                      onClick={() => startGame(level)}
                      className="px-6 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-base sm:text-lg min-h-[48px] touch-target"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      🎮 Play Level {level}
                    </motion.button>
                    <p className="text-gray-400 text-xs mt-3">Click to shoot • Match 3+ colors!</p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Instructions */}
        <motion.div
          className="mt-4 glass rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-white font-semibold mb-2">How to Play:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span>Aim with your mouse</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🖱️</span>
              <span>Click to shoot marbles</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span>Match 3+ same colors!</span>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

