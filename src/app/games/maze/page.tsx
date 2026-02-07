'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';

interface Cell {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

interface Position {
  x: number;
  y: number;
}

export default function MazeGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const cols = 10;
  const rows = 10;
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [showControls, setShowControls] = useState(true);

  // Generate maze using recursive backtracking
  const generateMaze = useCallback(() => {
    setIsGenerating(true);
    setIsComplete(false);
    setMoveCount(0);
    setStartTime(null);
    setElapsedTime(0);

    // Initialize grid
    const grid: Cell[][] = [];
    for (let y = 0; y < rows; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < cols; x++) {
        row.push({
          x,
          y,
          walls: { top: true, right: true, bottom: true, left: true },
          visited: false,
        });
      }
      grid.push(row);
    }

    // Recursive backtracking algorithm
    const stack: Cell[] = [];
    const startCell = grid[0][0];
    startCell.visited = true;
    stack.push(startCell);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors: Cell[] = [];

      // Check all neighbors
      const directions = [
        { dx: 0, dy: -1, wall: 'top', opposite: 'bottom' },
        { dx: 1, dy: 0, wall: 'right', opposite: 'left' },
        { dx: 0, dy: 1, wall: 'bottom', opposite: 'top' },
        { dx: -1, dy: 0, wall: 'left', opposite: 'right' },
      ];

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !grid[ny][nx].visited) {
          neighbors.push(grid[ny][nx]);
        }
      }

      if (neighbors.length > 0) {
        // Pick random neighbor
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Remove walls between current and next
        const dx = next.x - current.x;
        const dy = next.y - current.y;
        
        if (dx === 1) {
          current.walls.right = false;
          next.walls.left = false;
        } else if (dx === -1) {
          current.walls.left = false;
          next.walls.right = false;
        } else if (dy === 1) {
          current.walls.bottom = false;
          next.walls.top = false;
        } else if (dy === -1) {
          current.walls.top = false;
          next.walls.bottom = false;
        }

        next.visited = true;
        stack.push(next);
      } else {
        stack.pop();
      }
    }

    setMaze(grid);
    setPlayerPos({ x: 0, y: 0 });
    setIsGenerating(false);
    setStartTime(Date.now());
  }, []);

  // Initial maze generation
  useEffect(() => {
    generateMaze();
  }, []);

  // Timer
  useEffect(() => {
    if (startTime && !isComplete) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, isComplete]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete || maze.length === 0) return;

      const { x, y } = playerPos;
      const cell = maze[y]?.[x];
      if (!cell) return;

      let newX = x;
      let newY = y;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (!cell.walls.top && y > 0) newY = y - 1;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (!cell.walls.bottom && y < rows - 1) newY = y + 1;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (!cell.walls.left && x > 0) newX = x - 1;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (!cell.walls.right && x < cols - 1) newX = x + 1;
          break;
      }

      if (newX !== x || newY !== y) {
        setPlayerPos({ x: newX, y: newY });
        setMoveCount(prev => prev + 1);

        // Check win
        if (newX === cols - 1 && newY === rows - 1) {
          setIsComplete(true);
          setShowConfetti(true);
          addStars(3);
          recordAnswer(true);
          incrementGamesPlayed();
          
          const finalTime = Math.floor((Date.now() - (startTime || Date.now())) / 1000);
          if (!bestTime || finalTime < bestTime) {
            setBestTime(finalTime);
          }
          
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, maze, cols, rows, isComplete, startTime, bestTime, addStars, recordAnswer, incrementGamesPlayed]);

  // Touch/click movement
  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (isComplete || maze.length === 0) return;

    const { x, y } = playerPos;
    const cell = maze[y]?.[x];
    if (!cell) return;

    let newX = x;
    let newY = y;

    switch (direction) {
      case 'up':
        if (!cell.walls.top && y > 0) newY = y - 1;
        break;
      case 'down':
        if (!cell.walls.bottom && y < rows - 1) newY = y + 1;
        break;
      case 'left':
        if (!cell.walls.left && x > 0) newX = x - 1;
        break;
      case 'right':
        if (!cell.walls.right && x < cols - 1) newX = x + 1;
        break;
    }

    if (newX !== x || newY !== y) {
      setPlayerPos({ x: newX, y: newY });
      setMoveCount(prev => prev + 1);

      if (newX === cols - 1 && newY === rows - 1) {
        setIsComplete(true);
        setShowConfetti(true);
        addStars(3);
        recordAnswer(true);
        incrementGamesPlayed();
        
        const finalTime = Math.floor((Date.now() - (startTime || Date.now())) / 1000);
        if (!bestTime || finalTime < bestTime) {
          setBestTime(finalTime);
        }
        
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate cell size to fit within a fixed container
  const maxContainerSize = 500;
  const cellSize = Math.floor(maxContainerSize / Math.max(cols, rows));
  const mazeWidth = cols * cellSize;
  const mazeHeight = rows * cellSize;
  
  // Adjust wall thickness based on cell size
  const wallThickness = cellSize > 25 ? 2 : cellSize > 15 ? 1.5 : 1;

  return (
    <main className="min-h-screen p-4 md:p-6 relative overflow-hidden">
      <FloatingShapes />
      <Confetti show={showConfetti} />

      {/* Header */}
      <header className="max-w-4xl mx-auto mb-6 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="glass px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Back
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="glass px-4 py-2 rounded-xl">
              <span className="text-gray-400 text-sm">Moves: </span>
              <span className="text-white font-bold">{moveCount}</span>
            </div>
            <div className="glass px-4 py-2 rounded-xl">
              <span className="text-gray-400 text-sm">Time: </span>
              <span className="text-cyan-400 font-bold">{formatTime(elapsedTime)}</span>
            </div>
            {bestTime && (
              <div className="glass px-4 py-2 rounded-xl">
                <span className="text-gray-400 text-sm">Best: </span>
                <span className="text-yellow-400 font-bold">{formatTime(bestTime)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Title */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              🌟 Maze Runner 🌟
            </span>
          </h1>
          <p className="text-gray-400">Navigate from top-left to bottom-right!</p>
        </motion.div>

        {/* New Maze Button */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            onClick={generateMaze}
            disabled={isGenerating}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isGenerating ? '⏳ Generating...' : '🔄 New Maze'}
          </motion.button>
        </motion.div>

        {/* Maze */}
        <motion.div
          className="flex justify-center mb-4 sm:mb-6 overflow-x-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div
            className="relative bg-slate-900/80 rounded-2xl p-3 sm:p-4 border-2 border-purple-500/30"
            style={{ 
              width: mazeWidth + 32,
              height: mazeHeight + 32,
              boxShadow: '0 0 60px rgba(139, 92, 246, 0.3)'
            }}
          >
            {/* Start indicator */}
            <div 
              className="absolute text-xs text-green-400 font-bold"
              style={{ top: 4, left: 8 }}
            >
              START
            </div>
            
            {/* End indicator */}
            <div 
              className="absolute text-xs text-yellow-400 font-bold"
              style={{ bottom: 4, right: 8 }}
            >
              END
            </div>

            <div
              className="grid mx-auto"
              style={{
                width: mazeWidth,
                height: mazeHeight,
                gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
              }}
            >
              {maze.map((row, y) =>
                row.map((cell, x) => {
                  const isPlayer = playerPos.x === x && playerPos.y === y;
                  const isStart = x === 0 && y === 0;
                  const isEnd = x === cols - 1 && y === rows - 1;

                  return (
                    <div
                      key={`${x}-${y}`}
                      className="relative flex items-center justify-center"
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderTop: cell.walls.top ? `${wallThickness}px solid #8b5cf6` : 'none',
                        borderRight: cell.walls.right ? `${wallThickness}px solid #8b5cf6` : 'none',
                        borderBottom: cell.walls.bottom ? `${wallThickness}px solid #8b5cf6` : 'none',
                        borderLeft: cell.walls.left ? `${wallThickness}px solid #8b5cf6` : 'none',
                        backgroundColor: isPlayer 
                          ? 'rgba(59, 130, 246, 0.3)' 
                          : isStart 
                            ? 'rgba(34, 197, 94, 0.2)' 
                            : isEnd 
                              ? 'rgba(251, 191, 36, 0.2)' 
                              : 'transparent',
                      }}
                    >
                      {isPlayer && (
                        <motion.div
                          style={{ fontSize: Math.max(cellSize * 0.6, 12) }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring' }}
                        >
                          🏃
                        </motion.div>
                      )}
                      {isEnd && !isPlayer && (
                        <span style={{ fontSize: Math.max(cellSize * 0.5, 10) }}>⭐</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* Mobile Controls */}
        <motion.div
          className="glass rounded-2xl p-3 sm:p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Controls</span>
            <button
              type="button"
              onClick={() => setShowControls(!showControls)}
              className="text-gray-400 hover:text-white text-sm min-h-[44px] touch-target flex items-center"
            >
              {showControls ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showControls && (
            <div className="flex flex-col items-center gap-2">
              <motion.button
                type="button"
                onClick={() => handleMove('up')}
                className="w-14 h-12 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-b from-cyan-500/30 to-cyan-600/30 border border-cyan-500/50 text-white font-bold text-xl touch-target"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ↑
              </motion.button>
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  onClick={() => handleMove('left')}
                  className="w-14 h-12 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-b from-purple-500/30 to-purple-600/30 border border-purple-500/50 text-white font-bold text-xl touch-target"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ←
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => handleMove('down')}
                  className="w-14 h-12 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-b from-cyan-500/30 to-cyan-600/30 border border-cyan-500/50 text-white font-bold text-xl touch-target"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ↓
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => handleMove('right')}
                  className="w-14 h-12 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-b from-purple-500/30 to-purple-600/30 border border-purple-500/50 text-white font-bold text-xl touch-target"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  →
                </motion.button>
              </div>
              <p className="text-gray-500 text-xs mt-2">Or use Arrow Keys / WASD</p>
            </div>
          )}
        </motion.div>

        {/* Win Modal */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-3xl p-4 sm:p-8 max-w-md w-full mx-4 text-center"
            >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">Maze Complete!</h2>
                <div className="space-y-2 mb-6">
                  <p className="text-gray-300">
                    Time: <span className="text-cyan-400 font-bold">{formatTime(elapsedTime)}</span>
                  </p>
                  <p className="text-gray-300">
                    Moves: <span className="text-purple-400 font-bold">{moveCount}</span>
                  </p>
                </div>
                <div className="text-3xl font-bold text-yellow-400 mb-6">⭐ +3 Stars!</div>
                <div className="flex gap-3 justify-center">
                  <motion.button
                    onClick={generateMaze}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🔄 New Maze
                  </motion.button>
                  <motion.button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 rounded-xl glass text-gray-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Back
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

