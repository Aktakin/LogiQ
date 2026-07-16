'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type {
  CityObject,
  EnemyObject,
  HeroMethods,
  HeroObject,
  PlayKind,
} from '@/lib/objectLockerLevels';

const TARGETS = 5;

type Shot = { id: number; x: number; y: number; dir: number };
type Target = { id: number; x: number; y: number };

const powerEmoji: Record<string, string> = {
  lightning: '⚡',
  shield: '🛡️',
  blast: '💥',
  heal: '✨',
  spark: '✨',
};

export default function MethodsArena({
  kind,
  hero,
  city,
  enemy,
  methods,
  onWin,
}: {
  kind: PlayKind;
  hero: HeroObject;
  city: CityObject;
  enemy: EnemyObject;
  methods: HeroMethods;
  onWin: () => void;
}) {
  const [x, setX] = useState(20);
  const [y, setY] = useState(0);
  const [dir, setDir] = useState(1);
  const [scale, setScale] = useState(1);
  const [shots, setShots] = useState<Shot[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [hits, setHits] = useState(0);
  const [enemyX, setEnemyX] = useState(75);
  const [enemyHp, setEnemyHp] = useState(enemy.hp);
  const [msg, setMsg] = useState(
    kind === 'shootPractice'
      ? 'Call shoot — hit 5 targets!'
      : kind === 'heroCombo'
        ? 'Use shoot, superJump & grow — 5 orbs!'
        : `Defeat ${enemy.name}!`
  );
  const [fx, setFx] = useState<string | null>(null);

  const wonRef = useRef(false);
  const keys = useRef({ left: false, right: false });
  const pos = useRef({ x: 20, y: 0, dir: 1, scale: 1 });
  const shotsRef = useRef<Shot[]>([]);
  const targetsRef = useRef<Target[]>([]);
  const hitsRef = useRef(0);
  const enemyRef = useRef({ x: 75, hp: enemy.hp, dir: -1 });
  const onWinRef = useRef(onWin);
  onWinRef.current = onWin;

  const emoji = powerEmoji[hero.power.toLowerCase()] || '✨';
  const moveSpeed = 1.2 + hero.speed * 0.3;
  const enemySpeed = 0.4 + enemy.speed * 0.15;
  const canShoot = methods.shoot || kind === 'shootPractice';
  const canSuper = methods.superJump || kind === 'heroCombo' || kind === 'arena';
  const canGrow = methods.grow || kind === 'heroCombo' || kind === 'arena';

  const tryWin = (score: number, need: number) => {
    if (score >= need && !wonRef.current) {
      wonRef.current = true;
      setMsg(kind === 'arena' ? `${enemy.name} defeated!` : 'Methods mastered!');
      onWinRef.current();
    }
  };

  useEffect(() => {
    const next: Target[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 18 + Math.random() * 64,
      y: 16 + Math.random() * 48,
    }));
    targetsRef.current = next;
    setTargets(next);
    hitsRef.current = 0;
    setHits(0);
    wonRef.current = false;
    enemyRef.current = { x: 75, hp: enemy.hp, dir: -1 };
    setEnemyX(75);
    setEnemyHp(enemy.hp);
    pos.current = { x: 20, y: 0, dir: 1, scale: 1 };
    setX(20);
    setY(0);
    setScale(1);
    shotsRef.current = [];
    setShots([]);
  }, [kind, hero.name, enemy.hp, enemy.name]);

  const fireShoot = () => {
    if (!canShoot) return;
    setFx('shoot');
    setTimeout(() => setFx(null), 200);
    const id = Date.now() + Math.random();
    const shot: Shot = {
      id,
      x: pos.current.x + pos.current.dir * 4,
      y: 78 - pos.current.y * 0.35,
      dir: pos.current.dir,
    };
    shotsRef.current = [...shotsRef.current, shot];
    setShots(shotsRef.current);
  };

  const doSuperJump = () => {
    if (!canSuper) {
      pos.current.y = 55;
      setY(55);
      return;
    }
    pos.current.y = 130;
    setY(130);
    setFx('jump');
    setTimeout(() => setFx(null), 300);
  };

  const doGrow = () => {
    if (!canGrow) return;
    const next = Math.min(2.2, pos.current.scale + 0.35);
    pos.current.scale = next;
    setScale(next);
    setFx('grow');
    setTimeout(() => setFx(null), 300);
  };

  useEffect(() => {
    const down = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
        e.preventDefault();
        doSuperJump();
      }
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        fireShoot();
      }
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        doGrow();
      }
    };
    const up = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canShoot, canSuper, canGrow]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(32, t - last) / 16;
      last = t;
      let nx = pos.current.x;
      let ny = pos.current.y;
      if (keys.current.left) {
        nx -= moveSpeed * dt;
        pos.current.dir = -1;
        setDir(-1);
      }
      if (keys.current.right) {
        nx += moveSpeed * dt;
        pos.current.dir = 1;
        setDir(1);
      }
      nx = Math.max(4, Math.min(92, nx));
      if (ny > 0) ny = Math.max(0, ny - 2.8 * dt);
      pos.current.x = nx;
      pos.current.y = ny;
      setX(nx);
      setY(ny);

      // shots
      const shotSpeed = 2.2 + hero.strength * 0.15;
      const shotSize = 3 + pos.current.scale * 2;
      let aliveShots = shotsRef.current
        .map((s) => ({ ...s, x: s.x + s.dir * shotSpeed * dt }))
        .filter((s) => s.x > 0 && s.x < 100);

      if (kind !== 'arena') {
        const remaining: Target[] = [];
        for (const o of targetsRef.current) {
          let hit = false;
          aliveShots = aliveShots.filter((s) => {
            if (Math.hypot(s.x - o.x, s.y - o.y) < shotSize) {
              hit = true;
              return false;
            }
            return true;
          });
          // touch collect for combo
          if (
            kind === 'heroCombo' &&
            Math.hypot(o.x - nx, o.y - (78 - ny * 0.35)) < 5 + pos.current.scale * 3
          ) {
            hit = true;
          }
          if (hit) {
            hitsRef.current += 1;
            setHits(hitsRef.current);
            setMsg(`Hit! ${hitsRef.current}/${TARGETS}`);
            tryWin(hitsRef.current, TARGETS);
          } else {
            remaining.push(o);
          }
        }
        if (remaining.length !== targetsRef.current.length) {
          targetsRef.current = remaining;
          setTargets(remaining);
        }
      } else {
        // enemy chase
        const er = enemyRef.current;
        if (er.x < nx - 1) er.dir = 1;
        else if (er.x > nx + 1) er.dir = -1;
        er.x = Math.max(8, Math.min(92, er.x + er.dir * enemySpeed * dt));
        setEnemyX(er.x);

        aliveShots = aliveShots.filter((s) => {
          if (Math.abs(s.x - er.x) < shotSize + 2 && Math.abs(s.y - 72) < 18) {
            er.hp = Math.max(0, er.hp - 1);
            setEnemyHp(er.hp);
            setMsg(`${enemy.name} hp ${er.hp}`);
            if (er.hp <= 0) tryWin(1, 1);
            return false;
          }
          return true;
        });
      }

      shotsRef.current = aliveShots;
      setShots(aliveShots);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [moveSpeed, enemySpeed, hero.strength, kind, enemy.name]);

  return (
    <div className="glass rounded-2xl border border-violet-500/30 overflow-hidden mb-5">
      <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-white font-bold">
            {hero.name} · methods arena · {city.name}
          </div>
          <div className="text-slate-400 text-xs">
            {canShoot ? 'shoot ✓ ' : ''}
            {canSuper ? 'superJump ✓ ' : ''}
            {canGrow ? 'grow ✓ ' : ''}
            {kind === 'arena' ? `· vs ${enemy.name}` : '· no enemies'}
          </div>
        </div>
        <div className="font-mono text-violet-300 text-sm">
          {kind === 'arena' ? `HP ${enemyHp}` : `${hits}/${TARGETS}`}
        </div>
      </div>

      <div
        className="relative h-64 sm:h-72 outline-none overflow-hidden"
        style={{
          background: city.neon
            ? 'linear-gradient(180deg, #0f172a 0%, #4c1d95 50%, #701a75 100%)'
            : 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)',
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/35" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-white/40 font-mono">
          {city.landmark}
        </div>

        {kind !== 'arena' &&
          targets.map((o) => (
            <div
              key={o.id}
              className="absolute w-4 h-4 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.7)]"
              style={{ left: `${o.x}%`, top: `${o.y}%`, transform: 'translate(-50%, -50%)' }}
            />
          ))}

        {shots.map((s) => (
          <div
            key={s.id}
            className="absolute w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]"
            style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)' }}
          />
        ))}

        {kind === 'arena' && enemyHp > 0 && (
          <div
            className="absolute bottom-10 flex flex-col items-center"
            style={{ left: `${enemyX}%`, transform: 'translateX(-50%)' }}
          >
            <div className="text-[10px] text-red-200 bg-black/50 px-2 py-0.5 rounded mb-1">
              {enemy.name}
            </div>
            <div className="text-3xl select-none">👾</div>
          </div>
        )}

        {fx && (
          <motion.div
            initial={{ opacity: 0.8, scale: 0.5 }}
            animate={{ opacity: 0, scale: 1.8 }}
            className="absolute bottom-14 w-12 h-12 rounded-full bg-violet-400/50 blur-md"
            style={{ left: `${x}%`, marginLeft: -24 }}
          />
        )}

        <div
          className="absolute bottom-10 flex flex-col items-center"
          style={{
            left: `${x}%`,
            transform: `translate(-50%, -${y}px) scale(${scale}) scaleX(${dir})`,
          }}
        >
          <div className="text-[10px] text-white bg-black/50 px-2 py-0.5 rounded mb-1 whitespace-nowrap">
            {hero.name}
          </div>
          <div className="text-3xl leading-none select-none">{emoji}</div>
        </div>

        <div className="absolute top-3 left-3 right-3 text-center text-white/90 text-sm font-medium drop-shadow">
          {msg}
        </div>
      </div>

      <div className="p-3 flex flex-wrap items-center justify-center gap-2 bg-slate-950/50">
        <button
          type="button"
          className="glass px-4 py-2 rounded-xl text-sm text-white border border-white/15"
          onClick={() => {
            keys.current.left = true;
            setTimeout(() => {
              keys.current.left = false;
            }, 160);
          }}
        >
          ←
        </button>
        <button
          type="button"
          className="glass px-4 py-2 rounded-xl text-sm text-white border border-white/15"
          onClick={() => {
            keys.current.right = true;
            setTimeout(() => {
              keys.current.right = false;
            }, 160);
          }}
        >
          →
        </button>
        {canSuper && (
          <button
            type="button"
            onClick={doSuperJump}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600"
          >
            Super Jump
          </button>
        )}
        {canGrow && (
          <button
            type="button"
            onClick={doGrow}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600"
          >
            Grow
          </button>
        )}
        {canShoot && (
          <button
            type="button"
            onClick={fireShoot}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600"
          >
            Shoot
          </button>
        )}
      </div>
    </div>
  );
}
