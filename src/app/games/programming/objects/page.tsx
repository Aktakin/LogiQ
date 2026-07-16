'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';
import {
  OBJECT_LOCKER_SAVE_KEY,
  asCity,
  asEnemy,
  asHero,
  checkObjectAnswer,
  defaultCity,
  defaultEnemy,
  defaultHero,
  nestedHomePreview,
  objectLockerLevels,
  validateCreateAnswer,
  type CityObject,
  type EnemyObject,
  type HeroMethods,
  type HeroObject,
  type ObjectLevel,
  type ObjectLockerSave,
  type ObjectValue,
} from '@/lib/objectLockerLevels';
import MethodsArena from './MethodsArena';

const LEVEL_PASSCODE = '4311';
const ORBS_TO_WIN = 5;

const modeMeta = {
  build: { label: 'Build', color: 'text-cyan-300', border: 'border-cyan-500/40', blurb: 'Create the object' },
  access: { label: 'Read', color: 'text-amber-300', border: 'border-amber-500/40', blurb: 'Peek a value' },
  update: { label: 'Update', color: 'text-fuchsia-300', border: 'border-fuchsia-500/40', blurb: 'Change a drawer' },
  create: { label: 'Final', color: 'text-emerald-300', border: 'border-emerald-500/40', blurb: 'Design your own' },
  play: { label: 'Play', color: 'text-rose-300', border: 'border-rose-500/40', blurb: 'Character game' },
  method: { label: 'Method', color: 'text-violet-300', border: 'border-violet-500/40', blurb: 'Call or attach ()' },
  playMethods: { label: 'Arena', color: 'text-violet-300', border: 'border-violet-500/40', blurb: 'Use your methods' },
};

const powerFx: Record<string, { label: string; color: string; emoji: string }> = {
  lightning: { label: 'Lightning', color: 'bg-yellow-400', emoji: '⚡' },
  shield: { label: 'Shield', color: 'bg-sky-400', emoji: '🛡️' },
  blast: { label: 'Blast', color: 'bg-orange-500', emoji: '💥' },
  heal: { label: 'Heal', color: 'bg-emerald-400', emoji: '✨' },
  spark: { label: 'Spark', color: 'bg-violet-400', emoji: '✨' },
};

function blockClipboardKeys(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
  if (e.shiftKey && e.key === 'Insert') e.preventDefault();
}

function loadSave(): ObjectLockerSave {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OBJECT_LOCKER_SAVE_KEY);
    return raw ? (JSON.parse(raw) as ObjectLockerSave) : {};
  } catch {
    return {};
  }
}

function writeSave(next: ObjectLockerSave) {
  localStorage.setItem(OBJECT_LOCKER_SAVE_KEY, JSON.stringify(next));
}

function LockerView({
  title,
  data,
  nested,
  highlightKey,
  methodNames,
}: {
  title: string;
  data: Record<string, ObjectValue>;
  nested?: Record<string, ObjectValue> | null;
  highlightKey?: string;
  methodNames?: string[];
}) {
  const keys = Object.keys(data).filter((k) => !(nested && k === 'home'));
  const showNested = Boolean(nested);
  const methods = methodNames || [];
  return (
    <div className="glass rounded-2xl border border-white/15 p-4 h-full">
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2">
        <span className="text-lg">🗄️</span> {title}
      </div>
      {keys.length === 0 && !showNested && methods.length === 0 ? (
        <div className="text-slate-500 text-sm py-8 text-center border border-dashed border-white/10 rounded-xl">
          Empty object {'{ }'}
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <motion.div
              key={key}
              layout
              className={`rounded-xl px-3 py-2 border ${
                highlightKey === key
                  ? 'border-amber-400/60 bg-amber-500/15'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-cyan-300 text-sm">{key}</span>
                <span className="font-mono text-white text-sm break-all">{formatVal(data[key]!)}</span>
              </div>
            </motion.div>
          ))}
          {methods.map((m) => (
            <motion.div
              key={`m-${m}`}
              layout
              className="rounded-xl px-3 py-2 border border-violet-500/35 bg-violet-500/10"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-violet-300 text-sm">{m}()</span>
                <span className="font-mono text-slate-400 text-xs">method</span>
              </div>
            </motion.div>
          ))}
          {showNested && nested && (
            <motion.div layout className="rounded-xl px-3 py-2 border border-white/10 bg-white/5">
              <div className="font-mono text-cyan-300 text-sm mb-2">home</div>
              <div className="ml-2 pl-3 border-l border-fuchsia-500/40 space-y-1">
                {Object.entries(nested).map(([nk, nv]) => (
                  <div key={nk} className="flex justify-between gap-2 text-sm">
                    <span className="font-mono text-fuchsia-300">{nk}</span>
                    <span className="font-mono text-white">{formatVal(nv)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

function formatVal(v: ObjectValue) {
  if (typeof v === 'string') return `"${v}"`;
  return String(v);
}

function CreateBlueprint({ level }: { level: ObjectLevel }) {
  const fields = level.createFields || [];
  return (
    <div className="glass rounded-2xl border border-emerald-500/25 p-4 h-full">
      <div className="text-xs uppercase tracking-wide text-emerald-200/70 mb-3">Required keys</div>
      <div className="space-y-2">
        {fields.map((f) => (
          <div key={f.key} className="rounded-xl px-3 py-2 border border-white/10 bg-white/5 font-mono text-sm">
            <span className="text-cyan-300">{f.key}</span>
            <span className="text-slate-500">: </span>
            <span className="text-amber-200">
              {f.type === 'string' && f.choices
                ? f.choices.map((c) => `"${c}"`).join(' | ')
                : f.type === 'string'
                  ? 'string'
                  : f.type === 'number'
                    ? `number${f.min != null ? ` ${f.min}–${f.max}` : ''}`
                    : 'true | false'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalPanel({ level, created }: { level: ObjectLevel; created: Record<string, ObjectValue> | null }) {
  if (level.mode === 'access') {
    return (
      <div className="glass rounded-2xl border border-amber-500/25 p-4">
        <div className="text-xs uppercase tracking-wide text-amber-200/70 mb-2">Find this value</div>
        <div className="text-3xl font-mono font-bold text-amber-300 text-center py-4">
          {level.expectedValue}
        </div>
        <p className="text-slate-400 text-xs text-center">Type the expression that reads it</p>
      </div>
    );
  }
  if (level.mode === 'method') {
    return (
      <div className="glass rounded-2xl border border-violet-500/25 p-4 h-full">
        <div className="text-xs uppercase tracking-wide text-violet-200/70 mb-3">Method goal</div>
        <p className="text-slate-300 text-sm mb-3">Methods are actions — call with <span className="font-mono text-violet-300">()</span></p>
        <div className="space-y-2">
          {(level.methodNames || []).map((m) => (
            <div key={m} className="rounded-xl px-3 py-2 border border-violet-500/30 bg-violet-500/10 font-mono text-sm text-violet-200">
              .{m}()
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (level.mode === 'create') {
    return created ? (
      <LockerView title="Your creation" data={created} />
    ) : (
      <CreateBlueprint level={level} />
    );
  }
  return (
    <LockerView
      title="Goal locker"
      data={level.targetObject || {}}
      nested={level.id === 14 ? nestedHomePreview : null}
    />
  );
}

type Orb = { id: number; x: number; y: number };

function FinalCharacterGame({
  hero,
  city,
  onWin,
}: {
  hero: HeroObject;
  city: CityObject;
  onWin: () => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(40);
  const [y, setY] = useState(0);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [collected, setCollected] = useState(0);
  const [fx, setFx] = useState<string | null>(null);
  const [msg, setMsg] = useState('Collect 5 orbs!');
  const wonRef = useRef(false);
  const keys = useRef({ left: false, right: false });
  const pos = useRef({ x: 40, y: 0 });
  const orbsRef = useRef<Orb[]>([]);
  const collectedRef = useRef(0);
  const onWinRef = useRef(onWin);
  onWinRef.current = onWin;

  const fxMeta = powerFx[hero.power.toLowerCase()] || powerFx.spark!;
  const moveSpeed = 1.2 + hero.speed * 0.35;
  const jumpH = hero.canFly ? 110 : 55;
  const powerReach = 40 + hero.strength * 8;

  const tryWin = () => {
    if (collectedRef.current >= ORBS_TO_WIN && !wonRef.current) {
      wonRef.current = true;
      setMsg('City saved!');
      onWinRef.current();
    }
  };

  useEffect(() => {
    const spawn = () => {
      const next: Orb[] = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: 12 + Math.random() * 76,
        y: 18 + Math.random() * 52,
      }));
      orbsRef.current = next;
      setOrbs(next);
    };
    spawn();
    collectedRef.current = 0;
    setCollected(0);
    wonRef.current = false;
  }, [hero.name, city.name]);

  useEffect(() => {
    const down = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        pos.current.y = jumpH;
        setY(jumpH);
      }
      if (e.key === 'Enter' || e.key === 'p') {
        e.preventDefault();
        firePower();
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
  }, [jumpH, powerReach]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(32, t - last) / 16;
      last = t;
      let nx = pos.current.x;
      let ny = pos.current.y;
      if (keys.current.left) nx -= moveSpeed * dt;
      if (keys.current.right) nx += moveSpeed * dt;
      nx = Math.max(4, Math.min(92, nx));
      if (ny > 0) {
        ny = Math.max(0, ny - (hero.canFly ? 1.6 : 3.2) * dt);
      }
      pos.current = { x: nx, y: ny };
      setX(nx);
      setY(ny);

      // Gravity collect when close
      const remaining = orbsRef.current.filter((o) => {
        const dx = o.x - nx;
        const dy = o.y - (78 - ny * 0.35);
        const dist = Math.hypot(dx, dy);
          if (dist < 7) {
            collectedRef.current += 1;
            setCollected(collectedRef.current);
            setMsg(`Orb! ${collectedRef.current}/${ORBS_TO_WIN}`);
            tryWin();
            return false;
          }
          return true;
        });
        if (remaining.length !== orbsRef.current.length) {
          orbsRef.current = remaining;
          setOrbs(remaining);
        }

        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moveSpeed, hero.canFly]);

    const firePower = () => {
      setFx(hero.power);
      setTimeout(() => setFx(null), 450);
      const nx = pos.current.x;
      const ny = pos.current.y;
      const remaining = orbsRef.current.filter((o) => {
        const dx = Math.abs(o.x - nx);
        const dy = Math.abs(o.y - (78 - ny * 0.35));
        if (dx < powerReach / 4 && dy < 28) {
          collectedRef.current += 1;
          setCollected(collectedRef.current);
          setMsg(`${fxMeta.label}! ${collectedRef.current}/${ORBS_TO_WIN}`);
          tryWin();
          return false;
        }
        return true;
      });
      orbsRef.current = remaining;
      setOrbs(remaining);
    };

  return (
    <div className="glass rounded-2xl border border-rose-500/30 overflow-hidden mb-5">
      <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-white font-bold">
            {hero.name} in {city.name}
          </div>
          <div className="text-slate-400 text-xs">
            {fxMeta.emoji} {hero.power} · str {hero.strength} · spd {hero.speed}
            {hero.canFly ? ' · can fly' : ''} · {city.landmark}
            {city.neon ? ' · neon nights' : ''} · pop {city.population}
          </div>
        </div>
        <div className="font-mono text-rose-300 text-sm">
          Orbs {collected}/{ORBS_TO_WIN}
        </div>
      </div>

      <div
        ref={areaRef}
        tabIndex={0}
        className="relative h-64 sm:h-72 outline-none overflow-hidden"
        style={{
          background: city.neon
            ? 'linear-gradient(180deg, #0f172a 0%, #312e81 45%, #581c87 100%)'
            : 'linear-gradient(180deg, #0c4a6e 0%, #164e63 40%, #14532d 100%)',
        }}
      >
        {/* skyline */}
        <div className="absolute bottom-10 left-0 right-0 flex items-end justify-around opacity-40 px-4">
          {[40, 70, 55, 90, 48, 75].map((h, i) => (
            <div
              key={i}
              className={`w-8 sm:w-10 rounded-t-sm ${city.neon ? 'bg-fuchsia-400/40' : 'bg-slate-800/70'}`}
              style={{ height: h }}
            />
          ))}
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-white/50 font-mono truncate max-w-[80%]">
          {city.landmark}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/30" />

        {orbs.map((o) => (
          <div
            key={o.id}
            className="absolute w-4 h-4 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
            style={{ left: `${o.x}%`, top: `${o.y}%`, transform: 'translate(-50%, -50%)' }}
          />
        ))}

        {fx && (
          <motion.div
            initial={{ scale: 0.4, opacity: 0.9 }}
            animate={{ scale: 2.2, opacity: 0 }}
            className={`absolute bottom-12 w-16 h-16 rounded-full ${fxMeta.color} blur-md`}
            style={{ left: `${x}%`, marginLeft: -32 }}
          />
        )}

        <motion.div
          className="absolute bottom-10 flex flex-col items-center"
          style={{ left: `${x}%`, transform: `translate(-50%, -${y}px)` }}
        >
          <div className="text-[10px] text-white bg-black/50 px-2 py-0.5 rounded mb-1 whitespace-nowrap">
            {hero.name}
          </div>
          <div className="text-3xl leading-none select-none">{fxMeta.emoji}</div>
        </motion.div>

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
            }, 180);
          }}
        >
          ←
        </button>
        <button
          type="button"
          className="glass px-4 py-2 rounded-xl text-sm text-white border border-white/15"
          onClick={() => {
            pos.current.y = jumpH;
            setY(jumpH);
          }}
        >
          Jump
        </button>
        <button
          type="button"
          className="glass px-4 py-2 rounded-xl text-sm text-white border border-white/15"
          onClick={() => {
            keys.current.right = true;
            setTimeout(() => {
              keys.current.right = false;
            }, 180);
          }}
        >
          →
        </button>
        <button
          type="button"
          onClick={firePower}
          className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-orange-500"
        >
          {fxMeta.emoji} Power
        </button>
      </div>
    </div>
  );
}

export default function ObjectLockerPage() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const [index, setIndex] = useState(0);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<'none' | 'ok' | 'bad'>('none');
  const [errorMsg, setErrorMsg] = useState('');
  const [created, setCreated] = useState<Record<string, ObjectValue> | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pass, setPass] = useState('');
  const [passErr, setPassErr] = useState('');
  const [hero, setHero] = useState<HeroObject>(defaultHero);
  const [city, setCity] = useState<CityObject>(defaultCity);
  const [enemy, setEnemy] = useState<EnemyObject>(defaultEnemy);
  const [heroMethods, setHeroMethods] = useState<HeroMethods>({});
  const [playWon, setPlayWon] = useState(false);

  const levels = objectLockerLevels;
  const level = levels[index]!;
  const meta = modeMeta[level.mode];
  const nested = level.id === 14 ? nestedHomePreview : null;
  const isFinal = level.chapter === 'final';
  const isMethods = level.chapter === 'methods';

  useEffect(() => {
    const save = loadSave();
    if (save.hero) setHero(save.hero);
    if (save.city) setCity(save.city);
    if (save.enemy) setEnemy(save.enemy);
    if (save.heroMethods) setHeroMethods(save.heroMethods);
  }, []);

  const reset = () => {
    setCode(level.starterCode);
    setResult('none');
    setErrorMsg('');
    setCreated(null);
    setShowHint(false);
    setPlayWon(false);
  };

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const celebrate = () => {
    setResult('ok');
    recordAnswer(true);
    setShowConfetti(true);
    addStars(showHint ? 1 : 2);
    incrementGamesPlayed();
    setTimeout(() => setShowConfetti(false), 2500);
  };

  const check = () => {
    if (level.mode === 'create') {
      const v = validateCreateAnswer(level, code);
      if (v.ok) {
        setCreated(v.data);
        setErrorMsg('');
        if (level.createVar === 'hero') {
          const h = asHero(v.data);
          setHero(h);
          writeSave({ ...loadSave(), hero: h });
        }
        if (level.createVar === 'city') {
          const c = asCity(v.data);
          setCity(c);
          writeSave({ ...loadSave(), city: c });
        }
        if (level.createVar === 'enemy') {
          const e = asEnemy(v.data);
          setEnemy(e);
          writeSave({ ...loadSave(), enemy: e });
        }
        celebrate();
      } else {
        setResult('bad');
        setErrorMsg(v.message);
        recordAnswer(false);
      }
      return;
    }

    if (checkObjectAnswer(level, code)) {
      setErrorMsg('');
      if (level.unlockMethod) {
        const save = loadSave();
        const hm = { ...(save.heroMethods || {}), ...(heroMethods || {}) };
        const em = { ...(save.enemyMethods || {}) };
        if (level.unlockMethod === 'shoot') hm.shoot = true;
        if (level.unlockMethod === 'superJump') hm.superJump = true;
        if (level.unlockMethod === 'grow') hm.grow = true;
        if (level.unlockMethod === 'enemyChase') em.chase = true;
        if (level.unlockMethod === 'enemyRoar') em.roar = true;
        setHeroMethods(hm);
        writeSave({ ...save, heroMethods: hm, enemyMethods: em });
      }
      celebrate();
    } else {
      setResult('bad');
      setErrorMsg(
        level.mode === 'method'
          ? 'Check the method name, dots, and parentheses ().'
          : ''
      );
      recordAnswer(false);
    }
  };

  const onPlayWin = () => {
    if (playWon) return;
    setPlayWon(true);
    celebrate();
  };

  const next = () => {
    if (index < levels.length - 1) setIndex((i) => i + 1);
    else router.push('/sections/favourite');
  };

  const unlocked = pass === LEVEL_PASSCODE && !passErr;

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950">
      <FloatingShapes />
      <Confetti show={showConfetti} />

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.push('/sections/favourite')}
            className="glass px-4 py-2 rounded-xl text-sm text-white/90 border border-white/10 hover:bg-white/10"
          >
            ← Favourites
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPass('');
                setPassErr('');
                setShowPicker(true);
              }}
              className="glass px-3 py-2 rounded-xl text-xs text-cyan-200 border border-cyan-500/20"
            >
              Levels
            </button>
            <div className={`glass px-3 py-2 rounded-xl text-xs border ${meta.border}`}>
              <span className={meta.color}>{meta.label}</span>
              <span className="text-slate-500"> · {meta.blurb}</span>
            </div>
            <div className="glass px-3 py-2 rounded-xl text-sm text-white border border-white/10">
              {index + 1}/{levels.length}
            </div>
          </div>
        </header>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <p className="text-cyan-300/90 text-xs font-semibold uppercase tracking-wide mb-1">
            {isMethods
              ? 'Methods · Actions on Objects'
              : isFinal
                ? 'Final Levels · Your Game Objects'
                : 'Objects · Key → Value'}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">🗄️ Object Locker</h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            {isMethods
              ? 'Learn method calls, attach shoot / superJump / grow, then face an enemy you built.'
              : isFinal
                ? 'Forge a hero, design a city, then play the Final Character Game powered by your objects.'
                : 'Pack labeled drawers, peek inside, and update what\'s stored — that\'s an object!'}
          </p>
        </motion.div>

        <motion.div
          key={level.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass rounded-2xl border p-5 mb-5 ${
            isMethods
              ? 'border-violet-500/35'
              : isFinal
                ? 'border-emerald-500/35'
                : 'border-indigo-500/25'
          }`}
        >
          <h2 className="text-xl font-bold text-white mb-1">{level.title}</h2>
          <p className="text-indigo-200/90 text-sm mb-2">{level.concept}</p>
          <p className="text-slate-300 text-sm">{level.instruction}</p>
        </motion.div>

        {level.mode === 'play' ? (
          <FinalCharacterGame hero={hero} city={city} onWin={onPlayWin} />
        ) : level.mode === 'playMethods' && level.playKind ? (
          <MethodsArena
            kind={level.playKind}
            hero={hero}
            city={city}
            enemy={enemy}
            methods={
              level.playKind === 'shootPractice'
                ? { ...heroMethods, shoot: true }
                : level.playKind === 'heroCombo'
                  ? { shoot: true, superJump: true, grow: true }
                  : { shoot: true, superJump: true, grow: true, ...heroMethods }
            }
            onWin={onPlayWin}
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <LockerView
                title={
                  level.mode === 'build' || level.mode === 'create'
                    ? 'Your locker (empty → fill)'
                    : level.mode === 'method'
                      ? 'Object + methods'
                      : 'Current locker'
                }
                data={
                  (level.mode === 'build' || level.mode === 'create') && result !== 'ok'
                    ? {}
                    : (level.mode === 'build' || level.mode === 'create') && result === 'ok'
                      ? created || level.targetObject || {}
                      : level.mode === 'update' && result === 'ok'
                        ? level.targetObject || level.startObject
                        : level.startObject
                }
                nested={nested}
                methodNames={
                  level.mode === 'method'
                    ? result === 'ok' || !level.solutions.some((s) => s.includes('='))
                      ? level.methodNames
                      : undefined
                    : undefined
                }
              />
              <GoalPanel level={level} created={result === 'ok' ? created : null} />
            </div>

            <div
              className="glass rounded-2xl border border-white/15 overflow-hidden mb-4 select-none"
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
            >
              <div className="px-4 py-2 bg-slate-900/60 border-b border-white/10 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="ml-2 text-slate-500 text-xs font-mono">object.js</span>
              </div>
              <div className="p-4">
                <label className="text-slate-400 text-xs mb-2 block">Type your answer</label>
                <textarea
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setResult('none');
                    setErrorMsg('');
                    setCreated(null);
                  }}
                  onKeyDown={(e) => {
                    blockClipboardKeys(e);
                    if (e.key === 'Enter' && !e.shiftKey && result !== 'ok' && level.mode !== 'create') {
                      e.preventDefault();
                      check();
                    }
                  }}
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  disabled={result === 'ok'}
                  rows={level.mode === 'create' ? 7 : 3}
                  spellCheck={false}
                  autoComplete="off"
                  className={`w-full font-mono text-sm rounded-xl px-4 py-3 border-2 bg-slate-900/50 text-emerald-300 focus:outline-none resize-none
                    ${
                      result === 'bad'
                        ? 'border-red-500/50'
                        : result === 'ok'
                          ? 'border-green-500/50'
                          : 'border-white/15 focus:border-cyan-400/50'
                    }`}
                  placeholder={
                    level.mode === 'create'
                      ? 'let enemy = { ... }'
                      : level.mode === 'method'
                        ? 'object.method()  or  object.method = function() {}'
                        : level.mode === 'build'
                          ? 'let thing = { ... }'
                          : level.mode === 'access'
                            ? 'object.key'
                            : 'object.key = value'
                  }
                />
              </div>
            </div>
          </>
        )}

        <AnimatePresence>
          {result === 'ok' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-xl border border-green-500/40 bg-green-500/15 px-4 py-3 text-green-300 text-sm"
            >
              ✓ {level.mode === 'play' || level.mode === 'playMethods' ? 'Victory!' : 'Unlocked!'}{' '}
              {level.explanation}
            </motion.div>
          )}
          {result === 'bad' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-red-300 text-sm"
            >
              ✗ {errorMsg || 'Not quite — check keys, colons, commas, and quotes.'}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          {level.mode === 'play' || level.mode === 'playMethods' ? (
            result === 'ok' ? (
              <motion.button
                type="button"
                onClick={next}
                className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-600"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {index < levels.length - 1
                  ? level.id === 18
                    ? 'Learn Methods →'
                    : 'Next →'
                  : '🏆 Done — Favourites'}
              </motion.button>
            ) : (
              <p className="text-slate-400 text-sm text-center">
                {level.mode === 'play'
                  ? `Use ← → / Jump / Power — collect ${ORBS_TO_WIN} orbs to finish.`
                  : 'Use the method buttons (or keys) to finish this arena.'}
              </p>
            )
          ) : result !== 'ok' ? (
            <>
              <motion.button
                type="button"
                onClick={check}
                className="btn-cosmic px-6 py-3 rounded-xl font-semibold"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {level.mode === 'create'
                  ? 'Save object'
                  : level.mode === 'method'
                    ? 'Check method'
                    : 'Check locker'}
              </motion.button>
              <button
                type="button"
                onClick={reset}
                className="glass px-4 py-3 rounded-xl text-sm text-slate-300 border border-white/10"
              >
                Reset
              </button>
              {!showHint && (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="glass px-4 py-3 rounded-xl text-sm text-amber-300 border border-amber-500/30"
                >
                  Hint
                </button>
              )}
            </>
          ) : (
            <motion.button
              type="button"
              onClick={next}
              className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-600"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {index < levels.length - 1
                ? index === 14
                  ? 'Enter Final Levels →'
                  : index === 15
                    ? 'Design your city →'
                    : index === 16
                      ? 'Play Final Character Game →'
                      : level.id === 28
                        ? 'Build hero methods →'
                        : level.id === 33
                          ? 'Create your enemy →'
                          : 'Next puzzle →'
                : '🏆 Done — Favourites'}
            </motion.button>
          )}
        </div>

        {showHint && result !== 'ok' && level.mode !== 'play' && level.mode !== 'playMethods' && (
          <div className="text-center mb-4">
            <div className="inline-block glass px-5 py-3 rounded-xl border border-amber-500/30 text-amber-200 text-sm select-none">
              💡 {level.hint}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="glass rounded-2xl p-6 max-w-md w-full border border-cyan-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white font-bold text-center mb-2">Jump to level</h3>
              <p className="text-slate-400 text-sm text-center mb-3">Instructor passcode</p>
              <input
                type="password"
                value={pass}
                onChange={(e) => {
                  setPass(e.target.value);
                  setPassErr('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (pass === LEVEL_PASSCODE) setPassErr('');
                    else setPassErr('Wrong passcode');
                  }
                }}
                className="w-full mb-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-center"
                placeholder="Passcode"
              />
              {passErr && <p className="text-red-400 text-xs text-center mb-2">{passErr}</p>}
              <button
                type="button"
                onClick={() => {
                  if (pass === LEVEL_PASSCODE) setPassErr('');
                  else setPassErr('Wrong passcode');
                }}
                className="w-full mb-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-semibold"
              >
                Unlock
              </button>
              {unlocked && (
                <div className="grid grid-cols-5 gap-2">
                  {levels.map((lv, i) => (
                    <button
                      key={lv.id}
                      type="button"
                      onClick={() => {
                        setIndex(i);
                        setShowPicker(false);
                      }}
                      className={`py-2 rounded-lg text-sm font-bold border ${
                        i === index
                          ? 'bg-cyan-500/40 border-cyan-400 text-white'
                          : lv.chapter === 'methods'
                            ? 'bg-violet-500/15 border-violet-500/40 text-violet-200'
                            : lv.chapter === 'final'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                              : 'bg-white/5 border-white/10 text-gray-300'
                      }`}
                    >
                      {lv.id}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="mt-4 w-full text-slate-400 text-sm"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
