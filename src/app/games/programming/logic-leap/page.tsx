'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

interface Platform {
  id: number;
  condition: string;
  result: boolean;
  x: number;
  y: number;
  isGoal?: boolean;
  isStart?: boolean;
  isTrap?: boolean;
}

type LevelMode = 'select' | 'type';

interface Level {
  id: number;
  mode: LevelMode;
  title: string;
  concept: string;
  variables: Record<string, number | boolean | string>;
  platforms: Platform[];
  hint: string;
}

const selectLevels: Omit<Level, 'id' | 'mode'>[] = [
  {
    title: 'First Evaluation',
    concept: 'Comparison operators: > means "greater than"',
    variables: { x: 10 },
    hint: 'x is 10. Is 10 > 5? Yes! Jump to TRUE platforms.',
    platforms: [
      { id: 0, condition: 'START', result: true, x: 10, y: 80, isStart: true },
      { id: 1, condition: 'x > 5', result: true, x: 35, y: 60 },
      { id: 2, condition: 'x < 5', result: false, x: 35, y: 85, isTrap: true },
      { id: 3, condition: 'GOAL 🎯', result: true, x: 60, y: 40, isGoal: true },
    ],
  },
  {
    title: 'Equal or Not',
    concept: '=== checks if values are exactly equal',
    variables: { score: 100 },
    hint: 'score is 100. Is score === 100? Yes!',
    platforms: [
      { id: 0, condition: 'START', result: true, x: 10, y: 80, isStart: true },
      { id: 1, condition: 'score === 100', result: true, x: 30, y: 60 },
      { id: 2, condition: 'score === 50', result: false, x: 30, y: 90, isTrap: true },
      { id: 3, condition: 'score > 50', result: true, x: 55, y: 45 },
      { id: 4, condition: 'GOAL 🎯', result: true, x: 80, y: 25, isGoal: true },
    ],
  },
  {
    title: 'Boolean Logic',
    concept: 'Booleans are either true or false',
    variables: { isActive: true, isPaused: false },
    hint: 'isActive is true, isPaused is false. Jump accordingly!',
    platforms: [
      { id: 0, condition: 'START', result: true, x: 10, y: 75, isStart: true },
      { id: 1, condition: 'isActive', result: true, x: 30, y: 55 },
      { id: 2, condition: 'isPaused', result: false, x: 30, y: 85, isTrap: true },
      { id: 3, condition: '!isPaused', result: true, x: 55, y: 40 },
      { id: 4, condition: 'GOAL 🎯', result: true, x: 80, y: 20, isGoal: true },
    ],
  },
  {
    title: 'AND Logic',
    concept: '&& (AND) requires BOTH conditions to be true',
    variables: { a: 5, b: 10 },
    hint: 'a=5, b=10. For &&, BOTH sides must be true.',
    platforms: [
      { id: 0, condition: 'START', result: true, x: 8, y: 80, isStart: true },
      { id: 1, condition: 'a > 0 && b > 0', result: true, x: 30, y: 60 },
      { id: 2, condition: 'a > 10 && b > 0', result: false, x: 30, y: 90, isTrap: true },
      { id: 3, condition: 'a < 10 && b < 20', result: true, x: 55, y: 40 },
      { id: 4, condition: 'GOAL 🎯', result: true, x: 80, y: 20, isGoal: true },
    ],
  },
  {
    title: 'OR Logic',
    concept: '|| (OR) requires at least ONE condition to be true',
    variables: { health: 0, shield: 50 },
    hint: 'health=0, shield=50. For ||, only ONE side needs to be true.',
    platforms: [
      { id: 0, condition: 'START', result: true, x: 8, y: 80, isStart: true },
      { id: 1, condition: 'health > 0 || shield > 0', result: true, x: 32, y: 60 },
      { id: 2, condition: 'health > 0 && shield > 0', result: false, x: 32, y: 90, isTrap: true },
      { id: 3, condition: 'shield >= 50', result: true, x: 58, y: 40 },
      { id: 4, condition: 'GOAL 🎯', result: true, x: 82, y: 20, isGoal: true },
    ],
  },
  {
    title: 'String Comparison',
    concept: 'Strings can be compared with === too',
    variables: { status: 'active', mode: 'dark' },
    hint: 'status="active", mode="dark". Compare strings exactly.',
    platforms: [
      { id: 0, condition: 'START', result: true, x: 8, y: 80, isStart: true },
      { id: 1, condition: 'status === "active"', result: true, x: 28, y: 55 },
      { id: 2, condition: 'status === "inactive"', result: false, x: 50, y: 80, isTrap: true },
      { id: 3, condition: 'mode === "dark"', result: true, x: 50, y: 35 },
      { id: 4, condition: 'GOAL 🎯', result: true, x: 78, y: 15, isGoal: true },
    ],
  },
  {
    title: 'NOT Operator',
    concept: '! (NOT) flips true to false and false to true',
    variables: { isLocked: false, hasKey: true },
    hint: '!false becomes true. !true becomes false.',
    platforms: [
      { id: 0, condition: 'START', result: true, x: 8, y: 80, isStart: true },
      { id: 1, condition: '!isLocked', result: true, x: 25, y: 58 },
      { id: 2, condition: 'isLocked', result: false, x: 45, y: 80, isTrap: true },
      { id: 3, condition: 'hasKey && !isLocked', result: true, x: 45, y: 38 },
      { id: 4, condition: '!hasKey', result: false, x: 68, y: 60, isTrap: true },
      { id: 5, condition: 'GOAL 🎯', result: true, x: 78, y: 18, isGoal: true },
    ],
  },
  {
    title: 'Complex Path',
    concept: 'Combine multiple operators for complex logic',
    variables: { level: 5, coins: 100, lives: 3 },
    hint: 'Think step by step. Evaluate each condition carefully.',
    platforms: [
      { id: 0, condition: 'START', result: true, x: 5, y: 85, isStart: true },
      { id: 1, condition: 'level >= 5', result: true, x: 22, y: 65 },
      { id: 2, condition: 'level < 3', result: false, x: 22, y: 90, isTrap: true },
      { id: 3, condition: 'coins >= 100 && lives > 0', result: true, x: 42, y: 45 },
      { id: 4, condition: 'coins < 50 || lives === 0', result: false, x: 42, y: 75, isTrap: true },
      { id: 5, condition: 'level === 5 && coins === 100', result: true, x: 65, y: 28 },
      { id: 6, condition: 'GOAL 🎯', result: true, x: 88, y: 12, isGoal: true },
    ],
  },
];

// Build levels: after each select level, add a type-in level with same layout
const levels: Level[] = [];
let levelId = 1;
selectLevels.forEach((sl) => {
  levels.push({
    id: levelId++,
    mode: 'select',
    title: sl.title,
    concept: sl.concept,
    variables: sl.variables,
    platforms: sl.platforms,
    hint: sl.hint,
  });
  levels.push({
    id: levelId++,
    mode: 'type',
    title: `${sl.title} — Type it!`,
    concept: sl.concept,
    variables: sl.variables,
    platforms: sl.platforms,
    hint: 'Type a condition that is TRUE to leap to the next platform (e.g. x > 5).',
  });
});

/** Safely evaluate a logic expression with given variables. Returns { ok: true, value } or { ok: false, error }. */
function safeEval(
  expr: string,
  variables: Record<string, number | boolean | string>
): { ok: true; value: boolean } | { ok: false; error: string } {
  const trimmed = expr.trim();
  if (!trimmed) return { ok: false, error: 'Type a condition (e.g. x > 5)' };
  // Only allow expected chars: names, numbers, spaces, " ', operators ( ) ! = < > & | - +
  const safeRegex = /^[\w\s"'.()!=<>|&+-]+$/;
  if (!safeRegex.test(trimmed)) {
    return { ok: false, error: 'Only use variables, numbers, and operators (e.g. >, ===, &&)' };
  }
  try {
    const keys = Object.keys(variables);
    const values = Object.values(variables);
    const fn = new Function(...keys, `"use strict"; return Boolean(${trimmed});`);
    const result = fn(...values);
    return { ok: true, value: !!result };
  } catch {
    return { ok: false, error: 'Invalid expression. Check spelling and try again.' };
  }
}

/** Get the correct path (platform ids) from START to GOAL — only non-trap platforms in order. */
function getCorrectPath(platforms: Platform[]): number[] {
  const start = platforms.find(p => p.isStart);
  const goal = platforms.find(p => p.isGoal);
  if (!start || !goal) return [];
  const safe = platforms.filter(p => !p.isTrap);
  const sorted = [...safe].sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
  const order = sorted.map(p => p.id);
  const startIdx = order.indexOf(start.id);
  const goalIdx = order.indexOf(goal.id);
  if (startIdx === -1 || goalIdx === -1 || startIdx > goalIdx) return [start.id, goal.id];
  return order.slice(startIdx, goalIdx + 1);
}

export default function LogicLeapGame() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [visitedPlatforms, setVisitedPlatforms] = useState<number[]>([0]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [showConfetti, setShowConfetti] = useState(false);
  const [jumpAnimation, setJumpAnimation] = useState(false);
  const [typeInput, setTypeInput] = useState('');
  const [typeError, setTypeError] = useState('');

  const level = levels[currentLevelIndex];
  if (!level) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center text-white">
          <p className="mb-4">No level loaded.</p>
          <button
            onClick={() => router.push('/games/programming')}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white"
          >
            ← Back to Programming
          </button>
        </div>
      </main>
    );
  }
  const currentPlatform = level.platforms.find(p => p.id === playerPosition);
  const isTypeLevel = level.mode === 'type';
  const correctPath = useMemo(() => getCorrectPath(level.platforms), [level.platforms]);
  const pathIndex = correctPath.indexOf(playerPosition);
  const nextCorrectPlatformId = pathIndex >= 0 && pathIndex < correctPath.length - 1 ? correctPath[pathIndex + 1] : null;
  const trapPlatform = level.platforms.find(p => p.isTrap);

  useEffect(() => {
    setPlayerPosition(0);
    setVisitedPlatforms([0]);
    setGameState('playing');
    setTypeInput('');
    setTypeError('');
  }, [currentLevelIndex]);

  const jumpToPlatform = useCallback((platformId: number) => {
    if (gameState !== 'playing') return;
    
    const targetPlatform = level.platforms.find(p => p.id === platformId);
    if (!targetPlatform || visitedPlatforms.includes(platformId)) return;

    setJumpAnimation(true);
    setTimeout(() => {
      setJumpAnimation(false);
      setPlayerPosition(platformId);
      setVisitedPlatforms(prev => [...prev, platformId]);

      if (targetPlatform.isTrap) {
        setGameState('lost');
        recordAnswer(false);
      } else if (targetPlatform.isGoal) {
        setGameState('won');
        setShowConfetti(true);
        addStars(2);
        recordAnswer(true);
        incrementGamesPlayed();
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }, 300);
  }, [gameState, level.platforms, visitedPlatforms, addStars, recordAnswer, incrementGamesPlayed]);

  const submitTypeLeap = () => {
    setTypeError('');
    const result = safeEval(typeInput, level.variables);
    if (!result.ok) {
      setTypeError(result.error);
      return;
    }
    setJumpAnimation(true);
    setTimeout(() => {
      setJumpAnimation(false);
      if (result.value) {
        if (nextCorrectPlatformId == null) return;
        const target = level.platforms.find(p => p.id === nextCorrectPlatformId);
        if (!target) return;
        setPlayerPosition(nextCorrectPlatformId);
        setVisitedPlatforms(prev => [...prev, nextCorrectPlatformId]);
        setTypeInput('');
        if (target.isGoal) {
          setGameState('won');
          setShowConfetti(true);
          addStars(2);
          recordAnswer(true);
          incrementGamesPlayed();
          setTimeout(() => setShowConfetti(false), 3000);
        }
      } else {
        if (trapPlatform) {
          setPlayerPosition(trapPlatform.id);
          setVisitedPlatforms(prev => [...prev, trapPlatform.id]);
        }
        setGameState('lost');
        recordAnswer(false);
      }
    }, 300);
  };

  const resetLevel = () => {
    setPlayerPosition(0);
    setVisitedPlatforms([0]);
    setGameState('playing');
    setTypeInput('');
    setTypeError('');
  };

  const nextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
    } else {
      router.push('/games/programming');
    }
  };

  const getPlatformStyle = (platform: Platform) => {
    const isVisited = visitedPlatforms.includes(platform.id);
    const isCurrent = playerPosition === platform.id;
    
    if (platform.isGoal) return 'bg-gradient-to-r from-emerald-600 to-green-500 border-emerald-400';
    if (platform.isStart) return 'bg-gradient-to-r from-blue-600 to-cyan-500 border-blue-400';
    if (platform.isTrap) return isVisited ? 'bg-gradient-to-r from-red-700 to-red-600 border-red-500' : 'bg-gradient-to-r from-slate-700 to-slate-600 border-slate-500';
    if (isCurrent) return 'bg-gradient-to-r from-purple-600 to-pink-500 border-purple-400';
    if (isVisited) return 'bg-gradient-to-r from-green-700 to-emerald-600 border-green-500';
    if (platform.result) return 'bg-gradient-to-r from-slate-700 to-slate-600 border-cyan-500/50 hover:border-cyan-400';
    return 'bg-gradient-to-r from-slate-800 to-slate-700 border-red-500/50 hover:border-red-400';
  };

  return (
    <main className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-4 md:p-6 relative overflow-hidden">
      <Confetti show={showConfetti} />

      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <header className="max-w-5xl mx-auto mb-4 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <motion.button
            onClick={() => router.push('/games/programming')}
            className="px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all text-sm min-h-[44px] touch-target"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Back
          </motion.button>
          <div className="flex gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
              <span className="text-slate-400 text-sm">Level </span>
              <span className="text-white font-mono font-bold">{currentLevelIndex + 1}/{levels.length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Title */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-1 font-mono">
            <span className="text-cyan-400">{'>'}</span>
            <span className="text-white"> Logic</span>
            <span className="text-emerald-400">Leap</span>
            <span className="text-cyan-400">_</span>
          </h1>
          <p className="text-slate-500 text-sm font-mono">// Navigate by evaluating conditions</p>
        </motion.div>

        {/* Level Info */}
        <motion.div
          className="bg-slate-900/80 border border-slate-700 rounded-lg p-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white font-mono">{level.title}</h2>
              <p className="text-cyan-400 text-sm mt-1">{level.concept}</p>
            </div>
            <div className="bg-slate-800 rounded-lg px-4 py-2 font-mono text-sm">
              <span className="text-slate-500">// Variables:</span>
              <div className="text-emerald-400">
                {Object.entries(level.variables).map(([key, value]) => (
                  <div key={key}>
                    {key} = <span className="text-amber-400">
                      {typeof value === 'string' ? `"${value}"` : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Type-in panel (type levels only) */}
        {isTypeLevel && gameState === 'playing' && (
          <motion.div
            className="bg-slate-800/80 border border-cyan-500/50 rounded-xl p-4 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-cyan-400 font-mono text-sm mb-2">
              Type a condition that is <span className="text-emerald-400 font-bold">TRUE</span> to make the frog leap →
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={typeInput}
                onChange={(e) => { setTypeInput(e.target.value); setTypeError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && submitTypeLeap()}
                placeholder="e.g. x > 5 or score === 100"
                className="flex-1 min-w-[200px] px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                aria-label="Type condition"
              />
              <motion.button
                onClick={submitTypeLeap}
                disabled={!typeInput.trim()}
                className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-mono font-bold rounded-lg"
                whileHover={typeInput.trim() ? { scale: 1.03 } : {}}
                whileTap={typeInput.trim() ? { scale: 0.98 } : {}}
              >
                Leap! 🐸
              </motion.button>
            </div>
            {typeError && (
              <div className="mt-2 text-red-400 font-mono text-sm">{typeError}</div>
            )}
          </motion.div>
        )}

        {/* Game Board */}
        <motion.div
          className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-4 relative"
          style={{ minHeight: '400px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Platforms */}
          {level.platforms.map((platform) => {
            const isCurrent = playerPosition === platform.id;
            const isVisited = visitedPlatforms.includes(platform.id);
            const canJump = !isTypeLevel && gameState === 'playing' && !isVisited && !platform.isStart;
            
            return (
              <motion.button
                key={platform.id}
                className={`absolute px-3 py-2 rounded-lg border-2 font-mono text-xs md:text-sm transition-all ${getPlatformStyle(platform)} ${canJump ? 'cursor-pointer' : 'cursor-default'}`}
                style={{
                  left: `${platform.x}%`,
                  top: `${platform.y}%`,
                  transform: 'translate(-50%, -50%)',
                  minWidth: '80px',
                }}
                onClick={() => canJump && jumpToPlatform(platform.id)}
                whileHover={canJump ? { scale: 1.05, y: -2 } : {}}
                whileTap={canJump ? { scale: 0.95 } : {}}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: isCurrent ? 1.1 : 1,
                  y: isCurrent && jumpAnimation ? -20 : 0,
                }}
                transition={{ delay: platform.id * 0.1 }}
              >
                <div className="text-white whitespace-nowrap">{platform.condition}</div>
                {!platform.isStart && !platform.isGoal && isVisited && (
                  <div className={`text-xs mt-1 ${platform.isTrap ? 'text-red-300' : 'text-green-300'}`}>
                    {platform.isTrap ? '✗ false' : '✓ true'}
                  </div>
                )}
              </motion.button>
            );
          })}

          {/* Player */}
          {currentPlatform && (
            <motion.div
              className="absolute text-3xl z-20 pointer-events-none"
              style={{
                left: `${currentPlatform.x}%`,
                top: `${currentPlatform.y}%`,
              }}
              animate={{
                x: '-50%',
                y: jumpAnimation ? '-150%' : '-120%',
              }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                🐸
              </motion.div>
            </motion.div>
          )}

          {/* Connection lines hint */}
          <div className="absolute bottom-2 right-2 text-xs text-slate-600 font-mono">
            {isTypeLevel ? 'Type a TRUE condition above to leap' : 'Click TRUE platforms to reach the goal'}
          </div>
        </motion.div>

        {/* Hint */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 mb-4">
          <span className="text-amber-500 font-mono text-sm">💡 Hint: </span>
          <span className="text-slate-400 text-sm">{level.hint}</span>
        </div>

        {/* Result */}
        <AnimatePresence>
          {gameState !== 'playing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`rounded-xl p-6 text-center mb-4 ${
                gameState === 'won' 
                  ? 'bg-emerald-500/20 border border-emerald-500/50' 
                  : 'bg-red-500/20 border border-red-500/50'
              }`}
            >
              {gameState === 'won' ? (
                <>
                  <div className="text-4xl mb-2">🎉</div>
                  <div className="text-emerald-400 font-bold text-xl font-mono">SUCCESS!</div>
                  <div className="text-emerald-300 text-sm mt-1">You evaluated all conditions correctly.</div>
                  <div className="text-amber-400 mt-2 font-mono">+2 ⭐</div>
                  <motion.button
                    onClick={nextLevel}
                    className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg font-mono"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {currentLevelIndex < levels.length - 1 ? 'NEXT LEVEL →' : 'COMPLETE! →'}
                  </motion.button>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">💥</div>
                  <div className="text-red-400 font-bold text-xl font-mono">TRAP!</div>
                  <div className="text-red-300 text-sm mt-1">That condition evaluated to FALSE.</div>
                  <motion.button
                    onClick={resetLevel}
                    className="mt-4 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg font-mono"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    TRY AGAIN
                  </motion.button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reset button when playing */}
        {gameState === 'playing' && visitedPlatforms.length > 1 && (
          <div className="text-center">
            <motion.button
              onClick={resetLevel}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-lg font-mono text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ↺ Reset Level
            </motion.button>
          </div>
        )}

        {/* Legend */}
        <motion.div
          className="mt-4 bg-slate-900/50 border border-slate-700 rounded-lg p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-slate-500 font-mono text-xs mb-2">// Legend:</div>
          <div className="flex flex-wrap gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-600 to-cyan-500"></div>
              <span className="text-slate-400">START</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-600 to-green-500"></div>
              <span className="text-slate-400">GOAL</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-cyan-500/50 bg-slate-700"></div>
              <span className="text-cyan-400">TRUE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-red-500/50 bg-slate-800"></div>
              <span className="text-red-400">FALSE (trap)</span>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}


