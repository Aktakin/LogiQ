'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';

type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

interface Level {
  id: number;
  name: string;
  gridSize: number;
  bunnyStart: Position;
  carrots: Position[];
  obstacles: Position[];
  maxCommands: number;
  hint: string;
  isChallenge?: boolean;
}

const directionIcons: Record<Direction, { icon: string; label: string; color: string }> = {
  up: { icon: '⬆️', label: 'Up', color: '#60a5fa' },
  down: { icon: '⬇️', label: 'Down', color: '#f472b6' },
  left: { icon: '⬅️', label: 'Left', color: '#fbbf24' },
  right: { icon: '➡️', label: 'Right', color: '#34d399' },
};

const levels: Level[] = [
  // === BEGINNER (3x3 grid) ===
  { id: 1, name: 'First Steps', gridSize: 3, bunnyStart: { x: 0, y: 1 }, carrots: [{ x: 2, y: 1 }], obstacles: [], maxCommands: 4, hint: 'Move right twice to get the carrot!' },
  { id: 2, name: 'Going Up', gridSize: 3, bunnyStart: { x: 1, y: 2 }, carrots: [{ x: 1, y: 0 }], obstacles: [], maxCommands: 4, hint: 'Move up twice!' },
  { id: 3, name: 'Down the Hill', gridSize: 3, bunnyStart: { x: 1, y: 0 }, carrots: [{ x: 1, y: 2 }], obstacles: [], maxCommands: 4, hint: 'Move down twice!' },
  { id: 4, name: 'Corner Carrot', gridSize: 3, bunnyStart: { x: 0, y: 2 }, carrots: [{ x: 2, y: 0 }], obstacles: [], maxCommands: 5, hint: 'Go right, then up to reach the corner!' },
  
  // ⭐ CHALLENGE LEVEL
  { id: 5, name: 'First Challenge', gridSize: 5, bunnyStart: { x: 0, y: 4 }, carrots: [{ x: 4, y: 0 }, { x: 2, y: 2 }], obstacles: [{ x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 1 }, { x: 3, y: 2 }], maxCommands: 12, hint: 'Your first real challenge! Navigate through the rocks to get both carrots.', isChallenge: true },
  
  { id: 6, name: 'Other Corner', gridSize: 3, bunnyStart: { x: 2, y: 0 }, carrots: [{ x: 0, y: 2 }], obstacles: [], maxCommands: 5, hint: 'Go left, then down!' },
  { id: 7, name: 'Two Treats', gridSize: 3, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 2, y: 0 }, { x: 2, y: 2 }], obstacles: [], maxCommands: 5, hint: 'Collect both carrots! Go right first.' },
  { id: 8, name: 'L-Shape', gridSize: 3, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 0, y: 2 }, { x: 2, y: 2 }], obstacles: [], maxCommands: 5, hint: 'Make an L shape - down then right!' },
  { id: 9, name: 'Around the Rock', gridSize: 3, bunnyStart: { x: 0, y: 1 }, carrots: [{ x: 2, y: 1 }], obstacles: [{ x: 1, y: 1 }], maxCommands: 5, hint: 'There\'s a rock in the way! Go around it.' },
  
  // ⭐ CHALLENGE LEVEL
  { id: 10, name: 'Double Trouble', gridSize: 5, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 4, y: 4 }, { x: 2, y: 0 }], obstacles: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }, { x: 1, y: 3 }], maxCommands: 12, hint: 'Navigate around multiple rocks to get both carrots!', isChallenge: true },
  
  { id: 11, name: 'Rocky Corner', gridSize: 3, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 2, y: 2 }], obstacles: [{ x: 1, y: 1 }], maxCommands: 5, hint: 'Go around the rock in the middle!' },
  { id: 12, name: 'Triple Snack', gridSize: 3, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }], obstacles: [], maxCommands: 4, hint: 'Follow the carrot trail!' },
  
  // === EASY (4x4 grid) ===
  { id: 13, name: 'Bigger Garden', gridSize: 4, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 3, y: 0 }], obstacles: [], maxCommands: 5, hint: 'The garden is bigger now! Go right three times.' },
  { id: 14, name: 'Long Walk', gridSize: 4, bunnyStart: { x: 0, y: 3 }, carrots: [{ x: 3, y: 0 }], obstacles: [], maxCommands: 7, hint: 'Walk across and up the garden!' },
  
  // ⭐ CHALLENGE LEVEL  
  { id: 15, name: 'Wall Climb', gridSize: 5, bunnyStart: { x: 0, y: 2 }, carrots: [{ x: 4, y: 2 }, { x: 4, y: 0 }], obstacles: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }], maxCommands: 14, hint: 'A massive wall blocks you! Find the only way around.', isChallenge: true },
  
  { id: 16, name: 'Carrot Trail', gridSize: 4, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], obstacles: [], maxCommands: 5, hint: 'Follow the trail of carrots!' },
  { id: 17, name: 'Zigzag Path', gridSize: 4, bunnyStart: { x: 0, y: 3 }, carrots: [{ x: 3, y: 0 }], obstacles: [{ x: 1, y: 2 }, { x: 2, y: 1 }], maxCommands: 8, hint: 'Zigzag around the rocks!' },
  { id: 18, name: 'Four Corners', gridSize: 4, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 3, y: 0 }, { x: 3, y: 3 }], obstacles: [], maxCommands: 7, hint: 'Visit two corners of the garden!' },
  
  // ⭐ CHALLENGE LEVEL
  { id: 19, name: 'Lake Hop', gridSize: 5, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 4, y: 4 }, { x: 0, y: 4 }, { x: 4, y: 0 }], obstacles: [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }], maxCommands: 16, hint: 'A huge lake blocks the middle! Collect all 3 carrots around it.', isChallenge: true },
  
  // === MEDIUM (4x4 with obstacles) ===
  { id: 20, name: 'Rock Garden', gridSize: 4, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 3, y: 3 }], obstacles: [{ x: 1, y: 1 }, { x: 2, y: 2 }], maxCommands: 8, hint: 'Navigate around the diagonal rocks!' },
  { id: 21, name: 'The Wall', gridSize: 4, bunnyStart: { x: 0, y: 1 }, carrots: [{ x: 3, y: 1 }], obstacles: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }], maxCommands: 8, hint: 'There\'s a wall of rocks - go around it!' },
  { id: 22, name: 'Square Dance', gridSize: 4, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 3, y: 0 }, { x: 3, y: 3 }, { x: 0, y: 3 }], obstacles: [{ x: 1, y: 1 }, { x: 2, y: 2 }], maxCommands: 10, hint: 'Go around the edges to collect all carrots!' },
  
  // ⭐ CHALLENGE LEVEL
  { id: 23, name: 'Corridor Run', gridSize: 6, bunnyStart: { x: 0, y: 2 }, carrots: [{ x: 5, y: 2 }, { x: 5, y: 4 }], obstacles: [{ x: 1, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 1 }, { x: 2, y: 3 }, { x: 3, y: 1 }, { x: 3, y: 3 }, { x: 4, y: 1 }, { x: 4, y: 3 }], maxCommands: 10, hint: 'Run through the long narrow corridor and grab both carrots!', isChallenge: true },
  
  { id: 24, name: 'Maze Runner', gridSize: 4, bunnyStart: { x: 0, y: 3 }, carrots: [{ x: 3, y: 0 }], obstacles: [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 1 }], maxCommands: 8, hint: 'Find the path through the rocks!' },
  { id: 25, name: 'Treasure Hunt', gridSize: 4, bunnyStart: { x: 0, y: 2 }, carrots: [{ x: 1, y: 0 }, { x: 3, y: 2 }, { x: 2, y: 3 }], obstacles: [{ x: 1, y: 2 }, { x: 2, y: 1 }], maxCommands: 10, hint: 'Plan your route to get all three carrots!' },
  
  // === 5x5 grid ===
  { id: 26, name: 'Big Field', gridSize: 5, bunnyStart: { x: 0, y: 4 }, carrots: [{ x: 4, y: 0 }], obstacles: [], maxCommands: 9, hint: 'Cross the big field diagonally!' },
  
  // ⭐ CHALLENGE LEVEL
  { id: 27, name: 'Spiral Maze', gridSize: 6, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 3, y: 3 }, { x: 5, y: 5 }], obstacles: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 3 }], maxCommands: 20, hint: 'Spiral your way through and collect both carrots!', isChallenge: true },
  
  { id: 28, name: 'Snake Path', gridSize: 5, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 4, y: 4 }], obstacles: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }], maxCommands: 10, hint: 'Slither like a snake around the rocks!' },
  { id: 29, name: 'Five Feast', gridSize: 5, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 1 }], obstacles: [], maxCommands: 6, hint: 'Collect all five carrots in a row!' },
  { id: 30, name: 'Around the Lake', gridSize: 5, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 4, y: 4 }], obstacles: [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }], maxCommands: 10, hint: 'The lake is in the middle - go around it!' },
  
  // ⭐ CHALLENGE LEVEL
  { id: 31, name: 'Double Walls', gridSize: 6, bunnyStart: { x: 0, y: 2 }, carrots: [{ x: 5, y: 2 }, { x: 3, y: 5 }, { x: 5, y: 0 }], obstacles: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }, { x: 4, y: 5 }], maxCommands: 18, hint: 'Two massive walls block your path! Collect all 3 carrots.', isChallenge: true },
  
  // === EXPERT (5x5 challenging) ===
  { id: 32, name: 'Rocky Road', gridSize: 5, bunnyStart: { x: 0, y: 4 }, carrots: [{ x: 4, y: 0 }], obstacles: [{ x: 1, y: 3 }, { x: 2, y: 2 }, { x: 3, y: 1 }, { x: 2, y: 4 }, { x: 4, y: 2 }], maxCommands: 10, hint: 'Find the winding path through all the rocks!' },
  { id: 33, name: 'Carrot Kingdom', gridSize: 5, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }], obstacles: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }], maxCommands: 14, hint: 'Go around the wall to collect all three carrots!' },
  
  // ⭐ CHALLENGE LEVEL
  { id: 34, name: 'The Labyrinth', gridSize: 6, bunnyStart: { x: 0, y: 5 }, carrots: [{ x: 5, y: 0 }, { x: 2, y: 0 }, { x: 4, y: 5 }], obstacles: [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 }, { x: 3, y: 5 }, { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }], maxCommands: 22, hint: 'Navigate the labyrinth and collect all 3 carrots!', isChallenge: true },
  
  { id: 35, name: 'The Maze', gridSize: 5, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 4, y: 4 }], obstacles: [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 }], maxCommands: 12, hint: 'This is a real maze - find the only path!' },
  { id: 36, name: 'Six Carrots', gridSize: 5, bunnyStart: { x: 0, y: 2 }, carrots: [{ x: 1, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 2 }, { x: 3, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 2 }], obstacles: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 }, { x: 4, y: 4 }], maxCommands: 14, hint: 'Collect all six carrots - plan carefully!' },
  
  // ⭐ CHALLENGE LEVEL
  { id: 37, name: 'Seven Stars', gridSize: 6, bunnyStart: { x: 0, y: 3 }, carrots: [{ x: 1, y: 1 }, { x: 3, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 4 }, { x: 3, y: 5 }, { x: 1, y: 4 }, { x: 3, y: 3 }], obstacles: [{ x: 2, y: 2 }, { x: 4, y: 2 }, { x: 2, y: 3 }, { x: 4, y: 3 }, { x: 0, y: 0 }, { x: 5, y: 5 }], maxCommands: 26, hint: 'Collect all SEVEN carrots in the star pattern!', isChallenge: true },
  
  { id: 38, name: 'Bunny Master', gridSize: 5, bunnyStart: { x: 0, y: 4 }, carrots: [{ x: 2, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 2 }, { x: 4, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 0 }], obstacles: [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 2 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }], maxCommands: 16, hint: 'Collect all carrots around the rocky center!' },
  
  // ⭐ CHALLENGE LEVEL
  { id: 39, name: 'Fortress', gridSize: 6, bunnyStart: { x: 0, y: 0 }, carrots: [{ x: 3, y: 3 }, { x: 3, y: 2 }], obstacles: [{ x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 2, y: 2 }, { x: 4, y: 2 }, { x: 2, y: 3 }, { x: 4, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 1, y: 2 }, { x: 1, y: 3 }], maxCommands: 16, hint: 'Break into the fortress and grab both carrots inside!', isChallenge: true },
  
  // FINAL LEVEL
  { id: 40, name: '🏆 Grand Champion', gridSize: 6, bunnyStart: { x: 0, y: 5 }, carrots: [{ x: 2, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 3 }, { x: 5, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 2 }, { x: 3, y: 3 }], obstacles: [{ x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 1 }, { x: 3, y: 4 }, { x: 4, y: 2 }, { x: 4, y: 3 }], maxCommands: 24, hint: 'The ULTIMATE test! Collect all 8 carrots!' },
];

export default function CodeCritterGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [commands, setCommands] = useState<Direction[]>([]);
  const [bunnyPos, setBunnyPos] = useState<Position>({ x: 0, y: 0 });
  const [collectedCarrots, setCollectedCarrots] = useState<Position[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [executingIndex, setExecutingIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hitObstacle, setHitObstacle] = useState(false);

  const level = levels[currentLevelIndex];

  const resetLevel = useCallback(() => {
    if (level) {
      setBunnyPos(level.bunnyStart);
      setCollectedCarrots([]);
      setCommands([]);
      setIsRunning(false);
      setIsComplete(false);
      setExecutingIndex(-1);
      setShowHint(false);
      setHitObstacle(false);
    }
  }, [level]);

  useEffect(() => {
    resetLevel();
  }, [resetLevel, currentLevelIndex]);

  useEffect(() => {
    if (!hitObstacle) return;
    const t = setTimeout(() => setHitObstacle(false), 2500);
    return () => clearTimeout(t);
  }, [hitObstacle]);

  const addCommand = (direction: Direction) => {
    if (commands.length < level.maxCommands && !isRunning) {
      setCommands((prev) => [...prev, direction]);
    }
  };

  const removeLastCommand = () => {
    if (!isRunning && commands.length > 0) {
      setCommands((prev) => prev.slice(0, -1));
    }
  };

  const clearCommands = () => {
    if (!isRunning) {
      setCommands([]);
    }
  };

  const getNewPosition = (pos: Position, dir: Direction): Position => {
    switch (dir) {
      case 'up': return { x: pos.x, y: pos.y - 1 };
      case 'down': return { x: pos.x, y: pos.y + 1 };
      case 'left': return { x: pos.x - 1, y: pos.y };
      case 'right': return { x: pos.x + 1, y: pos.y };
    }
  };

  const executeCommands = async () => {
    if (commands.length === 0 || isRunning) return;

    setIsRunning(true);
    setHitObstacle(false);
    let pos = { ...level.bunnyStart };
    const collected: Position[] = [];

    for (let i = 0; i < commands.length; i++) {
      setExecutingIndex(i);
      const cmd = commands[i];

      await new Promise((resolve) => setTimeout(resolve, 500));

      const newPos = getNewPosition(pos, cmd);

      // Check bounds
      if (newPos.x < 0 || newPos.x >= level.gridSize || newPos.y < 0 || newPos.y >= level.gridSize) {
        setHitObstacle(true);
        setIsRunning(false);
        setExecutingIndex(-1);
        recordAnswer(false);
        return;
      }

      // Check obstacles
      if (level.obstacles.some((o) => o.x === newPos.x && o.y === newPos.y)) {
        setHitObstacle(true);
        setIsRunning(false);
        setExecutingIndex(-1);
        recordAnswer(false);
        return;
      }

      pos = newPos;
      setBunnyPos({ ...pos });

      // Check for carrot collection
      const carrotHere = level.carrots.find(
        (c) => c.x === pos.x && c.y === pos.y && !collected.some((col) => col.x === c.x && col.y === c.y)
      );
      if (carrotHere) {
        collected.push(carrotHere);
        setCollectedCarrots([...collected]);
      }

      // Check win condition
      if (collected.length === level.carrots.length) {
        setIsComplete(true);
        setShowConfetti(true);
        const levelScore = Math.max(10, 30 - (commands.length - level.carrots.length) * 3);
        setScore((prev) => prev + levelScore);
        addStars(2);
        recordAnswer(true);
        incrementGamesPlayed();
        setTimeout(() => setShowConfetti(false), 3000);
        setExecutingIndex(-1);
        setIsRunning(false);
        return;
      }
    }

    setExecutingIndex(-1);
    setIsRunning(false);

    if (collected.length !== level.carrots.length) {
      recordAnswer(false);
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex((prev) => prev + 1);
    } else {
      router.push('/games/programming');
    }
  };

  if (!level) return null;

  const cellSize = level.gridSize === 3 ? 80 : level.gridSize <= 5 ? 70 : 60;
  const isChallenge = level.isChallenge;

  return (
    <main className={`min-h-screen min-h-[100dvh] p-3 sm:p-4 md:p-6 relative overflow-hidden ${
      isChallenge 
        ? 'bg-gradient-to-b from-purple-950/90 via-fuchsia-950/50 to-slate-950' 
        : 'bg-gradient-to-b from-green-950/90 via-emerald-950/50 to-slate-950'
    }`}>
      <FloatingShapes />
      <Confetti show={showConfetti} />

      {/* Challenge Level Banner */}
      {isChallenge && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600/80 via-fuchsia-500/80 to-purple-600/80 py-2 z-20"
        >
          <div className="flex items-center justify-center gap-2 text-white font-bold text-sm">
            <span className="animate-pulse">⚡</span>
            <span>CHALLENGE LEVEL</span>
            <span className="animate-pulse">⚡</span>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative z-10 mb-4 ${isChallenge ? 'mt-8' : ''}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <motion.button
            onClick={() => router.push('/games/programming')}
            className={`glass px-3 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors text-sm min-h-[44px] touch-target ${
              isChallenge ? 'border border-purple-500/50' : ''
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back
          </motion.button>

          <div className="flex items-center gap-3">
            <div className={`glass px-3 py-1.5 rounded-xl text-center ${isChallenge ? 'border border-purple-500/50' : ''}`}>
              <div className="text-xs text-gray-400">Level</div>
              <div className={`text-lg font-bold ${isChallenge ? 'text-purple-300' : 'text-white'}`}>
                {currentLevelIndex + 1}/{levels.length}
              </div>
            </div>
            <div className={`glass px-3 py-1.5 rounded-xl text-center ${isChallenge ? 'border border-purple-500/50' : ''}`}>
              <div className="text-xs text-gray-400">Score</div>
              <div className="text-lg font-bold text-yellow-400">⭐ {score}</div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Title */}
        <motion.div className="text-center mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className={`text-2xl md:text-3xl font-bold mb-1 ${isChallenge ? 'text-purple-200' : 'text-white'}`}>
            {isChallenge ? '⚡' : '🐰'} {level.name} {isChallenge ? '⚡' : ''}
          </h1>
          <p className={`text-sm ${isChallenge ? 'text-purple-300' : 'text-gray-400'}`}>
            {isChallenge 
              ? `Challenge! Collect ${level.carrots.length === 1 ? 'the carrot' : `all ${level.carrots.length} carrots`} to prove your skills!`
              : `Help the bunny collect ${level.carrots.length === 1 ? 'the carrot' : `all ${level.carrots.length} carrots`}!`
            }
          </p>
        </motion.div>

        <div className="flex flex-col items-center gap-6">
          {/* Game Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass rounded-2xl p-4 sm:p-6 ${isChallenge ? 'border-2 border-purple-500/50 shadow-lg shadow-purple-500/20' : ''}`}
          >
            <div
              className="grid gap-1 mx-auto"
              style={{
                gridTemplateColumns: `repeat(${level.gridSize}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${level.gridSize}, ${cellSize}px)`,
              }}
            >
              {Array.from({ length: level.gridSize * level.gridSize }).map((_, idx) => {
                const x = idx % level.gridSize;
                const y = Math.floor(idx / level.gridSize);
                const isBunny = x === bunnyPos.x && y === bunnyPos.y;
                const isCarrot = level.carrots.some((c) => c.x === x && c.y === y);
                const isCollected = collectedCarrots.some((c) => c.x === x && c.y === y);
                const isObstacle = level.obstacles.some((o) => o.x === x && o.y === y);
                const isStart = x === level.bunnyStart.x && y === level.bunnyStart.y;

                return (
                  <motion.div
                    key={idx}
                    className={`rounded-xl flex items-center justify-center relative ${
                      isObstacle
                        ? isChallenge ? 'bg-purple-900/60 border-2 border-purple-500/50' : 'bg-stone-700/60 border-2 border-stone-500/50'
                        : isStart && !isBunny
                        ? isChallenge ? 'bg-fuchsia-500/20 border-2 border-fuchsia-400/40' : 'bg-blue-500/20 border-2 border-blue-400/40'
                        : isChallenge ? 'bg-purple-800/30 border-2 border-purple-600/30' : 'bg-green-800/30 border-2 border-green-600/30'
                    }`}
                    style={{ width: cellSize, height: cellSize }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    {/* Grass decoration */}
                    {!isObstacle && !isBunny && !isCarrot && (
                      <span className="text-lg opacity-30">🌱</span>
                    )}

                    {/* Rock obstacle */}
                    {isObstacle && <span className="text-3xl">🪨</span>}

                    {/* Carrot */}
                    {isCarrot && !isCollected && !isBunny && (
                      <motion.span
                        className="text-3xl"
                        animate={{ rotate: [-5, 5, -5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        🥕
                      </motion.span>
                    )}

                    {/* Collected sparkle */}
                    {isCarrot && isCollected && !isBunny && (
                      <motion.span
                        className="text-2xl"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, opacity: [1, 0.5, 1] }}
                        transition={{ duration: 0.5 }}
                      >
                        ✨
                      </motion.span>
                    )}

                    {/* Bunny */}
                    {isBunny && (
                      <motion.div
                        className="text-4xl drop-shadow-lg"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        🐰
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Carrot counter */}
            <div className="flex justify-center mt-4 gap-2">
              <span className="text-gray-400 text-sm">Carrots:</span>
              <div className="flex gap-1">
                {level.carrots.map((_, i) => (
                  <span key={i} className={i < collectedCarrots.length ? 'text-xl' : 'text-xl opacity-30'}>
                    🥕
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Arrow Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4"
          >
            <h3 className="text-white font-semibold mb-3 text-center text-sm">Tap arrows to program!</h3>
            <div className="grid grid-cols-3 gap-2 w-fit mx-auto">
              <div />
              <motion.button
                onClick={() => addCommand('up')}
                disabled={commands.length >= level.maxCommands || isRunning}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 rounded-xl text-3xl bg-blue-500/20 border-2 border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500/40 transition-colors"
              >
                ⬆️
              </motion.button>
              <div />
              <motion.button
                onClick={() => addCommand('left')}
                disabled={commands.length >= level.maxCommands || isRunning}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 rounded-xl text-3xl bg-yellow-500/20 border-2 border-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-500/40 transition-colors"
              >
                ⬅️
              </motion.button>
              <motion.button
                onClick={() => addCommand('down')}
                disabled={commands.length >= level.maxCommands || isRunning}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 rounded-xl text-3xl bg-pink-500/20 border-2 border-pink-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-pink-500/40 transition-colors"
              >
                ⬇️
              </motion.button>
              <motion.button
                onClick={() => addCommand('right')}
                disabled={commands.length >= level.maxCommands || isRunning}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 rounded-xl text-3xl bg-green-500/20 border-2 border-green-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-500/40 transition-colors"
              >
                ➡️
              </motion.button>
            </div>
          </motion.div>

          {/* Command Sequence */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-4 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Your Code:</h3>
              <span className="text-gray-400 text-xs">
                {commands.length}/{level.maxCommands} steps
              </span>
            </div>

            <div className="min-h-[60px] flex flex-wrap gap-2 mb-4 p-3 rounded-xl bg-black/20">
              {commands.length === 0 ? (
                <span className="text-gray-500 text-sm">Tap arrows above to add steps!</span>
              ) : (
                commands.map((cmd, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{
                      scale: 1,
                      boxShadow: executingIndex === i ? '0 0 20px rgba(250, 204, 21, 0.5)' : 'none',
                    }}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                      executingIndex === i ? 'ring-2 ring-yellow-400 bg-yellow-500/30' : 'bg-white/10'
                    }`}
                    style={{ border: `2px solid ${directionIcons[cmd].color}` }}
                  >
                    {directionIcons[cmd].icon}
                  </motion.div>
                ))
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              <motion.button
                onClick={executeCommands}
                disabled={commands.length === 0 || isRunning || isComplete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 rounded-xl font-bold text-white text-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                ▶️ Run!
              </motion.button>
              <motion.button
                onClick={removeLastCommand}
                disabled={isRunning || commands.length === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-3 rounded-xl text-white bg-orange-600/50 hover:bg-orange-500/50 disabled:opacity-50"
                title="Undo"
              >
                ↩️
              </motion.button>
              <motion.button
                onClick={clearCommands}
                disabled={isRunning}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-3 rounded-xl text-white bg-red-600/50 hover:bg-red-500/50 disabled:opacity-50"
                title="Clear all"
              >
                🗑️
              </motion.button>
              <motion.button
                onClick={resetLevel}
                disabled={isRunning}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-3 rounded-xl text-white bg-blue-600/50 hover:bg-blue-500/50 disabled:opacity-50"
                title="Reset"
              >
                🔄
              </motion.button>
            </div>
          </motion.div>

          {/* Hint */}
          <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {!showHint ? (
              <button
                onClick={() => setShowHint(true)}
                className="text-gray-400 hover:text-yellow-400 transition-colors text-sm"
              >
                💡 Need a hint?
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block glass px-4 py-2 rounded-xl"
              >
                <span className="text-yellow-400 text-sm">💡 {level.hint}</span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {hitObstacle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 glass px-6 py-3 rounded-xl border border-red-500/50"
            >
              <p className="text-red-400 font-semibold">💥 Oops! Bunny bumped into something. Try again!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success modal */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="glass rounded-3xl p-8 max-w-md text-center"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Amazing!</h2>
                <p className="text-gray-300 mb-2">
                  You helped bunny get {level.carrots.length === 1 ? 'the carrot' : `all ${level.carrots.length} carrots`}!
                </p>
                <p className="text-gray-400 mb-4 text-sm">Used {commands.length} steps</p>
                <div className="text-3xl font-bold text-yellow-400 mb-6">
                  ⭐ +{Math.max(10, 30 - (commands.length - level.carrots.length) * 3)}
                </div>
                <motion.button
                  onClick={nextLevel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-cosmic px-8 py-4 rounded-xl text-lg"
                >
                  {currentLevelIndex < levels.length - 1 ? 'Next Level →' : 'All Done! 🏆'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
