'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

interface Obstacle {
  id: number;
  x: number;
  type: 'cactus' | 'bird' | 'meteor' | 'doubleCactus';
  height: 'low' | 'high';
}

interface DinoCharacter {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  eyeColor: string;
  description: string;
}

const DINO_CHARACTERS: DinoCharacter[] = [
  {
    id: 'classic',
    name: 'Rex',
    primaryColor: '#535353',
    secondaryColor: '#3d3d3d',
    eyeColor: '#ffffff',
    description: 'The classic T-Rex',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    eyeColor: '#ffffff',
    description: 'Forest guardian',
  },
  {
    id: 'flame',
    name: 'Blaze',
    primaryColor: '#ef4444',
    secondaryColor: '#dc2626',
    eyeColor: '#fbbf24',
    description: 'Fire breather',
  },
  {
    id: 'ocean',
    name: 'Splash',
    primaryColor: '#3b82f6',
    secondaryColor: '#2563eb',
    eyeColor: '#ffffff',
    description: 'Ocean explorer',
  },
  {
    id: 'royal',
    name: 'Violet',
    primaryColor: '#8b5cf6',
    secondaryColor: '#7c3aed',
    eyeColor: '#fbbf24',
    description: 'Royal dynasty',
  },
  {
    id: 'gold',
    name: 'Goldie',
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    eyeColor: '#ffffff',
    description: 'Legendary beast',
  },
];

const GAME_WIDTH = 800;
const GAME_HEIGHT = 200;
const GROUND_HEIGHT = 24;
const DINO_WIDTH = 80;
const DINO_HEIGHT = 58;
const DINO_DUCK_HEIGHT = 32;
const GRAVITY = 0.65;
const JUMP_FORCE = -13;
const INITIAL_SPEED = 6;

export default function DinoGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const selectedCharacter = DINO_CHARACTERS[0]; // Classic Rex
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('dinoHighScore') || '0');
    }
    return 0;
  });
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Game state refs (for animation loop)
  const dinoY = useRef(GAME_HEIGHT - GROUND_HEIGHT - DINO_HEIGHT);
  const dinoVelocity = useRef(0);
  const isJumping = useRef(false);
  const isDucking = useRef(false);
  const obstacles = useRef<Obstacle[]>([]);
  const gameSpeed = useRef(INITIAL_SPEED);
  const frameCount = useRef(0);
  const scoreRef = useRef(0);
  const legFrame = useRef(0);

  // Draw T-Rex dinosaur (Chrome dino style - pixel art)
  const drawDino = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, ducking: boolean, running: boolean, character: DinoCharacter) => {
    const { primaryColor, secondaryColor } = character;
    const pixel = 2; // Base pixel size for retro look
    
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    const drawPixel = (px: number, py: number, size: number = 1) => {
      ctx.fillRect(x + px * pixel, y + py * pixel, pixel * size, pixel);
    };
    
    const drawPixelRect = (px: number, py: number, w: number, h: number) => {
      ctx.fillRect(x + px * pixel, y + py * pixel, pixel * w, pixel * h);
    };
    
    if (ducking) {
      // DUCKING POSE - Stretched horizontal T-Rex
      const duckOffset = 8; // Lower position
      ctx.fillStyle = primaryColor;
      
      // Long horizontal body
      drawPixelRect(0, duckOffset + 4, 30, 6);
      
      // Head (front, lower)
      drawPixelRect(26, duckOffset + 2, 12, 6);
      drawPixelRect(30, duckOffset, 8, 3);
      
      // Snout
      drawPixelRect(36, duckOffset + 1, 6, 4);
      
      // Eye
      ctx.fillStyle = '#ffffff';
      drawPixelRect(32, duckOffset + 2, 2, 2);
      ctx.fillStyle = '#000000';
      drawPixelRect(33, duckOffset + 2, 1, 2);
      
      // Tail (back)
      ctx.fillStyle = primaryColor;
      drawPixelRect(-6, duckOffset + 5, 7, 3);
      drawPixelRect(-10, duckOffset + 6, 5, 2);
      
      // Legs (short, bent)
      ctx.fillStyle = secondaryColor;
      const legAnim = running ? Math.floor(legFrame.current / 5) % 2 : 0;
      if (legAnim === 0) {
        drawPixelRect(6, duckOffset + 10, 3, 4);
        drawPixelRect(16, duckOffset + 10, 3, 4);
      } else {
        drawPixelRect(8, duckOffset + 10, 3, 4);
        drawPixelRect(14, duckOffset + 10, 3, 4);
      }
      
      // Feet
      ctx.fillStyle = primaryColor;
      drawPixelRect(5, duckOffset + 13, 5, 2);
      drawPixelRect(15, duckOffset + 13, 5, 2);
      
    } else {
      // STANDING/RUNNING T-REX
      ctx.fillStyle = primaryColor;
      
      // === HEAD ===
      // Skull top
      drawPixelRect(18, -2, 8, 3);
      drawPixelRect(16, 0, 12, 3);
      
      // Face/Snout
      drawPixelRect(14, 3, 16, 4);
      drawPixelRect(26, 2, 6, 6);
      drawPixelRect(30, 3, 4, 4);
      
      // Lower jaw
      drawPixelRect(18, 7, 14, 2);
      drawPixelRect(22, 9, 8, 1);
      
      // Eye socket (darker)
      ctx.fillStyle = secondaryColor;
      drawPixelRect(20, 2, 4, 3);
      
      // Eye white
      ctx.fillStyle = '#ffffff';
      drawPixelRect(21, 2, 3, 3);
      
      // Pupil
      ctx.fillStyle = '#000000';
      drawPixelRect(23, 3, 1, 2);
      
      // === NECK ===
      ctx.fillStyle = primaryColor;
      drawPixelRect(12, 6, 6, 6);
      drawPixelRect(10, 9, 6, 4);
      
      // === BODY ===
      // Main torso
      drawPixelRect(4, 10, 14, 8);
      drawPixelRect(2, 12, 16, 6);
      drawPixelRect(0, 14, 18, 4);
      
      // Back curve
      drawPixelRect(6, 8, 8, 3);
      
      // Belly
      ctx.fillStyle = secondaryColor;
      drawPixelRect(8, 17, 6, 2);
      
      // === TAIL ===
      ctx.fillStyle = primaryColor;
      drawPixelRect(-2, 13, 4, 4);
      drawPixelRect(-6, 12, 5, 4);
      drawPixelRect(-10, 11, 5, 4);
      drawPixelRect(-14, 10, 5, 3);
      drawPixelRect(-17, 9, 4, 3);
      drawPixelRect(-20, 8, 4, 2);
      
      // === ARMS ===
      ctx.fillStyle = primaryColor;
      drawPixelRect(14, 12, 2, 4);
      drawPixelRect(15, 15, 2, 2);
      // Claws
      ctx.fillStyle = secondaryColor;
      drawPixelRect(16, 16, 1, 1);
      
      // === LEGS ===
      const legAnim = running ? Math.floor(legFrame.current / 4) % 2 : 0;
      
      ctx.fillStyle = primaryColor;
      
      if (legAnim === 0) {
        // Frame 1: Left leg forward, right leg back
        // Left leg (forward)
        drawPixelRect(10, 18, 4, 3);
        drawPixelRect(12, 21, 3, 4);
        drawPixelRect(13, 25, 3, 2);
        // Left foot
        drawPixelRect(12, 26, 5, 2);
        ctx.fillStyle = secondaryColor;
        drawPixelRect(11, 27, 2, 1);
        drawPixelRect(17, 27, 1, 1);
        
        // Right leg (back)
        ctx.fillStyle = primaryColor;
        drawPixelRect(2, 18, 4, 3);
        drawPixelRect(0, 21, 3, 4);
        drawPixelRect(-2, 25, 3, 2);
        // Right foot
        drawPixelRect(-3, 26, 5, 2);
        ctx.fillStyle = secondaryColor;
        drawPixelRect(-4, 27, 2, 1);
        drawPixelRect(2, 27, 1, 1);
      } else {
        // Frame 2: Right leg forward, left leg back
        // Right leg (forward)
        drawPixelRect(2, 18, 4, 3);
        drawPixelRect(4, 21, 3, 4);
        drawPixelRect(5, 25, 3, 2);
        // Right foot
        drawPixelRect(4, 26, 5, 2);
        ctx.fillStyle = secondaryColor;
        drawPixelRect(3, 27, 2, 1);
        drawPixelRect(9, 27, 1, 1);
        
        // Left leg (back)
        ctx.fillStyle = primaryColor;
        drawPixelRect(10, 18, 4, 3);
        drawPixelRect(8, 21, 3, 4);
        drawPixelRect(6, 25, 3, 2);
        // Left foot
        drawPixelRect(5, 26, 5, 2);
        ctx.fillStyle = secondaryColor;
        drawPixelRect(4, 27, 2, 1);
        drawPixelRect(10, 27, 1, 1);
      }
    }
    
    ctx.restore();
  }, []);

  const resetGame = useCallback(() => {
    dinoY.current = GAME_HEIGHT - GROUND_HEIGHT - DINO_HEIGHT;
    dinoVelocity.current = 0;
    isJumping.current = false;
    isDucking.current = false;
    obstacles.current = [];
    gameSpeed.current = INITIAL_SPEED;
    frameCount.current = 0;
    scoreRef.current = 0;
    legFrame.current = 0;
    setScore(0);
  }, []);

  const jump = useCallback(() => {
    if (!isJumping.current && gameState === 'playing') {
      dinoVelocity.current = JUMP_FORCE;
      isJumping.current = true;
    }
  }, [gameState]);

  const startDuck = useCallback(() => {
    if (gameState === 'playing') {
      isDucking.current = true;
    }
  }, [gameState]);

  const endDuck = useCallback(() => {
    isDucking.current = false;
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setGameState('playing');
  }, [resetGame]);

  const gameOver = useCallback(() => {
    setGameState('gameover');
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    const finalScore = scoreRef.current;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('dinoHighScore', finalScore.toString());
      setShowConfetti(true);
      addStars(Math.floor(finalScore / 100));
      setTimeout(() => setShowConfetti(false), 3000);
    }
    recordAnswer(finalScore > 100);
    incrementGamesPlayed();
  }, [highScore, addStars, recordAnswer, incrementGamesPlayed]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      frameCount.current++;
      legFrame.current++;
      
      // Update score
      if (frameCount.current % 5 === 0) {
        scoreRef.current++;
        setScore(scoreRef.current);
      }

      // Increase speed over time
      if (frameCount.current % 500 === 0) {
        gameSpeed.current += 0.5;
      }

      // Apply gravity
      dinoVelocity.current += GRAVITY;
      dinoY.current += dinoVelocity.current;

      // Ground collision
      const currentHeight = isDucking.current ? DINO_DUCK_HEIGHT : DINO_HEIGHT;
      const groundLevel = GAME_HEIGHT - GROUND_HEIGHT - currentHeight;
      if (dinoY.current >= groundLevel) {
        dinoY.current = groundLevel;
        dinoVelocity.current = 0;
        isJumping.current = false;
      }

      // Spawn obstacles
      if (frameCount.current % Math.floor(100 - gameSpeed.current * 3) === 0 && Math.random() > 0.3) {
        const types: Array<'cactus' | 'bird' | 'meteor' | 'doubleCactus'> = ['cactus', 'cactus', 'bird', 'doubleCactus', 'meteor'];
        const type = types[Math.floor(Math.random() * types.length)];
        obstacles.current.push({
          id: Date.now(),
          x: GAME_WIDTH,
          type,
          height: type === 'bird' ? (Math.random() > 0.5 ? 'high' : 'low') : 'low',
        });
      }

      // Update obstacles
      obstacles.current = obstacles.current.filter(obs => {
        obs.x -= gameSpeed.current;
        return obs.x > -50;
      });

      // Collision detection
      const dinoBox = {
        x: 50 + (isDucking.current ? 0 : 8),
        y: dinoY.current + (isDucking.current ? 20 : 0),
        width: isDucking.current ? 70 : 50,
        height: isDucking.current ? 28 : DINO_HEIGHT - 6,
      };

      for (const obs of obstacles.current) {
        let obsBox = { x: 0, y: 0, width: 0, height: 0 };
        
        if (obs.type === 'cactus') {
          obsBox = {
            x: obs.x + 8,
            y: GAME_HEIGHT - GROUND_HEIGHT - 50,
            width: 18,
            height: 50,
          };
        } else if (obs.type === 'doubleCactus') {
          obsBox = {
            x: obs.x + 5,
            y: GAME_HEIGHT - GROUND_HEIGHT - 55,
            width: 42,
            height: 55,
          };
        } else if (obs.type === 'bird') {
          obsBox = {
            x: obs.x + 5,
            y: obs.height === 'high' ? GAME_HEIGHT - GROUND_HEIGHT - 80 : GAME_HEIGHT - GROUND_HEIGHT - 50,
            width: 38,
            height: 28,
          };
        } else if (obs.type === 'meteor') {
          obsBox = {
            x: obs.x + 2,
            y: GAME_HEIGHT - GROUND_HEIGHT - 58,
            width: 32,
            height: 38,
          };
        }

        if (
          dinoBox.x < obsBox.x + obsBox.width &&
          dinoBox.x + dinoBox.width > obsBox.x &&
          dinoBox.y < obsBox.y + obsBox.height &&
          dinoBox.y + dinoBox.height > obsBox.y
        ) {
          gameOver();
          return;
        }
      }

      // Draw
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Background gradient (space theme)
      const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      gradient.addColorStop(0, '#0c0815');
      gradient.addColorStop(0.5, '#1a1025');
      gradient.addColorStop(1, '#15101f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Stars (parallax)
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const parallax = i % 3 === 0 ? 0.3 : i % 2 === 0 ? 0.5 : 0.7;
        const x = (i * 47 + frameCount.current * parallax) % GAME_WIDTH;
        const y = (i * 23 + i * 7) % (GAME_HEIGHT - GROUND_HEIGHT - 30);
        const size = i % 4 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1;
        ctx.globalAlpha = i % 3 === 0 ? 1 : 0.6;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Ground (pixel art style like Chrome)
      ctx.fillStyle = '#535353';
      ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, 2);
      
      // Ground texture (scrolling dots/bumps)
      ctx.fillStyle = '#535353';
      const groundOffset = (frameCount.current * gameSpeed.current) % 20;
      for (let i = 0; i < GAME_WIDTH + 20; i += 20) {
        const xPos = i - groundOffset;
        // Random-ish ground texture
        ctx.fillRect(xPos, GAME_HEIGHT - GROUND_HEIGHT + 6, 3, 2);
        ctx.fillRect(xPos + 8, GAME_HEIGHT - GROUND_HEIGHT + 10, 2, 2);
        ctx.fillRect(xPos + 14, GAME_HEIGHT - GROUND_HEIGHT + 4, 4, 2);
      }

      // Draw obstacles
      for (const obs of obstacles.current) {
        const groundY = GAME_HEIGHT - GROUND_HEIGHT;
        
        if (obs.type === 'cactus') {
          // Single cactus (pixel art style)
          ctx.fillStyle = '#535353';
          // Main stem
          ctx.fillRect(obs.x + 10, groundY - 50, 12, 50);
          // Left arm
          ctx.fillRect(obs.x, groundY - 35, 12, 8);
          ctx.fillRect(obs.x, groundY - 42, 8, 15);
          // Right arm
          ctx.fillRect(obs.x + 20, groundY - 28, 12, 8);
          ctx.fillRect(obs.x + 24, groundY - 38, 8, 18);
          // Highlights
          ctx.fillStyle = '#6b6b6b';
          ctx.fillRect(obs.x + 12, groundY - 50, 4, 50);
          ctx.fillRect(obs.x + 2, groundY - 42, 3, 12);
        } else if (obs.type === 'doubleCactus') {
          // Double cactus (pixel art style)
          ctx.fillStyle = '#535353';
          // First cactus (tall)
          ctx.fillRect(obs.x + 5, groundY - 55, 12, 55);
          ctx.fillRect(obs.x - 5, groundY - 38, 12, 8);
          ctx.fillRect(obs.x - 5, groundY - 48, 8, 18);
          ctx.fillRect(obs.x + 15, groundY - 42, 10, 8);
          // Second cactus (shorter)
          ctx.fillRect(obs.x + 30, groundY - 40, 12, 40);
          ctx.fillRect(obs.x + 40, groundY - 30, 10, 8);
          // Highlights
          ctx.fillStyle = '#6b6b6b';
          ctx.fillRect(obs.x + 8, groundY - 55, 4, 55);
          ctx.fillRect(obs.x + 33, groundY - 40, 4, 40);
        } else if (obs.type === 'bird') {
          // Pterodactyl (pixel art style)
          const birdY = obs.height === 'high' ? groundY - 75 : groundY - 45;
          const wingUp = Math.floor(frameCount.current / 8) % 2 === 0;
          
          ctx.fillStyle = '#535353';
          // Body
          ctx.fillRect(obs.x + 12, birdY + 8, 24, 12);
          // Head
          ctx.fillRect(obs.x + 34, birdY + 6, 14, 10);
          // Beak
          ctx.fillRect(obs.x + 46, birdY + 10, 8, 4);
          // Eye
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(obs.x + 42, birdY + 8, 4, 4);
          ctx.fillStyle = '#000000';
          ctx.fillRect(obs.x + 44, birdY + 9, 2, 2);
          
          // Wings
          ctx.fillStyle = '#535353';
          if (wingUp) {
            ctx.fillRect(obs.x + 8, birdY - 2, 28, 8);
            ctx.fillRect(obs.x, birdY - 6, 12, 6);
          } else {
            ctx.fillRect(obs.x + 8, birdY + 14, 28, 8);
            ctx.fillRect(obs.x, birdY + 18, 12, 6);
          }
          // Tail
          ctx.fillRect(obs.x + 2, birdY + 10, 12, 6);
        } else if (obs.type === 'meteor') {
          // Meteor with glow
          const meteorY = groundY - 40;
          
          // Glow effect
          const glowGradient = ctx.createRadialGradient(
            obs.x + 18, meteorY, 5,
            obs.x + 18, meteorY, 35
          );
          glowGradient.addColorStop(0, 'rgba(236, 72, 153, 0.6)');
          glowGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(obs.x + 18, meteorY, 35, 0, Math.PI * 2);
          ctx.fill();
          
          // Meteor body (pixel art)
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(obs.x + 6, meteorY - 12, 24, 24);
          ctx.fillRect(obs.x + 2, meteorY - 8, 32, 16);
          ctx.fillRect(obs.x + 10, meteorY - 16, 16, 4);
          ctx.fillRect(obs.x + 10, meteorY + 12, 16, 4);
          
          // Craters
          ctx.fillStyle = '#be185d';
          ctx.fillRect(obs.x + 8, meteorY - 6, 6, 6);
          ctx.fillRect(obs.x + 20, meteorY + 2, 8, 8);
          ctx.fillRect(obs.x + 12, meteorY + 4, 4, 4);
        }
      }

      // Draw dino
      drawDino(ctx, 50, dinoY.current, isDucking.current, !isJumping.current, selectedCharacter);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameOver, drawDino, selectedCharacter]);

  // Draw idle/gameover state
  useEffect(() => {
    if (gameState === 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#0c0815');
    gradient.addColorStop(0.5, '#1a1025');
    gradient.addColorStop(1, '#15101f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const x = (i * 47) % GAME_WIDTH;
      const y = (i * 23 + i * 7) % (GAME_HEIGHT - GROUND_HEIGHT - 30);
      const size = i % 4 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1;
      ctx.globalAlpha = i % 3 === 0 ? 1 : 0.6;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Ground
    ctx.fillStyle = '#2d1f4e';
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, 2);

    // Dino
    drawDino(ctx, 50, GAME_HEIGHT - GROUND_HEIGHT - DINO_HEIGHT, false, false, selectedCharacter);

  }, [gameState, drawDino, selectedCharacter]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'idle' || gameState === 'gameover') {
          startGame();
        } else if (gameState === 'playing') {
          jump();
        }
      }
      if (e.code === 'ArrowDown' && gameState === 'playing') {
        e.preventDefault();
        startDuck();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        endDuck();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startGame, jump, startDuck, endDuck]);

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-4 md:p-6 relative overflow-hidden bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900">
      <Confetti show={showConfetti} />

      {/* Header */}
      <header className="max-w-4xl mx-auto mb-4 sm:mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:text-white transition-all text-sm backdrop-blur min-h-[44px] touch-target"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Back
          </motion.button>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/10 backdrop-blur rounded-xl px-3 sm:px-4 py-2 border border-white/20">
              <span className="text-gray-400 text-xs sm:text-sm">Score: </span>
              <span className="text-white font-bold">{score}</span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-3 sm:px-4 py-2 border border-white/20">
              <span className="text-gray-400 text-xs sm:text-sm">Best: </span>
              <span className="text-yellow-400 font-bold">{highScore}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <motion.div
          className="text-center mb-4 sm:mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2 px-1">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              🦖 Space Dino Runner 🚀
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Jump over obstacles and survive as long as you can!</p>
        </motion.div>

        {/* Game Canvas */}
        <motion.div
          className="relative rounded-2xl overflow-hidden border-2 border-purple-500/50 mx-auto"
          style={{ width: GAME_WIDTH, maxWidth: '100%' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="block w-full"
          />

          {/* Overlay for idle/gameover */}
          <AnimatePresence>
            {(gameState === 'idle' || gameState === 'gameover') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm"
              >
                {gameState === 'gameover' && (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-red-400 text-2xl font-bold mb-2"
                  >
                    Game Over!
                  </motion.div>
                )}
                {gameState === 'gameover' && score > 0 && (
                  <div className="text-white text-lg mb-4">
                    Score: <span className="text-yellow-400 font-bold">{score}</span>
                  </div>
                )}
                <motion.button
                  onClick={startGame}
                  className="px-6 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-base sm:text-lg min-h-[48px] touch-target"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {gameState === 'idle' ? '🎮 Start Game' : '🔄 Play Again'}
                </motion.button>
                <p className="text-gray-400 text-xs sm:text-sm mt-4">Press SPACE or tap to jump</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="mt-4 sm:mt-6 bg-white/5 backdrop-blur rounded-2xl p-3 sm:p-4 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-white font-semibold mb-3 text-center text-sm sm:text-base">Controls</h3>
          <div className="flex justify-center gap-3 sm:gap-4 flex-wrap">
            <motion.button
              onTouchStart={() => {
                if (gameState === 'idle' || gameState === 'gameover') {
                  startGame();
                } else {
                  jump();
                }
              }}
              onClick={() => {
                if (gameState === 'idle' || gameState === 'gameover') {
                  startGame();
                } else {
                  jump();
                }
              }}
              className="min-w-[72px] w-20 sm:w-24 h-14 sm:h-16 rounded-xl bg-gradient-to-b from-green-500/30 to-green-600/30 border-2 border-green-500/50 text-white font-bold text-lg sm:text-xl flex flex-col items-center justify-center touch-target"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>↑</span>
              <span className="text-xs">Jump</span>
            </motion.button>
            <motion.button
              onTouchStart={startDuck}
              onTouchEnd={endDuck}
              onMouseDown={startDuck}
              onMouseUp={endDuck}
              onMouseLeave={endDuck}
              className="min-w-[72px] w-20 sm:w-24 h-14 sm:h-16 rounded-xl bg-gradient-to-b from-amber-500/30 to-amber-600/30 border-2 border-amber-500/50 text-white font-bold text-lg sm:text-xl flex flex-col items-center justify-center touch-target"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>↓</span>
              <span className="text-xs">Duck</span>
            </motion.button>
          </div>
          <p className="text-gray-500 text-xs text-center mt-3">
            Keyboard: SPACE/↑ to jump, ↓ to duck
          </p>
        </motion.div>

        {/* Obstacle Guide */}
        <motion.div
          className="mt-4 text-center px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap justify-center">
            <span className="text-green-400">🌵 Cactus - Jump!</span>
            <span className="text-red-400">🦅 Pterodactyl - Jump or Duck!</span>
            <span className="text-pink-400">☄️ Meteor - Jump!</span>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
