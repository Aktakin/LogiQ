'use client';

import { useState, useMemo, useEffect, useRef, type ChangeEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

/* ─── types ─── */

interface Blank { answer: string; hint: string }

interface Enemy { id: number; emoji: string; hp: number; label?: string; ally?: boolean }

interface Level {
  id: number;
  title: string;
  intro: string;
  loopType: 'for' | 'while' | 'for-of';
  enemies: Enemy[];
  showIndices?: boolean;
  targetSeq: number[];
  codeTemplate: string;
  blanks: Blank[];
  hint: string;
  errorHint: string;
  /** After level 14: type the whole loop (normalized match vs `expectedLoop`). */
  inputMode?: 'blanks' | 'fullLoop';
  /** Canonical answer; compared with `normalizeLoopAnswer`. */
  expectedLoop?: string;
  /** Extra outline shown in the hint panel (with “Hint”). */
  fullLoopHint?: string;
  /** Lines shown above the textarea (comments + setup). */
  codePreamble?: string;
}

/* ─── helpers ─── */

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Loosens whitespace and optional line-ending semicolons for comparing typed loops. */
function normalizeLoopAnswer(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/;\s*(?=\n)/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Level 15–19: grey = not yet typed (hint), green = correct, red = wrong. */
function FullLoopCharView({ expected, typed }: { expected: string; typed: string }) {
  const chars = Array.from(expected);
  return (
    <pre className="m-0 whitespace-pre-wrap font-mono text-xs sm:text-sm leading-relaxed text-left">
      {chars.map((ch, i) => {
        const has = i < typed.length;
        const u = typed[i];
        const ok = has && u === ch;
        const cls = !has ? 'text-gray-600' : ok ? 'text-emerald-400' : 'text-red-400';

        if (ch === '\n') {
          return (
            <span key={i} className={cls}>
              {!has ? (
                <span className="text-gray-600 select-none" title="newline">
                  ↵
                </span>
              ) : ok ? (
                <span className="text-emerald-400/90">↵</span>
              ) : (
                <span className="text-red-400">{u === '\n' ? '↵' : u}</span>
              )}
              {'\n'}
            </span>
          );
        }

        if (ch === ' ') {
          return (
            <span key={i} className={`${cls} inline-block min-w-[0.45em]`}>
              {has ? (u === ' ' ? '\u00A0' : u) : <span className="text-gray-600">·</span>}
            </span>
          );
        }

        return (
          <span key={i} className={cls}>
            {has ? u : ch}
          </span>
        );
      })}
      {typed.length < expected.length && (
        <span className="inline-block w-0.5 h-4 ml-px align-middle bg-cyan-400/80 animate-pulse rounded-sm" aria-hidden />
      )}
    </pre>
  );
}

function parseTemplate(tpl: string): (string | number)[][] {
  return tpl.split('\n').map(line => {
    const parts: (string | number)[] = [];
    let rest = line;
    const re = /\{\{(\d+)\}\}/;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rest)) !== null) {
      if (m.index > 0) parts.push(rest.slice(0, m.index));
      parts.push(parseInt(m[1]));
      rest = rest.slice(m.index + m[0].length);
    }
    if (rest) parts.push(rest);
    if (parts.length === 0) parts.push('');
    return parts;
  });
}

const KW = /^(?:for|let|while|of|const|function)$/;
function colorize(text: string): ReactNode[] {
  const parts = text.split(/((?:for|let|while|of|const|function)\b|\b\d+\b|'[^']*'|\w+\()/);
  return parts.filter(Boolean).map((tok, i) => {
    if (KW.test(tok)) return <span key={i} className="text-purple-400 font-semibold">{tok}</span>;
    if (/^\d+$/.test(tok)) return <span key={i} className="text-amber-300">{tok}</span>;
    if (/^'[^']*'$/.test(tok)) return <span key={i} className="text-emerald-300">{tok}</span>;
    if (/^\w+\($/.test(tok)) return <span key={i} className="text-cyan-300">{tok}</span>;
    return <span key={i}>{tok}</span>;
  });
}

const LOOP_TAG: Record<string, { label: string; color: string }> = {
  'for':     { label: 'for loop',     color: '#818cf8' },
  'while':   { label: 'while loop',   color: '#34d399' },
  'for-of':  { label: 'for…of loop',  color: '#fbbf24' },
};

/* ─── levels ─── */

const E = (id: number, emoji: string, hp = 1, label?: string, ally?: boolean): Enemy =>
  ({ id, emoji, hp, ...(label ? { label } : {}), ...(ally ? { ally } : {}) });

const levels: Level[] = [
  {
    id: 1,
    title: 'First Volley',
    intro: 'A for loop repeats code a set number of times. Count the enemies!',
    loopType: 'for',
    enemies: [E(0,'👾'), E(1,'👾'), E(2,'👾')],
    targetSeq: [0,1,2],
    codeTemplate: 'for (let i = 0; i < {{0}}; i++) {\n  shoot()\n}',
    blanks: [{ answer: '3', hint: 'count' }],
    hint: 'Count the enemies — that\'s how many times the loop should run.',
    errorHint: 'There are 3 enemies. The loop needs i < 3.',
  },
  {
    id: 2,
    title: 'Five Alive',
    intro: 'More enemies! Same pattern — just a bigger number.',
    loopType: 'for',
    enemies: [E(0,'👾'), E(1,'👽'), E(2,'👾'), E(3,'👽'), E(4,'👾')],
    targetSeq: [0,1,2,3,4],
    codeTemplate: 'for (let i = 0; i < {{0}}; i++) {\n  shoot()\n}',
    blanks: [{ answer: '5', hint: 'count' }],
    hint: 'Same for loop — just more enemies to blast.',
    errorHint: 'Five enemies need five shots: i < 5.',
  },
  {
    id: 3,
    title: 'Skip the Allies',
    intro: 'The first 2 are allies (🛡️)! Start the loop after them.',
    loopType: 'for',
    enemies: [E(0,'🛡️',1,undefined,true), E(1,'🛡️',1,undefined,true), E(2,'👾'), E(3,'👾'), E(4,'👾')],
    showIndices: true,
    targetSeq: [2,3,4],
    codeTemplate: 'for (let i = {{0}}; i < 5; i++) {\n  shoot(i)\n}',
    blanks: [{ answer: '2', hint: 'start' }],
    hint: 'Allies are at index 0 and 1. Start shooting at index 2.',
    errorHint: 'Start at i = 2 to skip the first two allies.',
  },
  {
    id: 4,
    title: 'Skip Shot',
    intro: 'Every other enemy is a decoy! Increment by 2 to hit only the real ones.',
    loopType: 'for',
    enemies: [E(0,'👾'), E(1,'🪨'), E(2,'👾'), E(3,'🪨'), E(4,'👾'), E(5,'🪨')],
    showIndices: true,
    targetSeq: [0,2,4],
    codeTemplate: 'for (let i = 0; i < 6; i += {{0}}) {\n  shoot(i)\n}',
    blanks: [{ answer: '2', hint: 'step' }],
    hint: 'Real enemies are at 0, 2, 4. What increment skips one each time?',
    errorHint: 'Use i += 2 to hit indices 0, 2, 4.',
  },
  {
    id: 5,
    title: 'Countdown!',
    intro: 'Shoot from right to left — use a decrementing loop.',
    loopType: 'for',
    enemies: [E(0,'👾'), E(1,'👾'), E(2,'👾'), E(3,'👾')],
    showIndices: true,
    targetSeq: [3,2,1,0],
    codeTemplate: 'for (let i = {{0}}; i >= 0; i--) {\n  shoot(i)\n}',
    blanks: [{ answer: '3', hint: 'start' }],
    hint: 'Start from the last index (3) and count down to 0.',
    errorHint: 'The last enemy is at index 3. Start there: i = 3.',
  },
  {
    id: 6,
    title: 'Boss Battle',
    intro: 'A while loop keeps going until a condition is false. Drain the boss HP!',
    loopType: 'while',
    enemies: [E(0,'👹',5)],
    targetSeq: [0,0,0,0,0],
    codeTemplate: 'let hp = 5\nwhile (hp > {{0}}) {\n  attack()\n  hp--\n}',
    blanks: [{ answer: '0', hint: '?' }],
    hint: 'The boss has 5 HP. Keep attacking while HP is above what number?',
    errorHint: 'Attack while hp > 0 — that drains all 5 HP.',
  },
  {
    id: 7,
    title: 'Shield Down',
    intro: 'The shield blocks everything. Name the variable to check!',
    loopType: 'while',
    enemies: [E(0,'🛡️',3)],
    targetSeq: [0,0,0],
    codeTemplate: 'let shield = 3\nwhile ({{0}} > 0) {\n  blast()\n  shield--\n}',
    blanks: [{ answer: 'shield', hint: 'variable' }],
    hint: 'Which variable tracks the shield strength? Use its name in the condition.',
    errorHint: 'The variable is called "shield" — use it in the while condition.',
  },
  {
    id: 8,
    title: 'Target Each',
    intro: 'A for…of loop goes through each item in a list. Name the list!',
    loopType: 'for-of',
    enemies: [E(0,'👾',1,'alien'), E(1,'👻',1,'ghost'), E(2,'🟢',1,'slime')],
    targetSeq: [0,1,2],
    codeTemplate: "let targets = ['alien', 'ghost', 'slime']\nfor (let t of {{0}}) {\n  destroy(t)\n}",
    blanks: [{ answer: 'targets', hint: 'array' }],
    hint: 'The array is stored in a variable. What\'s its name?',
    errorHint: 'Loop over the "targets" array: for (let t of targets).',
  },
  {
    id: 9,
    title: 'Name Your Shot',
    intro: 'The loop variable name must match how it\'s used inside the body.',
    loopType: 'for-of',
    enemies: [E(0,'🦇',1,'bat'), E(1,'🐀',1,'rat'), E(2,'🐱',1,'cat'), E(3,'👹',1,'ogre')],
    targetSeq: [0,1,2,3],
    codeTemplate: "let foes = ['bat', 'rat', 'cat', 'ogre']\nfor (let {{0}} of foes) {\n  blast(enemy)\n}",
    blanks: [{ answer: 'enemy', hint: 'name' }],
    hint: 'Look at the function call inside: blast(enemy). The loop variable must be called…',
    errorHint: 'blast(enemy) uses "enemy", so write: for (let enemy of foes).',
  },

  /* ── 10–14: mixed blanks ── */
  {
    id: 10,
    title: 'Six Pack',
    intro: 'A full row of six — count them for your loop bound.',
    loopType: 'for',
    enemies: [E(0, '👾'), E(1, '👽'), E(2, '👾'), E(3, '👽'), E(4, '👾'), E(5, '👽')],
    targetSeq: [0, 1, 2, 3, 4, 5],
    codeTemplate: 'for (let i = 0; i < {{0}}; i++) {\n  shoot()\n}',
    blanks: [{ answer: '6', hint: 'count' }],
    hint: 'Six aliens in a row → the loop runs six times.',
    errorHint: 'Use i < 6.',
  },
  {
    id: 11,
    title: 'Dragon Breath',
    intro: 'The dragon has 5 HP — blast until it is gone.',
    loopType: 'while',
    enemies: [E(0, '🐉', 5)],
    targetSeq: [0, 0, 0, 0, 0],
    codeTemplate: 'let hp = 5\nwhile (hp > {{0}}) {\n  shoot()\n  hp--\n}',
    blanks: [{ answer: '0', hint: '?' }],
    hint: 'Keep shooting while hp is still above zero.',
    errorHint: 'while (hp > 0) { shoot(); hp--; }',
  },
  {
    id: 12,
    title: 'Corridor',
    intro: 'The first slot is an ally — only fire from index 1 onward.',
    loopType: 'for',
    enemies: [E(0, '🛡️', 1, undefined, true), E(1, '👾'), E(2, '👾'), E(3, '👾'), E(4, '👾')],
    showIndices: true,
    targetSeq: [1, 2, 3, 4],
    codeTemplate: 'for (let i = {{0}}; i < 5; i++) {\n  shoot(i)\n}',
    blanks: [{ answer: '1', hint: 'start' }],
    hint: 'Skip index 0 — start i at 1.',
    errorHint: 'for (let i = 1; i < 5; i++) { shoot(i) }',
  },
  {
    id: 13,
    title: 'Cargo Scan',
    intro: 'Loop over every crate in the cargo array.',
    loopType: 'for-of',
    enemies: [E(0, '📦', 1, 'red'), E(1, '📦', 1, 'green'), E(2, '📦', 1, 'blue'), E(3, '📦', 1, 'gold')],
    targetSeq: [0, 1, 2, 3],
    codeTemplate: "let cargo = ['red', 'green', 'blue', 'gold']\nfor (let c of {{0}}) {\n  shoot()\n}",
    blanks: [{ answer: 'cargo', hint: 'array' }],
    hint: 'for (let c of ???) — the list is stored in `cargo`.',
    errorHint: 'Use: for (let c of cargo).',
  },
  {
    id: 14,
    title: 'Ghost Targets',
    intro: 'Only every other ship is real — step through indices by 2.',
    loopType: 'for',
    enemies: [E(0, '👾'), E(1, '👻'), E(2, '👾'), E(3, '👻'), E(4, '👾'), E(5, '👻')],
    showIndices: true,
    targetSeq: [0, 2, 4],
    codeTemplate: 'for (let i = 0; i < 6; i += {{0}}) {\n  shoot(i)\n}',
    blanks: [{ answer: '2', hint: 'step' }],
    hint: 'Hit indices 0, 2, and 4 — increase i by 2 each time.',
    errorHint: 'Use i += 2.',
  },

  /* ── 15–19: type the full loop (hints show outline) ── */
  {
    id: 15,
    title: 'Write the Loop',
    intro: 'No blanks — write the whole for loop. Check the hint if you are stuck.',
    loopType: 'for',
    inputMode: 'fullLoop',
    codePreamble:
      '// Four aliens in a row. Type the complete for loop (including { and }).\n// Call shoot() once per iteration.\n',
    enemies: [E(0, '👾'), E(1, '👽'), E(2, '👾'), E(3, '👽')],
    targetSeq: [0, 1, 2, 3],
    codeTemplate: '',
    blanks: [],
    expectedLoop: `for (let i = 0; i < 4; i++) {
  shoot()
}`,
    hint: 'You need four iterations — i should start at 0 and stop before 4.',
    fullLoopHint:
      'Outline: for (let i = 0; i < 4; i++) {\n  shoot()\n}\n→ i goes 0, 1, 2, 3 — four shots.',
    errorHint: 'Match: for (let i = 0; i < 4; i++) { shoot() } with braces around the body.',
  },
  {
    id: 16,
    title: 'Drain the Tank',
    intro: 'The U.F.O. has 4 HP. `let hp = 4` is already set — you write the while loop.',
    loopType: 'while',
    inputMode: 'fullLoop',
    codePreamble: 'let hp = 4\n\n// Write only the while loop below (with { }). Each hit does shoot() then hp--.\n',
    enemies: [E(0, '🛸', 4)],
    targetSeq: [0, 0, 0, 0],
    codeTemplate: '',
    blanks: [],
    expectedLoop: `while (hp > 0) {
  shoot()
  hp--
}`,
    hint: 'Loop while hp is still positive; inside, shoot once and subtract 1 from hp.',
    fullLoopHint:
      'while (hp > 0) {\n  shoot()\n  hp--\n}\n→ Stops when hp becomes 0.',
    errorHint: 'while (hp > 0) { shoot(); hp--; } — hp-- can be on its own line.',
  },
  {
    id: 17,
    title: 'Squad Roll Call',
    intro: 'The squad array is ready — write a for…of loop using the variable name `n`.',
    loopType: 'for-of',
    inputMode: 'fullLoop',
    codePreamble: "let squad = ['uno', 'dos', 'tres']\n\n// Type a for (let n of squad) loop; call shoot() each time.\n",
    enemies: [E(0, '⭐'), E(1, '⭐'), E(2, '⭐')],
    targetSeq: [0, 1, 2],
    codeTemplate: '',
    blanks: [],
    expectedLoop: `for (let n of squad) {
  shoot()
}`,
    hint: 'for (let n of squad) — then one shoot() inside the block.',
    fullLoopHint: 'for (let n of squad) {\n  shoot()\n}\n→ n is each string in the array.',
    errorHint: 'Use exactly: for (let n of squad) { shoot() }',
  },
  {
    id: 18,
    title: 'Skip Beat',
    intro: 'Six icons — blast only indices 0, 2, and 4. Write the for loop with i += 2.',
    loopType: 'for',
    inputMode: 'fullLoop',
    codePreamble: '// Step through 0, 2, 4 with a for loop. Use shoot(i) inside.\n',
    enemies: [E(0, '👾'), E(1, '👻'), E(2, '👾'), E(3, '👻'), E(4, '👾'), E(5, '👻')],
    showIndices: true,
    targetSeq: [0, 2, 4],
    codeTemplate: '',
    blanks: [],
    expectedLoop: `for (let i = 0; i < 6; i += 2) {
  shoot(i)
}`,
    hint: 'Start at 0, stay under 6, add 2 to i each time — pass i into shoot.',
    fullLoopHint: 'for (let i = 0; i < 6; i += 2) {\n  shoot(i)\n}',
    errorHint: 'i += 2 in the for header; body uses shoot(i).',
  },
  {
    id: 19,
    title: 'Reverse Strike',
    intro: 'Four targets — fire from the rightmost index down to 0.',
    loopType: 'for',
    inputMode: 'fullLoop',
    codePreamble: '// Indices 3 → 2 → 1 → 0. Use i-- and shoot(i).\n',
    enemies: [E(0, '👾'), E(1, '👽'), E(2, '👾'), E(3, '👽')],
    showIndices: true,
    targetSeq: [3, 2, 1, 0],
    codeTemplate: '',
    blanks: [],
    expectedLoop: `for (let i = 3; i >= 0; i--) {
  shoot(i)
}`,
    hint: 'Start i at 3, continue while i >= 0, decrement i after each shot.',
    fullLoopHint: 'for (let i = 3; i >= 0; i--) {\n  shoot(i)\n}',
    errorHint: 'Count down: i = 3, condition i >= 0, i-- in the header.',
  },
];

/* ─── component ─── */

export default function LoopBlasterPage() {
  const router = useRouter();
  const { addStars, recordAnswer, incrementGamesPlayed } = useGameStore();

  const [levelIdx, setLevelIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [phase, setPhase] = useState<'idle' | 'firing' | 'win' | 'error'>('idle');
  const [activeShotTarget, setActiveShotTarget] = useState(-1);
  const [hp, setHp] = useState<Record<number, number>>({});
  const [wrongBlanks, setWrongBlanks] = useState<Set<number>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHint, setShowHint] = useState(false);
  /** Only for level 0 — intro runs before “First Volley”, then stays off until remount / replay. */
  const [introDismissed, setIntroDismissed] = useState(false);
  const firingRef = useRef(false);

  const showIntroScreen = levelIdx === 0 && !introDismissed;

  const level = levels[levelIdx];
  const tag = LOOP_TAG[level.loopType];
  const isFullLoop = level.inputMode === 'fullLoop';
  const parsed = useMemo(() => {
    if (level.inputMode === 'fullLoop') return null;
    return parseTemplate(level.codeTemplate);
  }, [level.codeTemplate, level.inputMode]);

  useEffect(() => {
    const h: Record<number, number> = {};
    level.enemies.forEach(e => { h[e.id] = e.hp; });
    setHp(h);
    setAnswers(level.inputMode === 'fullLoop' ? [''] : level.blanks.map(() => ''));
    setPhase('idle');
    setActiveShotTarget(-1);
    setWrongBlanks(new Set());
    setShowHint(false);
    firingRef.current = false;
  }, [levelIdx, level]);

  const updateAnswer = (idx: number, val: string) => {
    setAnswers(prev => { const n = [...prev]; n[idx] = val; return n; });
    if (phase === 'error') { setPhase('idle'); setWrongBlanks(new Set()); }
  };

  const fire = async () => {
    if (firingRef.current) return;

    if (level.inputMode === 'fullLoop' && level.expectedLoop) {
      const ok =
        normalizeLoopAnswer(answers[0] ?? '') === normalizeLoopAnswer(level.expectedLoop);
      if (!ok) {
        setPhase('error');
        return;
      }
    } else {
      const wrong = new Set<number>();
      level.blanks.forEach((b, i) => {
        if (answers[i].trim() !== b.answer) wrong.add(i);
      });
      if (wrong.size > 0) {
        setWrongBlanks(wrong);
        setPhase('error');
        return;
      }
    }

    firingRef.current = true;
    setPhase('firing');

    const localHP: Record<number, number> = {};
    level.enemies.forEach(e => { localHP[e.id] = e.hp; });
    setHp({ ...localHP });

    await sleep(300);

    for (let s = 0; s < level.targetSeq.length; s++) {
      if (!firingRef.current) break;
      const tid = level.targetSeq[s];
      setActiveShotTarget(tid);
      await sleep(180);
      localHP[tid]--;
      setHp({ ...localHP });
      setActiveShotTarget(-1);
      await sleep(320);
    }

    if (!firingRef.current) return;
    setPhase('win');
    addStars(2);
    recordAnswer(true);
    incrementGamesPlayed();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    firingRef.current = false;
  };

  const resetLevel = () => {
    firingRef.current = false;
    const h: Record<number, number> = {};
    level.enemies.forEach(e => { h[e.id] = e.hp; });
    setHp(h);
    setPhase('idle');
    setActiveShotTarget(-1);
    setWrongBlanks(new Set());
    setShowHint(false);
  };

  const nextLevel = () => {
    if (levelIdx >= levels.length - 1) router.push('/games/programming');
    else setLevelIdx(levelIdx + 1);
  };

  const isFiring = phase === 'firing';
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fullLoopInputRef = useRef<HTMLTextAreaElement>(null);

  const handleFullLoopChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const exp = level.expectedLoop ?? '';
    const prev = answers[0] ?? '';
    const nv = e.target.value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (nv.length < prev.length) {
      updateAnswer(0, nv);
      return;
    }
    if (nv.length > exp.length) {
      updateAnswer(0, prev);
      return;
    }
    if (nv.length > prev.length + 1) {
      updateAnswer(0, prev);
      return;
    }
    if (nv.length === prev.length + 1) {
      updateAnswer(0, nv);
    }
  };

  useEffect(() => {
    if (level.inputMode !== 'fullLoop') return;
    const t = window.setTimeout(() => fullLoopInputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [levelIdx, level.inputMode]);

  /* ─── render ─── */

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-4 md:p-6 relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/30 to-slate-950">
      <Confetti show={showConfetti} />

      {/* stars background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {showIntroScreen ? (
        <>
          <header className="max-w-4xl mx-auto mb-6 relative z-10">
            <motion.button
              onClick={() => router.push('/games/programming')}
              className="glass px-3 py-2 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px]"
              whileTap={{ scale: 0.97 }}
            >
              ← Code Quest
            </motion.button>
          </header>

          <div className="relative z-10 flex flex-col items-center justify-center min-h-[min(80dvh,720px)] px-2">
            <motion.div
              role="dialog"
              aria-labelledby="loop-intro-title"
              className="glass rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-purple-500/25 shadow-2xl shadow-purple-900/20"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <p className="text-center text-[11px] uppercase tracking-widest text-purple-400/80 mb-2">
                Before Loop Blaster — First Volley
              </p>
              <div className="text-4xl mb-3 text-center">🔄</div>
              <h2 id="loop-intro-title" className="text-xl sm:text-2xl font-bold text-white text-center mb-3">
                What are loops?
              </h2>
              <p className="text-center text-xs text-gray-500 mb-4">
                Read this first — then you&apos;ll start <span className="text-gray-300 font-semibold">Level 1: First Volley</span>.
              </p>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4">
                <strong className="text-purple-300">Loops are for repetitive actions</strong> — when you need to do the
                same thing more than once, you don&apos;t have to write it over and over.
              </p>
              <div className="rounded-xl bg-black/35 border border-white/10 p-3 mb-4 font-mono text-xs sm:text-sm">
                <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-2">Instead of this</p>
                <div className="text-rose-300/90 space-y-0.5">
                  <div>shoot()</div>
                  <div>shoot()</div>
                  <div>shoot()</div>
                </div>
              </div>
              <div className="rounded-xl bg-black/35 border border-emerald-500/20 p-3 mb-5 font-mono text-xs sm:text-sm">
                <p className="text-gray-500 text-[11px] uppercase tracking-wide mb-2">…you can say it once</p>
                <div className="text-emerald-300/95 space-y-2">
                  <div>
                    <span className="text-gray-500">{"// e.g. a loop (you'll practice this!):"}</span>
                  </div>
                  <div>
                    for (let i = 0; i &lt; 3; i++) {'{'} shoot() {'}'}
                  </div>
                  <div className="text-gray-400 pt-1 border-t border-white/5">
                    <span className="text-gray-500">{'// or a helper name:'}</span> shootThree()
                  </div>
                </div>
              </div>
              <p className="text-gray-500 text-xs text-center mb-5">
                Same idea: one pattern that runs multiple times — shorter code, fewer mistakes.
              </p>
              <motion.button
                type="button"
                onClick={() => setIntroDismissed(true)}
                className="w-full py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-purple-400 to-violet-500 min-h-[48px] text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start First Volley →
              </motion.button>
            </motion.div>
          </div>
        </>
      ) : (
        <>
      {/* header */}
      <header className="max-w-4xl mx-auto mb-3 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <motion.button
            onClick={() => router.push('/games/programming')}
            className="glass px-3 py-2 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px]"
            whileTap={{ scale: 0.97 }}
          >
            ← Code Quest
          </motion.button>
          <div className="flex gap-2 text-sm">
            <div className="glass px-3 py-1.5 rounded-xl">
              <span className="text-gray-400">Level </span>
              <span className="text-white font-bold">{levelIdx + 1}/{levels.length}</span>
            </div>
            <div
              className="px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color, border: `1px solid ${tag.color}35` }}
            >
              {tag.label}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto relative z-10 space-y-4">
        {/* title */}
        <motion.div className="text-center" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl font-bold text-white">💥 {level.title}</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">{level.intro}</p>
        </motion.div>

        {/* ── battle zone ── */}
        <motion.div
          className="glass rounded-2xl p-4 sm:p-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        >
          {/* enemy grid */}
          <div className="flex justify-center mb-6 flex-wrap">
            <div className="flex gap-3 sm:gap-4 flex-wrap justify-center">
              {level.enemies.map((enemy) => {
                const dead = (hp[enemy.id] ?? enemy.hp) <= 0;
                const isHit = activeShotTarget === enemy.id;
                const hpLeft = hp[enemy.id] ?? enemy.hp;
                return (
                  <motion.div
                    key={`${levelIdx}-${enemy.id}`}
                    className="flex flex-col items-center"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{
                      y: dead ? 10 : 0,
                      opacity: dead ? 0 : 1,
                      scale: isHit ? 1.25 : 1,
                    }}
                    transition={{
                      delay: dead ? 0 : enemy.id * 0.06,
                      type: isHit ? 'spring' : 'tween',
                      stiffness: 400,
                      damping: 15,
                    }}
                  >
                    <div
                      className={`relative text-3xl sm:text-4xl transition-all ${
                        enemy.ally ? 'opacity-50 grayscale' : ''
                      } ${isHit ? 'drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]' : ''}`}
                    >
                      {dead ? '💥' : enemy.emoji}
                      {/* HP hearts for multi-HP enemies */}
                      {enemy.hp > 1 && !dead && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {Array.from({ length: enemy.hp }).map((_, i) => (
                            <span key={i} className={`text-[8px] ${i < hpLeft ? 'opacity-100' : 'opacity-20'}`}>
                              ❤️
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {level.showIndices && (
                      <span className="text-[10px] text-gray-500 font-mono mt-1">[{enemy.id}]</span>
                    )}
                    {enemy.label && (
                      <span className="text-[10px] text-gray-500 mt-0.5">{enemy.label}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* cannon */}
          <div className="flex justify-center">
            <motion.div
              className="text-3xl sm:text-4xl"
              animate={isFiring && activeShotTarget >= 0
                ? { scale: [1, 1.2, 1], filter: ['brightness(1)', 'brightness(1.6)', 'brightness(1)'] }
                : {}}
              transition={{ duration: 0.15 }}
            >
              🚀
            </motion.div>
          </div>
          {isFiring && activeShotTarget >= 0 && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 bottom-16 w-1.5 h-8 rounded-full bg-gradient-to-t from-cyan-400 to-transparent"
              initial={{ opacity: 0, y: 0 }} animate={{ opacity: [1, 0], y: -60 }}
              transition={{ duration: 0.18 }}
              key={`proj-${activeShotTarget}-${Date.now()}`}
            />
          )}
        </motion.div>

        {/* ── code editor ── */}
        <motion.div
          className="glass rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <div className="bg-slate-900/60 px-4 py-2 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">loop.js</span>
            <span className="text-[10px] text-gray-600">
              {isFullLoop ? 'Type each character — grey hints, green = match' : 'Fill in the blanks'}
            </span>
          </div>
          <div className="p-4 font-mono text-sm leading-relaxed">
            {isFullLoop ? (
              <div className="space-y-3">
                {level.codePreamble && (
                  <pre className="text-gray-400 text-xs sm:text-sm whitespace-pre-wrap font-mono border-l-2 border-cyan-500/30 pl-3 pointer-events-none">
                    {level.codePreamble}
                  </pre>
                )}
                <p className="text-[10px] text-gray-500 pointer-events-none">
                  Click the box and type. Wrong keys show in red; backspace to fix. Pasting is disabled.
                </p>
                <div
                  className={`relative min-h-[160px] rounded-lg bg-slate-950/80 border px-3 py-2.5 transition-colors ${
                    phase === 'error'
                      ? 'border-red-500/60 ring-1 ring-red-500/30'
                      : 'border-cyan-500/35'
                  }`}
                >
                  <div className="pointer-events-none relative z-0 pr-1">
                    <FullLoopCharView expected={level.expectedLoop ?? ''} typed={answers[0] ?? ''} />
                  </div>
                  <textarea
                    ref={fullLoopInputRef}
                    value={answers[0] ?? ''}
                    onChange={handleFullLoopChange}
                    onPaste={e => e.preventDefault()}
                    onKeyDown={e => {
                      if (e.key === 'Tab') e.preventDefault();
                    }}
                    disabled={isFiring || phase === 'win'}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    aria-label="Type the loop code one character at a time"
                    className="absolute inset-0 z-10 w-full h-full min-h-[160px] cursor-text resize-none bg-transparent text-transparent caret-cyan-400/90 selection:bg-cyan-500/20 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500/30"
                  />
                </div>
              </div>
            ) : (
              parsed?.map((line, li) => (
                <div key={li} className="flex items-center min-h-[28px]">
                  <span className="text-gray-600 select-none w-7 text-right mr-3 text-xs shrink-0">{li + 1}</span>
                  <div className="flex items-center flex-wrap text-gray-300">
                    {line.map((part, pi) =>
                      typeof part === 'string' ? (
                        <span key={pi}>{colorize(part)}</span>
                      ) : (
                        <input
                          key={pi}
                          ref={el => { inputRefs.current[part] = el; }}
                          value={answers[part] ?? ''}
                          onChange={e => updateAnswer(part, e.target.value)}
                          disabled={isFiring || phase === 'win'}
                          placeholder={level.blanks[part].hint}
                          className={`mx-0.5 px-1.5 py-0.5 rounded font-mono text-center outline-none transition-colors ${
                            wrongBlanks.has(part)
                              ? 'bg-red-500/15 border-b-2 border-red-400 text-red-300'
                              : 'bg-cyan-500/10 border-b-2 border-cyan-500/50 text-cyan-200 focus:border-cyan-400 placeholder-gray-600'
                          }`}
                          style={{ width: Math.max(44, level.blanks[part].answer.length * 11 + 24) }}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) fire(); }}
                        />
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* error message */}
        <AnimatePresence>
          {phase === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass rounded-xl p-3 border border-rose-500/25 text-center"
            >
              <p className="text-rose-400 text-sm font-semibold mb-1">❌ Not quite right!</p>
              <p className="text-gray-400 text-xs">{level.errorHint}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* controls */}
        <div className="flex gap-2">
          <motion.button
            onClick={fire}
            disabled={
              isFiring ||
              phase === 'win' ||
              (isFullLoop ? !answers[0]?.trim() : answers.some(a => !a.trim()))
            }
            className="flex-1 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-red-600 to-orange-500 disabled:opacity-35 min-h-[48px]"
            whileHover={!isFiring ? { scale: 1.02 } : {}}
            whileTap={!isFiring ? { scale: 0.97 } : {}}
          >
            {isFiring ? '💥 Firing…' : '🔥 FIRE!'}
          </motion.button>
          <motion.button
            onClick={resetLevel}
            disabled={isFiring}
            className="px-4 py-3 rounded-xl font-bold text-gray-300 bg-slate-700/50 disabled:opacity-35 min-h-[48px] text-sm"
            whileTap={{ scale: 0.97 }}
          >
            ↺
          </motion.button>
        </div>

        {/* hint */}
        <div className="text-center">
          <button onClick={() => setShowHint(h => !h)} className="text-[11px] text-gray-500 hover:text-gray-300">
            {showHint ? 'Hide hint' : '💡 Hint'}
          </button>
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mt-1 space-y-2"
              >
                <p className="text-[11px] text-amber-300/80 leading-relaxed">{level.hint}</p>
                {level.fullLoopHint && (
                  <pre className="text-[10px] sm:text-[11px] text-amber-200/75 whitespace-pre-wrap font-mono text-left max-w-lg mx-auto leading-relaxed border border-amber-500/15 rounded-lg p-2 bg-amber-950/20">
                    {level.fullLoopHint}
                  </pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* win overlay */}
        <AnimatePresence>
          {phase === 'win' && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <motion.div
                className="glass rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center border border-emerald-500/30"
                initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
              >
                <div className="text-5xl mb-3">💥🎉</div>
                <h2 className="text-2xl font-bold text-white mb-2">Enemies Destroyed!</h2>
                <p className="text-gray-400 text-sm mb-1">
                  {level.targetSeq.length} shot{level.targetSeq.length !== 1 && 's'} fired
                </p>
                <p className="text-emerald-400 text-xs mb-5">⭐⭐ Earned 2 stars</p>
                <motion.button
                  onClick={nextLevel}
                  className="px-8 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-orange-400 to-red-400 min-h-[48px]"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                >
                  {levelIdx < levels.length - 1 ? 'Next Wave →' : 'Victory! 🏆'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
        </>
      )}
    </main>
  );
}
