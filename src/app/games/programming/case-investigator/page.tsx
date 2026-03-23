'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';

type LevelKind = 'whichLine' | 'whatHappens' | 'typeFix' | 'whichId' | 'stringStrict' | 'whatLogs';

interface LevelBase {
  id: number;
  title: string;
  briefing: string;
  hint: string;
  explain: string;
}

interface WhichLineLevel extends LevelBase {
  kind: 'whichLine';
  lines: string[];
  bugLineIndex: number;
}

interface WhatHappensLevel extends LevelBase {
  kind: 'whatHappens';
  code: string;
  choices: string[];
  correctIndex: number;
}

interface TypeFixLevel extends LevelBase {
  kind: 'typeFix';
  contextLines: string[];
  wrongLine: string;
  correctIdentifier: string;
}

interface WhichIdLevel extends LevelBase {
  kind: 'whichId';
  declaration: string;
  options: string[];
  correct: string;
}

interface StringStrictLevel extends LevelBase {
  kind: 'stringStrict';
  expression: string;
  choices: string[];
  /** index into choices */
  correctIndex: number;
}

interface WhatLogsLevel extends LevelBase {
  kind: 'whatLogs';
  code: string;
  choices: string[];
  correctIndex: number;
}

type Level =
  | WhichLineLevel
  | WhatHappensLevel
  | TypeFixLevel
  | WhichIdLevel
  | StringStrictLevel
  | WhatLogsLevel;

const KW = new Set([
  'let',
  'const',
  'var',
  'function',
  'return',
  'if',
  'else',
  'typeof',
  'true',
  'false',
  'null',
  'undefined',
]);

function SyntaxCode({ code, highlightLineIndex }: { code: string; highlightLineIndex?: number }) {
  const lines = code.split('\n');
  return (
    <pre className="font-mono text-[13px] sm:text-sm leading-relaxed text-left overflow-x-auto m-0 p-0">
      {lines.map((line, i) => (
        <div
          key={i}
          className={`flex gap-3 border-l-2 pl-2 py-0.5 -ml-1 ${
            highlightLineIndex === i ? 'border-amber-400 bg-amber-500/10' : 'border-transparent'
          }`}
        >
          <span className="select-none text-gray-600 w-6 shrink-0 text-right tabular-nums">{i + 1}</span>
          <span className="text-gray-200 whitespace-pre">{tokenizeLine(line)}</span>
        </div>
      ))}
    </pre>
  );
}

function tokenizeLine(line: string): ReactNode {
  const parts: ReactNode[] = [];
  const re = /("[^"]*"|'[^']*'|`[^`]*`|\b\w+\b|[{}();,=[\]+\-*/%!]|\.|\s+)/g;
  let m: RegExpExecArray | null;
  let key = 0;
  const push = (node: React.ReactNode) => parts.push(<span key={key++}>{node}</span>);

  while ((m = re.exec(line)) !== null) {
    const t = m[0];
    if (/^\s+$/.test(t)) {
      push(t);
      continue;
    }
    if (/^["'`]/.test(t)) {
      push(<span className="text-emerald-400">{t}</span>);
      continue;
    }
    if (/^\d+$/.test(t)) {
      push(<span className="text-orange-300">{t}</span>);
      continue;
    }
    if (KW.has(t)) {
      push(<span className="text-violet-400">{t}</span>);
      continue;
    }
    if ('{}();,=[]+-*/%!'.includes(t) || t === '.') {
      push(<span className="text-slate-500">{t}</span>);
      continue;
    }
    push(<span className="text-sky-200">{t}</span>);
  }
  return parts;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const levels: Level[] = [
  {
    id: 1,
    kind: 'whichLine',
    title: 'Cold case: the missing variable',
    briefing:
      'JavaScript remembers every capital letter in a name. One of these lines asks the engine for a name that was never declared — wrong casing.',
    lines: ['let lives = 3;', 'lives = lives - 1;', 'console.log(Lives);'],
    bugLineIndex: 2,
    hint: 'Trace each identifier back to `let`. Does the spelling match exactly?',
    explain:
      'You declared `lives` (lowercase L) but logged `Lives` — a different identifier. The runtime throws ReferenceError: Lives is not defined.',
  },
  {
    id: 2,
    kind: 'whichLine',
    title: 'Health bar bug',
    briefing: 'A mini-game UI shows the wrong health. Find the line where the variable name does not match the declaration.',
    lines: [
      'let playerHp = 100;',
      'playerHp = playerHp - 25;',
      'console.log("HP:", PlayerHp);',
    ],
    bugLineIndex: 2,
    hint: 'Compare `playerHp` on line 1 with what line 3 prints.',
    explain: '`playerHp` and `PlayerHp` are two different names. Same letters, different capitals — still a bug.',
  },
  {
    id: 3,
    kind: 'whatHappens',
    title: 'Predict the runtime',
    briefing: 'No tricks — this snippet is consistent. What actually happens when it runs?',
    code: 'let score = 10;\nscore += 5;\nconsole.log(score);',
    choices: ['Prints 15', 'ReferenceError', 'Prints undefined', 'SyntaxError — file will not run'],
    correctIndex: 0,
    hint: 'Every identifier matches the original `let` line.',
    explain: 'Case matches everywhere, so `score` updates to 15 and the console shows 15.',
  },
  {
    id: 4,
    kind: 'typeFix',
    title: 'Patch the identifier',
    briefing: 'Type the correct variable name so the log reads the value you declared. No semicolons needed in the box — just the name.',
    contextLines: ['let maxHealth = 100;'],
    wrongLine: 'console.log(MaxHealth)',
    correctIdentifier: 'maxHealth',
    hint: 'Declaration uses a lowercase m.',
    explain: '`maxHealth` was declared; `MaxHealth` would be a separate (missing) variable.',
  },
  {
    id: 5,
    kind: 'whichId',
    title: 'Pick the legal reference',
    briefing: 'After this declaration, only one of these identifiers refers to the same binding.',
    declaration: 'let gameOver = false;',
    options: ['gameOver', 'GameOver', 'gameover', 'GAMEOVER'],
    correct: 'gameOver',
    hint: 'Copy the spelling from `let`, including the capital O.',
    explain: 'Bindings are looked up by exact name. Only `gameOver` hits the variable you created.',
  },
  {
    id: 6,
    kind: 'stringStrict',
    title: 'Strings are picky too',
    briefing: 'String values compare with === character by character, including case.',
    expression: '"Yes" === "yes"',
    choices: ['true — they mean the same thing', 'false — capitals must match exactly'],
    correctIndex: 1,
    hint: 'Y is not y.',
    explain: 'Strict equality compares every character. Different case → false. This bites kids in form validation and passwords.',
  },
  {
    id: 7,
    kind: 'whatLogs',
    title: 'Object property casing',
    briefing: 'Object keys are case-sensitive. Dot notation uses the exact key spelling.',
    code: 'const settings = { apiKey: "secret-99" };\nconsole.log(settings.ApiKey);',
    choices: ['undefined', '"secret-99"', 'ReferenceError', 'null'],
    correctIndex: 0,
    hint: 'There is no property spelled `ApiKey` on this object.',
    explain:
      'The key is `apiKey`. `settings.ApiKey` looks up a different key that does not exist → undefined (no error).',
  },
  {
    id: 8,
    kind: 'whichLine',
    title: 'Function name mismatch',
    briefing: 'You defined a helper, then called it with different casing.',
    lines: [
      'function getTotal() {',
      '  return 42;',
      '}',
      'console.log(GetTotal());',
    ],
    bugLineIndex: 3,
    hint: 'Function declarations create a binding named exactly `getTotal`.',
    explain: '`getTotal` and `GetTotal` are different. The call should be `getTotal()` to match.',
  },
  {
    id: 9,
    kind: 'whatHappens',
    title: 'Silent vs loud failure',
    briefing: 'What does the console show after this runs?',
    code: 'const user = { name: "Ada" };\nconsole.log(user.Name);',
    choices: [
      '"Ada"',
      'undefined',
      'ReferenceError: Name is not defined',
      'SyntaxError',
    ],
    correctIndex: 1,
    hint: 'Property access on a missing key is not the same as using an undeclared variable.',
    explain: '`user` exists; `Name` is just the wrong key → undefined. A ReferenceError is for undeclared variables, not missing properties.',
  },
  {
    id: 10,
    kind: 'stringStrict',
    title: 'Strict vs loose (still about case)',
    briefing: 'Even with ==, string characters must match for equality here.',
    expression: '"A" == "a"',
    choices: ['true', 'false'],
    correctIndex: 1,
    hint: 'Different Unicode code units — uppercase A vs lowercase a.',
    explain: 'For string == string, case still matters. (Loose equality only does type coercion between different types.)',
  },
  {
    id: 11,
    kind: 'whatHappens',
    title: 'Two bindings, one alphabet',
    briefing: 'JavaScript allows this confusing pair. What prints?',
    code: 'let level = 1;\nlet Level = 9;\nconsole.log(level + Level);',
    choices: ['10', '18', 'ReferenceError', 'NaN'],
    correctIndex: 0,
    hint: '`level` and `Level` are two separate variables.',
    explain: 'Case creates two different names: 1 + 9 = 10. Style guides exist partly to avoid this foot-gun.',
  },
  {
    id: 12,
    kind: 'typeFix',
    title: 'camelCase rescue',
    briefing: 'Fix the wrong identifier in the update line.',
    contextLines: ['let totalCoins = 0;', 'totalCoins = totalCoins + 10;'],
    wrongLine: 'console.log(totalcoins)',
    correctIdentifier: 'totalCoins',
    hint: 'The middle C is uppercase in the real name.',
    explain: '`totalcoins` is not declared; `totalCoins` is. camelCase is a pattern, not optional decoration.',
  },
  {
    id: 13,
    kind: 'whichLine',
    title: 'Import-style discipline',
    briefing: 'Imagine modules: you “exported” a name and imported it wrong. Which line breaks?',
    lines: [
      '// pretend: export const fetchData = () => 1;',
      'const data = FetchData();',
    ],
    bugLineIndex: 1,
    hint: 'Exported name was `fetchData` (camelCase, lowercase f).',
    explain: 'Real bundlers behave like this: identifiers must match exactly across files. `FetchData` ≠ `fetchData`.',
  },
  {
    id: 14,
    kind: 'whatLogs',
    title: 'Array methods, same rule',
    briefing: 'Method names on arrays are also case-sensitive.',
    code: 'const nums = [1, 2, 3];\nconsole.log(nums.Push(4));',
    choices: ['[1,2,3,4]', 'undefined', 'TypeError: nums.Push is not a function', '4'],
    correctIndex: 2,
    hint: 'The standard method is `.push` (lowercase p).',
    explain: '`Push` is not a built-in; calling it tries to invoke undefined as a function → TypeError.',
  },
  {
    id: 15,
    kind: 'whichId',
    title: 'Boolean flag',
    briefing: 'Which reference reads the flag you actually declared?',
    declaration: 'let isReady = true;',
    options: ['isReady', 'IsReady', 'isready', 'ISREADY'],
    correct: 'isReady',
    hint: 'Only the first letter of “is” is lowercase; R in Ready is uppercase.',
    explain: 'Boolean names often use is/has/can prefixes — still case-sensitive like any identifier.',
  },
  {
    id: 16,
    kind: 'whichLine',
    title: 'Case investigator — final file',
    briefing: 'Scan the whole snippet. One line uses a name that does not match an earlier declaration.',
    lines: [
      'const maxRetries = 3;',
      'let attempt = 0;',
      'attempt = attempt + 1;',
      'if (attempt < maxretries) {',
      '  console.log("try again");',
      '}',
    ],
    bugLineIndex: 3,
    hint: 'Compare `maxRetries` (line 1) to the condition on line 4.',
    explain: '`maxretries` is not defined — different from `maxRetries`. A common typo when typing quickly.',
  },
];

export default function CaseInvestigatorPage() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [typed, setTyped] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [wrongLineFlash, setWrongLineFlash] = useState<number | null>(null);
  const [consoleMsg, setConsoleMsg] = useState<string | null>(null);
  const [lastPoints, setLastPoints] = useState(0);

  const level = levels[idx];

  const whichIdOptions = useMemo(() => {
    if (level.kind !== 'whichId') return [];
    return shuffle(level.options);
  }, [level]);

  const levelKey = `${level.id}-${level.kind}`;

  useEffect(() => {
    setTyped('');
    setFeedback('idle');
    setHintOpen(false);
    setWrongLineFlash(null);
    setConsoleMsg(null);
  }, [idx, levelKey]);

  const award = useCallback(() => {
    setStreak((s) => {
      const next = s + 1;
      const mult = 1 + Math.min(next - 1, 5) * 0.1;
      const gained = Math.round(100 * mult);
      setLastPoints(gained);
      setBestStreak((b) => Math.max(b, next));
      setScore((sc) => sc + gained);
      return next;
    });
    setFeedback('correct');
    recordAnswer(true);
    addStars(2);
    incrementGamesPlayed();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2400);
  }, [addStars, incrementGamesPlayed, recordAnswer]);

  const penalize = useCallback(
    (msg?: string) => {
      setFeedback('wrong');
      setStreak(0);
      recordAnswer(false);
      if (msg) setConsoleMsg(msg);
      setTimeout(() => {
        setFeedback('idle');
        setConsoleMsg(null);
      }, 1400);
    },
    [recordAnswer]
  );

  const nextLevel = () => {
    if (idx < levels.length - 1) {
      setIdx((i) => i + 1);
    } else {
      router.push('/games/programming');
    }
  };

  const onPickLine = (lineIndex: number) => {
    if (feedback === 'correct' || level.kind !== 'whichLine') return;
    if (lineIndex === level.bugLineIndex) {
      setConsoleMsg('> ReferenceError avoided — nice catch.');
      award();
    } else {
      setWrongLineFlash(lineIndex);
      setTimeout(() => setWrongLineFlash(null), 600);
      penalize('> That line is consistent. Look for a mismatched identifier.');
    }
  };

  const onPickChoice = (choiceIndex: number) => {
    if (feedback === 'correct') return;
    if (level.kind === 'whatHappens' || level.kind === 'whatLogs' || level.kind === 'stringStrict') {
      if (choiceIndex === level.correctIndex) {
        setConsoleMsg('> Correct prediction.');
        award();
      } else {
        penalize('> Not quite — compare identifiers and keys character by character.');
      }
    }
  };

  const onPickId = (opt: string) => {
    if (feedback === 'correct' || level.kind !== 'whichId') return;
    if (opt === level.correct) {
      setConsoleMsg('> Binding resolved.');
      award();
    } else {
      penalize('> That name does not point at the same variable.');
    }
  };

  const onSubmitFix = () => {
    if (feedback === 'correct' || level.kind !== 'typeFix') return;
    if (typed.trim() === level.correctIdentifier) {
      setConsoleMsg('> Patch applied. Build green.');
      award();
    } else {
      penalize('> Still not the exact identifier from the declaration.');
    }
  };

  const ideBorder = 'border border-emerald-500/20';
  const consoleBorder = 'border border-amber-500/25';

  return (
    <main className="min-h-screen min-h-[100dvh] bg-[#070b10] text-slate-200 p-3 sm:p-5 md:p-8 relative overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(52,211,153,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(52,211,153,0.3) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      <Confetti show={showConfetti} />

      <header className="max-w-5xl mx-auto relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
        <motion.button
          type="button"
          onClick={() => router.push('/games/programming')}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white min-h-[44px]"
          whileTap={{ scale: 0.98 }}
        >
          ← Code Quest
        </motion.button>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-cyan-200">
            Case <span className="text-white font-semibold">10–14</span>
          </span>
          <span className="rounded-lg border border-white/15 bg-black/40 px-3 py-1.5">
            File <span className="text-white font-mono">{idx + 1}/{levels.length}</span>
          </span>
          <span className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1.5">
            Score <span className="text-white font-mono">{score}</span>
          </span>
          <span className="rounded-lg border border-white/10 px-3 py-1.5 text-slate-400">
            Streak <span className="text-amber-300 font-mono">{streak}</span>
            {bestStreak > 0 && <span className="text-slate-500"> (best {bestStreak})</span>}
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="mb-6 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90 mb-2">Syntax forensics</p>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Case Investigator</h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Real-style JavaScript snippets. Read like the runtime: identifiers, keys, and methods must match{' '}
            <span className="text-slate-300">exactly</span> — including capitals.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Younger learners: play{' '}
            <button
              type="button"
              onClick={() => router.push('/games/programming/case-sense')}
              className="text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-2"
            >
              Twin Key Academy
            </button>{' '}
            first.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
          <motion.section
            key={levelKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl bg-[#0c1219] p-4 sm:p-5 shadow-xl shadow-black/40 ${ideBorder}`}
          >
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <span className="text-xs text-slate-500 font-mono">investigator.js</span>
              <span className="text-[10px] uppercase tracking-wider text-emerald-500/80">read only</span>
            </div>

            {level.kind === 'whichLine' && (
              <div>
                <SyntaxCode code={level.lines.join('\n')} />
                <p className="mt-4 text-sm text-slate-400">Tap the line number with the case mistake.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {level.lines.map((_, i) => (
                    <motion.button
                      key={i}
                      type="button"
                      disabled={feedback === 'correct'}
                      onClick={() => onPickLine(i)}
                      className={`min-h-[44px] rounded-lg border px-4 py-2 font-mono text-sm transition-colors ${
                        wrongLineFlash === i
                          ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                          : 'border-white/20 bg-white/5 hover:border-emerald-400/50 hover:bg-emerald-500/10'
                      } disabled:opacity-40`}
                      whileTap={{ scale: 0.97 }}
                    >
                      Line {i + 1}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {(level.kind === 'whatHappens' || level.kind === 'whatLogs') && (
              <div>
                <SyntaxCode code={level.code} />
              </div>
            )}

            {level.kind === 'stringStrict' && (
              <div className="rounded-xl bg-black/50 border border-white/10 p-4">
                <p className="text-xs text-slate-500 mb-2">Expression</p>
                <code className="text-lg sm:text-xl text-amber-200 font-mono">{level.expression}</code>
              </div>
            )}

            {level.kind === 'whichId' && (
              <div>
                <p className="text-sm text-slate-400 mb-2">Declaration</p>
                <div className="rounded-xl bg-black/50 border border-violet-500/20 p-3 font-mono text-violet-100 mb-4">
                  {level.declaration}
                </div>
              </div>
            )}

            {level.kind === 'typeFix' && (
              <div>
                {level.contextLines.map((l, i) => (
                  <div key={i} className="font-mono text-sm text-slate-300 mb-1">
                    {l}
                  </div>
                ))}
                <p className="mt-2 text-xs uppercase tracking-wider text-rose-400/90">Buggy line</p>
                <div className="mt-1 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 font-mono text-sm text-rose-100">
                  {level.wrongLine}
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Type the identifier that should appear inside the parentheses so it matches your declaration.
                </p>
              </div>
            )}
          </motion.section>

          <section className={`rounded-2xl bg-[#0c1219] p-4 sm:p-5 flex flex-col ${consoleBorder}`}>
            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs text-amber-200/90 font-mono uppercase tracking-wider">Console + brief</span>
            </div>

            <h2 className="text-lg font-semibold text-white mb-2">{level.title}</h2>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">{level.briefing}</p>

            <AnimatePresence mode="wait">
              {consoleMsg && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 rounded-lg bg-black/60 border border-white/10 p-3 font-mono text-xs text-amber-100/90"
                >
                  {consoleMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {(level.kind === 'whatHappens' || level.kind === 'whatLogs' || level.kind === 'stringStrict') && (
              <div className="space-y-2 flex-1">
                <p className="text-xs uppercase text-slate-500 mb-2">Choose</p>
                {level.choices.map((c, i) => (
                  <motion.button
                    key={c}
                    type="button"
                    disabled={feedback === 'correct'}
                    onClick={() => onPickChoice(i)}
                    className="w-full text-left rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm hover:border-amber-400/40 hover:bg-amber-500/5 disabled:opacity-40 min-h-[48px]"
                    whileTap={{ scale: 0.99 }}
                  >
                    {c}
                  </motion.button>
                ))}
              </div>
            )}

            {level.kind === 'whichId' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                {whichIdOptions.map((opt) => (
                  <motion.button
                    key={opt}
                    type="button"
                    disabled={feedback === 'correct'}
                    onClick={() => onPickId(opt)}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-4 font-mono text-base hover:border-violet-400/40 disabled:opacity-40 min-h-[52px] text-left"
                    whileTap={{ scale: 0.98 }}
                  >
                    {opt}
                  </motion.button>
                ))}
              </div>
            )}

            {level.kind === 'typeFix' && (
              <div className="flex-1 flex flex-col gap-3">
                <label className="text-xs text-slate-500" htmlFor="fix-id">
                  Correct identifier
                </label>
                <input
                  id="fix-id"
                  autoComplete="off"
                  spellCheck={false}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSubmitFix()}
                  disabled={feedback === 'correct'}
                  className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 font-mono text-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                  placeholder="type here"
                />
                <motion.button
                  type="button"
                  onClick={onSubmitFix}
                  disabled={feedback === 'correct' || !typed.trim()}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-3 font-semibold text-white disabled:opacity-40 min-h-[48px]"
                  whileTap={{ scale: 0.99 }}
                >
                  Run checks
                </motion.button>
              </div>
            )}

            <div className="mt-auto pt-4 flex flex-wrap gap-2 justify-between items-center border-t border-white/10">
              <button
                type="button"
                onClick={() => setHintOpen((v) => !v)}
                className="text-sm text-amber-400/90 hover:text-amber-300"
              >
                {hintOpen ? 'Hide hint' : 'Hint'}
              </button>
              {hintOpen && <p className="w-full text-sm text-slate-500">{level.hint}</p>}
            </div>

            <AnimatePresence>
              {feedback === 'correct' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4"
                >
                  <p className="text-emerald-200 font-semibold text-sm mb-2">Case closed (+{lastPoints} pts this round)</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{level.explain}</p>
                  <motion.button
                    type="button"
                    onClick={nextLevel}
                    className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white min-h-[48px]"
                    whileTap={{ scale: 0.98 }}
                  >
                    {idx < levels.length - 1 ? 'Next case →' : 'Return to hub'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </main>
  );
}
