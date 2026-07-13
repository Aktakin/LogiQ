'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  GameBackground,
  GroundTrack,
  RunnerSprite,
  ObstacleSprite,
  CoinSprite,
  GameCanvasFrame,
  CitySkyline,
  SKY_GRADIENTS,
  THEME_VISUALS,
} from './graphics';
import { Studio } from './studio';
import {
  DEFAULT_DESIGN,
  compileDesign,
  type GameDesign,
  type GameState,
  type PageMode,
  type GameConfig,
  type RuleWhen,
  type RuleDo,
} from './types';

interface Obstacle {
  id: number;
  x: number;
  type: 'spike' | 'fireball' | 'barrier';
  height: 'low' | 'high';
}

interface Coin {
  id: number;
  x: number;
  y: number;
}

const GROUND_Y = 0;
const JUMP_HEIGHT = 130;
const GAME_WIDTH = 800;

export default function RageRunnerGame() {
  const router = useRouter();
  const [pageMode, setPageMode] = useState<PageMode>('hub');
  const [gameState, setGameState] = useState<GameState>('menu');
  const [design, setDesign] = useState<GameDesign>(DEFAULT_DESIGN);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(8);
  const [playerY, setPlayerY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isDucking, setIsDucking] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [coinItems, setCoinItems] = useState<Coin[]>([]);
  const [rageMode, setRageMode] = useState(false);
  const [rageMeter, setRageMeter] = useState(0);
  const [screenShake, setScreenShake] = useState(false);
  const [isCustomGame, setIsCustomGame] = useState(false);
  const [combo, setCombo] = useState(0);

  const gameLoopRef = useRef<number>();
  const lastObstacleRef = useRef(0);
  const lastCoinRef = useRef(0);
  const obstacleIdRef = useRef(0);
  const jumpRef = useRef<() => void>(() => {});
  const duckRef = useRef<(active: boolean) => void>(() => {});
  const activateRageRef = useRef<() => void>(() => {});
  const lastAiActionRef = useRef(0);
  const jumpAnimRef = useRef<number>();

  const config = useMemo(() => compileDesign(design), [design]);
  const themeKey = config.theme;

  useEffect(() => {
    const savedScore = localStorage.getItem('rageRunnerHighScore');
    if (savedScore) setHighScore(parseInt(savedScore));
    const saved = localStorage.getItem('rageRunnerDesign');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.rules) {
          setDesign({ ...DEFAULT_DESIGN, ...parsed });
        } else {
          // Migrate legacy IF/ELSE + WHEN blocks format
          const rules = [
            ...(parsed.ifElseBlocks || []).flatMap((b: { condition?: string; ifAction?: string; elseAction?: string }) => {
              const out: typeof DEFAULT_DESIGN.rules = [];
              if (b.condition === 'obstacle_low' && b.ifAction === 'jump') out.push({ id: 'm1', when: 'obstacle_low', do: 'jump' });
              if (b.condition === 'obstacle_high' && b.ifAction === 'duck') out.push({ id: 'm2', when: 'obstacle_high', do: 'duck' });
              return out;
            }),
            ...(parsed.blocks || []).map((b: { type?: string; action?: string }, i: number) => ({
              id: `m-${i}`,
              when: b.type === 'WHEN_OBSTACLE_LOW' ? 'obstacle_low' as const
                : b.type === 'WHEN_OBSTACLE_HIGH' ? 'obstacle_high' as const
                : b.type === 'WHEN_COIN' ? 'coin_nearby' as const
                : 'rage_ready' as const,
              do: (b.action === 'jump' ? 'jump' : b.action === 'duck' ? 'duck' : b.action === 'rage' ? 'rage' : 'collect') as const,
            })),
          ];
          setDesign({
            ...DEFAULT_DESIGN,
            character: parsed.character || DEFAULT_DESIGN.character,
            environment: parsed.environment || DEFAULT_DESIGN.environment,
            rules: rules.length ? rules : DEFAULT_DESIGN.rules,
          });
        }
      } catch {
        /* defaults */
      }
    }
  }, []);

  const saveDesign = () => localStorage.setItem('rageRunnerDesign', JSON.stringify(design));

  const startGame = useCallback(
    (custom = false) => {
      const cfg = compileDesign(design);
      setIsCustomGame(custom);
      setGameState('playing');
      setScore(0);
      setCoins(0);
      setCombo(0);
      setDistance(0);
      setSpeed(cfg.startSpeed);
      setPlayerY(GROUND_Y);
      setIsJumping(false);
      setIsDucking(false);
      setObstacles([]);
      setCoinItems([]);
      setRageMode(false);
      setRageMeter(0);
      lastObstacleRef.current = 0;
      lastCoinRef.current = 0;
      obstacleIdRef.current = 0;
      lastAiActionRef.current = 0;
    },
    [design]
  );

  const jump = useCallback(() => {
    if (!isJumping && !isDucking && gameState === 'playing') {
      setIsJumping(true);
      const start = performance.now();
      const duration = 420;

      const animate = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = Math.sin(t * Math.PI);
        setPlayerY(JUMP_HEIGHT * ease);
        if (t < 1) jumpAnimRef.current = requestAnimationFrame(animate);
        else {
          setPlayerY(GROUND_Y);
          setIsJumping(false);
        }
      };
      if (jumpAnimRef.current) cancelAnimationFrame(jumpAnimRef.current);
      jumpAnimRef.current = requestAnimationFrame(animate);
    }
  }, [isJumping, isDucking, gameState]);

  const duck = useCallback(
    (active: boolean) => {
      if (!isJumping && gameState === 'playing') setIsDucking(active);
    },
    [isJumping, gameState]
  );

  const activateRageMode = useCallback(() => {
    if (!config.rageEnabled || rageMeter < 100 || rageMode) return;
    setRageMode(true);
    setRageMeter(0);
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
    setTimeout(() => setRageMode(false), 5000);
  }, [rageMeter, rageMode, config.rageEnabled]);

  jumpRef.current = jump;
  duckRef.current = duck;
  activateRageRef.current = activateRageMode;

  useEffect(() => {
    if (pageMode === 'hub' || gameState !== 'playing') return;
    const auto = isCustomGame && design.rules.length > 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (auto) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jumpRef.current();
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        duckRef.current(true);
      }
      if (e.code === 'KeyR') activateRageRef.current();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') duckRef.current(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [pageMode, gameState, isCustomGame, design.rules.length]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const cfg = compileDesign(design);

    const loop = () => {
      setDistance((d) => {
        const nd = d + speed / 10;
        if (nd - lastObstacleRef.current > cfg.obstacleGapMin + Math.random() * (cfg.obstacleGapMax - cfg.obstacleGapMin)) {
          lastObstacleRef.current = nd;
          const types: Obstacle['type'][] = ['spike', 'fireball', 'barrier'];
          setObstacles((prev) => [
            ...prev,
            {
              id: obstacleIdRef.current++,
              x: GAME_WIDTH + 50,
              type: types[Math.floor(Math.random() * types.length)],
              height: Math.random() > 0.5 ? 'low' : 'high',
            },
          ]);
        }
        if (cfg.coinGapMin < 9000 && nd - lastCoinRef.current > cfg.coinGapMin + Math.random() * (cfg.coinGapMax - cfg.coinGapMin)) {
          lastCoinRef.current = nd;
          setCoinItems((prev) => [
            ...prev,
            { id: obstacleIdRef.current++, x: GAME_WIDTH + 50, y: Math.random() > 0.5 ? 60 : 20 },
          ]);
        }
        return nd;
      });
      setObstacles((prev) => prev.map((o) => ({ ...o, x: o.x - speed })).filter((o) => o.x > -100));
      setCoinItems((prev) => prev.map((c) => ({ ...c, x: c.x - speed })).filter((c) => c.x > -50));
      setScore((s) => s + 1);
      setSpeed((s) => Math.min(s + 0.0015, cfg.maxSpeed));
      if (cfg.rageEnabled && !rageMode) setRageMeter((r) => Math.min(r + 0.08, 100));
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, speed, rageMode, design]);

  const checkCondition = (when: RuleWhen, playerLeft: number, playerRight: number): boolean => {
    switch (when) {
      case 'obstacle_low':
        return obstacles.some((o) => o.height === 'low' && o.x > playerLeft && o.x < playerRight + 100);
      case 'obstacle_high':
        return obstacles.some((o) => o.height === 'high' && o.x > playerLeft && o.x < playerRight + 100);
      case 'coin_nearby':
        return coinItems.some((c) => c.x > playerLeft - 20 && c.x < playerRight + 80);
      case 'rage_ready':
        return rageMeter >= 100;
    }
  };

  const runAction = (action: RuleDo) => {
    switch (action) {
      case 'jump':
        jumpRef.current();
        break;
      case 'duck':
        duckRef.current(true);
        setTimeout(() => duckRef.current(false), 450);
        break;
      case 'collect':
        break;
      case 'rage':
        activateRageRef.current();
        break;
    }
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    const playerLeft = 100;
    const playerRight = 150;
    const playerBottom = playerY;
    const playerTop = playerY + (isDucking ? 28 : 58);

    if (isCustomGame && design.rules.length > 0 && Date.now() - lastAiActionRef.current > 300) {
      for (const rule of design.rules) {
        if (checkCondition(rule.when, playerLeft, playerRight)) {
          runAction(rule.do);
          lastAiActionRef.current = Date.now();
          break;
        }
      }
    }

    for (const obs of obstacles) {
      if (obs.x > playerLeft - 40 && obs.x < playerRight) {
        const obsBottom = obs.height === 'low' ? 0 : 40;
        const obsTop = obs.height === 'low' ? 50 : 100;
        if (playerBottom < obsTop && playerTop > obsBottom) {
          if (rageMode) {
            setObstacles((prev) => prev.filter((o) => o.id !== obs.id));
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 100);
            setScore((s) => s + 50);
            setCombo((c) => c + 1);
          } else {
            setGameState('gameover');
            if (score > highScore) {
              setHighScore(score);
              localStorage.setItem('rageRunnerHighScore', score.toString());
            }
          }
        }
      }
    }

    for (const coin of coinItems) {
      if (coin.x > playerLeft - 30 && coin.x < playerRight && Math.abs(coin.y - playerY - 30) < 40) {
        setCoinItems((prev) => prev.filter((c) => c.id !== coin.id));
        setCoins((c) => c + 1);
        setScore((s) => s + 10);
        setCombo((c) => c + 1);
      }
    }
  }, [obstacles, coinItems, playerY, isDucking, gameState, rageMode, score, highScore, design, isCustomGame, rageMeter]);

  const useCustomAssets = isCustomGame || pageMode === 'create';

  const renderGameCanvas = (compact = false) => (
    <GameCanvasFrame theme={themeKey} rageMode={rageMode} compact={compact}>
      <div
        className="absolute inset-0"
        onClick={() => {
          if (gameState === 'menu' || gameState === 'gameover') startGame(isCustomGame);
          else if (!isCustomGame || design.rules.length === 0) jump();
        }}
      >
        {useCustomAssets ? (
          <>
            <div className="absolute inset-0" style={{ background: SKY_GRADIENTS[design.environment.sky] }} />
            <CitySkyline environment={design.environment} scrollOffset={distance} compact={compact} />
          </>
        ) : (
          <GameBackground theme={themeKey} scrollOffset={distance} compact={compact} />
        )}
        <GroundTrack theme={themeKey} scrollOffset={distance} />

        {/* Speed lines */}
        {gameState === 'playing' && speed > 10 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            {[...Array(compact ? 4 : 8)].map((_, i) => (
              <div
                key={i}
                className="absolute h-px bg-white"
                style={{
                  top: `${20 + i * 12}%`,
                  left: 0,
                  right: 0,
                  transform: `translateX(-${(distance * 2) % 200}px)`,
                  width: '40%',
                }}
              />
            ))}
          </div>
        )}

        <motion.div className="absolute left-24 z-10" style={{ bottom: 20 + playerY }}>
          <RunnerSprite
            isJumping={isJumping}
            isDucking={isDucking}
            rageMode={rageMode}
            hasShield={false}
            isAuto={useCustomAssets && design.rules.length > 0}
            character={useCustomAssets ? design.character : DEFAULT_DESIGN.character}
          />
        </motion.div>

        <AnimatePresence>
          {obstacles.map((obs) => (
            <motion.div
              key={obs.id}
              className="absolute z-10"
              style={{ left: obs.x, bottom: obs.height === 'low' ? 20 : 60 }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.4 }}
            >
              <ObstacleSprite type={obs.type} height={obs.height} />
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {coinItems.map((coin) => (
            <motion.div key={coin.id} className="absolute z-10" style={{ left: coin.x, bottom: 20 + coin.y }} exit={{ scale: 2, opacity: 0 }}>
              <CoinSprite />
            </motion.div>
          ))}
        </AnimatePresence>

        {gameState === 'menu' && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 text-center"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
          >
            <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
              {useCustomAssets ? design.character.name : 'RAGE RUNNER'}
            </h2>
            <p className="text-gray-400 text-xs mb-5">
              {useCustomAssets && design.rules.length > 0 ? `${design.rules.length} rules active` : 'Space to jump · ↓ to duck'}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); startGame(isCustomGame); }}
              className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold"
              style={{ background: THEME_VISUALS[themeKey].accent }}
            >
              Start
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>
            <p className="text-red-400 text-sm font-semibold uppercase tracking-widest mb-2">Game Over</p>
            <p className="text-4xl font-bold text-white tabular-nums">{score}</p>
            {score >= highScore && score > 0 && <p className="text-green-400 text-xs mt-1">New record!</p>}
            <button
              onClick={(e) => { e.stopPropagation(); startGame(isCustomGame); }}
              className="mt-4 px-6 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ background: THEME_VISUALS[themeKey].accent }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </GameCanvasFrame>
  );

  /* ── Hub ── */
  if (pageMode === 'hub') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0c0e14' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-2">Rage Runner</h1>
          <p className="text-gray-500 text-sm mb-10">Endless runner · Block studio · Your rules</p>
          <div className="grid gap-3">
            <button
              onClick={() => { setPageMode('play'); setIsCustomGame(false); setGameState('menu'); }}
              className="w-full py-4 rounded-xl text-white font-semibold text-left px-5"
              style={{ background: '#13161f', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="text-lg">Play</span>
              <span className="block text-xs text-gray-500 mt-0.5">Classic mode</span>
            </button>
            <button
              onClick={() => setPageMode('create')}
              className="w-full py-4 rounded-xl text-white font-semibold text-left px-5"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              <span className="text-lg">Studio</span>
              <span className="block text-xs text-gray-500 mt-0.5">Build character, code & world</span>
            </button>
          </div>
          <p className="text-gray-600 text-xs mt-6">Best: {highScore}</p>
        </motion.div>
        <button onClick={() => router.push('/sections/game-dev')} className="absolute top-4 left-4 text-sm text-gray-500 hover:text-white">
          ← Back
        </button>
      </main>
    );
  }

  /* ── Studio ── */
  if (pageMode === 'create') {
    return (
      <>
        <Studio
          design={design}
          onChange={setDesign}
          onBack={() => setPageMode('hub')}
          onTest={() => { saveDesign(); setIsCustomGame(true); startGame(true); }}
          onSave={saveDesign}
          renderPreview={renderGameCanvas}
        />
        <AnimatePresence>
          {(gameState === 'playing' || gameState === 'gameover') && isCustomGame && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col p-4"
              style={{ background: '#0c0e14' }}
            >
              <div className="flex items-center justify-between mb-3 max-w-4xl mx-auto w-full">
                <button onClick={() => setGameState('menu')} className="text-sm text-gray-400 hover:text-white">← Studio</button>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white tabular-nums">{score}</div>
                  {combo > 2 && <div className="text-xs text-orange-400">{combo}x combo</div>}
                </div>
                <div className="text-yellow-400 text-sm font-medium">{coins} coins</div>
              </div>
              <div className="flex-1 max-w-4xl mx-auto w-full">{renderGameCanvas()}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  /* ── Play mode ── */
  return (
    <main className="min-h-screen p-4" style={{ background: '#0c0e14' }}>
      <header className="flex items-center justify-between mb-4 max-w-4xl mx-auto">
        <button onClick={() => { setPageMode('hub'); setGameState('menu'); }} className="text-sm text-gray-500 hover:text-white">← Hub</button>
        <div className="flex gap-3 text-sm">
          <span className="text-yellow-400">{coins} coins</span>
          <span className="text-gray-400">Best {highScore}</span>
        </div>
      </header>

      <motion.div className="max-w-4xl mx-auto" animate={screenShake ? { x: [-4, 4, -4, 4, 0] } : {}}>
        {gameState === 'playing' && (
          <div className="text-center mb-4">
            <div className={`text-5xl font-bold tabular-nums ${rageMode ? 'text-red-400' : 'text-white'}`}>{score}</div>
            <div className="text-gray-500 text-xs mt-1">{speed.toFixed(1)}x speed</div>
            {config.rageEnabled && (
              <div className="max-w-xs mx-auto mt-3">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${rageMode ? 100 : rageMeter}%`, background: rageMode ? '#ef4444' : 'linear-gradient(90deg,#dc2626,#f97316)' }} />
                </div>
              </div>
            )}
          </div>
        )}
        {renderGameCanvas()}
        {gameState === 'playing' && (
          <div className="mt-4 flex justify-center gap-3 sm:hidden">
            <button onTouchStart={() => jump()} className="w-16 h-16 rounded-xl text-2xl" style={{ background: '#13161f', border: '1px solid rgba(255,255,255,0.1)' }}>↑</button>
            <button onTouchStart={() => duck(true)} onTouchEnd={() => duck(false)} className="w-16 h-16 rounded-xl text-2xl" style={{ background: '#13161f', border: '1px solid rgba(255,255,255,0.1)' }}>↓</button>
          </div>
        )}
      </motion.div>
    </main>
  );
}
