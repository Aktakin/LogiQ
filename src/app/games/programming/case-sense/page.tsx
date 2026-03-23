'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';

type ChallengeKind = 'pickExact' | 'findIntruder' | 'typeExact' | 'sameOrDifferent';

interface Level {
  id: number;
  title: string;
  story: string;
  kind: ChallengeKind;
  /** Correct identifier or string for pick/type */
  target: string;
  /** Wrong options for pickExact (target not listed here — merged in UI) */
  distractors: string[];
  /** For findIntruder: the three “normal” tiles and the one wrong-case tile */
  intruderMajority?: string;
  intruderWrong?: string;
  /** For sameOrDifferent */
  compareA?: string;
  compareB?: string;
  /** True if they are byte-for-byte the same */
  actuallySame?: boolean;
  teachTip: string;
  hint: string;
}

const levels: Level[] = [
  {
    id: 1,
    title: 'The picky lock',
    story:
      'Your space crate has a digital lock. It only opens if you tap the label that matches the glowing key — letter for letter, capitals included!',
    kind: 'pickExact',
    target: 'cat',
    distractors: ['Cat', 'cAt', 'CAT'],
    teachTip: 'A big C and a small c are different keys in code, just like different shapes on a real key.',
    hint: 'Match every letter: small c, small a, small t.',
  },
  {
    id: 2,
    title: 'Twin letters',
    story: 'The robot pet answers only to the name on its collar. Pick the collar that matches exactly.',
    kind: 'pickExact',
    target: 'Zoe',
    distractors: ['zoe', 'ZOe', 'ZOE'],
    teachTip: 'Zoe, zoe, and ZOE look related to us — to a computer they are three different names.',
    hint: 'Notice the big Z and big O — copy that pattern.',
  },
  {
    id: 3,
    title: 'Camel on the moon',
    story: 'CamelCase names are common in code: humps are capitals. Tap the exact spell.',
    kind: 'pickExact',
    target: 'myShip',
    distractors: ['MyShip', 'myship', 'MYShip'],
    teachTip: 'camelCase means a little “hump” (capital letter) in the middle — my + Ship → myShip.',
    hint: 'Lowercase my, then uppercase S in Ship.',
  },
  {
    id: 4,
    title: 'Intruder alert',
    story: 'Three keys match the blueprint. One sneaky key is almost the same but wrong — find it!',
    kind: 'findIntruder',
    target: '',
    distractors: [],
    intruderMajority: 'run',
    intruderWrong: 'Run',
    teachTip: 'Spot the odd one: same letters but a different capital can break your program.',
    hint: 'Three say run with a small r. One starts with a big R.',
  },
  {
    id: 5,
    title: 'Score board mix-up',
    story: 'The scoreboard printed four labels. Three are identical copies — tap the one that does not match the others.',
    kind: 'findIntruder',
    target: '',
    distractors: [],
    intruderMajority: 'Score',
    intruderWrong: 'score',
    teachTip: 'Score and score share letters but are not the same label — case is part of the spelling.',
    hint: 'Look at the very first letter: S big or small?',
  },
  {
    id: 6,
    title: 'After let…',
    story: 'You wrote: let playerOne = 1; Later you must use the exact same spelling. Which name reaches that variable?',
    kind: 'pickExact',
    target: 'playerOne',
    distractors: ['PlayerOne', 'playerone', 'PLAYERONE'],
    teachTip: 'After you “let” a name, you have to reuse that exact name — capitals in the same places.',
    hint: 'Match the let line: small p, then a big O in One.',
  },
  {
    id: 7,
    title: 'Truly the same',
    story: 'When every character matches — including capitals — the computer says it is one and the same name.',
    kind: 'sameOrDifferent',
    target: '',
    distractors: [],
    compareA: 'mode',
    compareB: 'mode',
    actuallySame: true,
    teachTip: 'Exact match means exact match. Same spelling, same capitals → same variable name.',
    hint: 'Compare letter by letter. Is anything different?',
  },
  {
    id: 8,
    title: 'Same box?',
    story: 'In code, variable names are picky. Are these two names the same box of data?',
    kind: 'sameOrDifferent',
    target: '',
    distractors: [],
    compareA: 'frog',
    compareB: 'Frog',
    actuallySame: false,
    teachTip: 'If even one letter’s size is wrong, it is a different name — like two different lockers.',
    hint: 'f versus F at the start — same locker or not?',
  },
  {
    id: 9,
    title: 'Type the spell',
    story: 'No multiple choice — type the key exactly. Spaces count, so don’t add any!',
    kind: 'typeExact',
    target: 'code',
    distractors: [],
    teachTip: 'Typing practice: the computer compares your text character by character.',
    hint: 'All lowercase: c o d e',
  },
  {
    id: 10,
    title: 'Big and small mix',
    story: 'Mixed capitals are tricky — that is why this matters. Type what you see.',
    kind: 'typeExact',
    target: 'HiThere',
    distractors: [],
    teachTip: 'Many languages use names that mix capitals on purpose — you must copy them exactly.',
    hint: 'Big H, small i, big T, rest small: HiThere',
  },
  {
    id: 11,
    title: 'Secret handshake',
    story: 'The door wants this passphrase typed perfectly.',
    kind: 'typeExact',
    target: 'openSesame',
    distractors: [],
    teachTip: 'Passphrases in lessons are like passwords: one wrong letter or capital and access denied.',
    hint: 'Lowercase open, then big S in Sesame.',
  },
  {
    id: 12,
    title: 'Four twins',
    story: 'Again: three tiles match each other. Catch the one intruder.',
    kind: 'findIntruder',
    target: '',
    distractors: [],
    intruderMajority: 'secretKey',
    intruderWrong: 'secretkey',
    teachTip: 'Long names still follow the rule: secretKey and secretkey are different keys.',
    hint: 'Find where the capital K disappeared.',
  },
  {
    id: 13,
    title: 'Graduation key',
    story: 'Final challenge: type the name of your learning quest — capitals exactly where they belong!',
    kind: 'typeExact',
    target: 'LogiQuest',
    distractors: [],
    teachTip: 'You trained your eyes and fingers — in real code, typos in capitals cause “not defined” bugs.',
    hint: 'Big L, big Q in LogiQuest.',
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function CaseSparkle({ text }: { text: string }) {
  return (
    <span className="font-mono text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide break-all">
      {text.split('').map((ch, i) => {
        const isUpper = /[A-Z]/.test(ch);
        const isLower = /[a-z]/.test(ch);
        let cls = 'text-slate-300';
        if (isUpper) cls = 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.45)]';
        else if (isLower) cls = 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.35)]';
        return (
          <span key={`${i}-${ch}`} className={cls}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}

export default function TwinKeyAcademyPage() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const [levelIndex, setLevelIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [wrongShake, setWrongShake] = useState(0);

  const level = levels[levelIndex];

  const pickOptions = useMemo(() => {
    if (level.kind !== 'pickExact') return [];
    return shuffle([level.target, ...level.distractors]);
  }, [level]);

  const intruderOptions = useMemo(() => {
    if (level.kind !== 'findIntruder' || !level.intruderMajority || !level.intruderWrong) return [];
    return shuffle([
      level.intruderWrong,
      level.intruderMajority,
      level.intruderMajority,
      level.intruderMajority,
    ]);
  }, [level]);

  useEffect(() => {
    setTyped('');
    setFeedback('idle');
    setShowTip(false);
  }, [levelIndex, level.kind, level.target]);

  const triggerWrong = useCallback(() => {
    setFeedback('wrong');
    recordAnswer(false);
    setWrongShake((n) => n + 1);
    setTimeout(() => setFeedback('idle'), 900);
  }, [recordAnswer]);

  const triggerCorrect = useCallback(() => {
    setFeedback('correct');
    recordAnswer(true);
    addStars(2);
    incrementGamesPlayed();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2800);
  }, [addStars, incrementGamesPlayed, recordAnswer]);

  const goNext = () => {
    if (levelIndex < levels.length - 1) {
      setLevelIndex((i) => i + 1);
    } else {
      router.push('/games/programming');
    }
  };

  const handlePickExact = (choice: string) => {
    if (feedback === 'correct') return;
    if (choice === level.target) {
      triggerCorrect();
    } else {
      triggerWrong();
    }
  };

  const handleIntruder = (choice: string) => {
    if (feedback === 'correct') return;
    if (choice === level.intruderWrong) {
      triggerCorrect();
    } else {
      triggerWrong();
    }
  };

  const handleSameDifferent = (pickedSame: boolean) => {
    if (feedback === 'correct') return;
    const correct = pickedSame === level.actuallySame;
    if (correct) {
      triggerCorrect();
    } else {
      triggerWrong();
    }
  };

  const handleSubmitType = () => {
    if (feedback === 'correct') return;
    if (typed === level.target) {
      triggerCorrect();
    } else {
      triggerWrong();
    }
  };

  const accent = '#e879f9';
  const accent2 = '#22d3ee';

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-4 md:p-8 relative overflow-hidden">
      <FloatingShapes />
      <Confetti show={showConfetti} />

      <header className="max-w-3xl mx-auto mb-4 sm:mb-6 relative z-10 flex flex-wrap items-center justify-between gap-3">
        <motion.button
          type="button"
          onClick={() => router.push('/games/programming')}
          className="glass px-4 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors min-h-[44px] touch-target text-sm sm:text-base"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          ← Back to Code Quest
        </motion.button>
        <div
          className="glass rounded-xl px-4 py-2 border text-sm"
          style={{ borderColor: `${accent}40` }}
        >
          <span className="text-gray-400">Level </span>
          <span className="text-white font-bold">{levelIndex + 1}</span>
          <span className="text-gray-500"> / {levels.length}</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-5xl sm:text-6xl mb-2" aria-hidden>
            🔑
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400">
              Twin Key Academy
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
            Computers treat capitals and lowercase as totally different letters. Train your eyes and fingers to be exact!
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-fuchsia-500/40 bg-fuchsia-500/15 px-3 py-1 text-xs font-semibold text-fuchsia-200">
              Great for ages ~6–9
            </span>
            <motion.button
              type="button"
              onClick={() => router.push('/games/programming/case-investigator')}
              className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Ages 10–14 → Case Investigator
            </motion.button>
          </div>
        </motion.div>

        <motion.article
          key={level.id}
          className="glass rounded-2xl p-4 sm:p-6 border border-white/10 mb-6"
          style={{ boxShadow: `0 0 40px ${accent}12` }}
          animate={wrongShake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.45 }}
        >
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">{level.title}</h2>
          <p className="text-gray-300 text-sm sm:text-base mb-4 leading-relaxed">{level.story}</p>

          {level.kind === 'pickExact' && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-fuchsia-300/90 mb-2">Match this key</p>
              <div className="rounded-xl bg-black/35 border border-fuchsia-500/30 px-4 py-4 text-center">
                <CaseSparkle text={level.target} />
              </div>
            </div>
          )}

          {level.kind === 'findIntruder' && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-cyan-300/90 mb-2">Tap the one that does not match the other three</p>
              <p className="text-gray-400 text-sm">Three twins, one trickster — wrong capital counts as different.</p>
            </div>
          )}

          {level.kind === 'sameOrDifferent' && (
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <div className="rounded-xl bg-black/35 border border-white/15 px-4 py-3">
                <CaseSparkle text={level.compareA ?? ''} />
              </div>
              <span className="text-gray-500 text-lg">and</span>
              <div className="rounded-xl bg-black/35 border border-white/15 px-4 py-3">
                <CaseSparkle text={level.compareB ?? ''} />
              </div>
            </div>
          )}

          {level.kind === 'typeExact' && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wider text-amber-200/90 mb-2">Type exactly (watch capitals)</p>
              <div className="rounded-xl bg-black/35 border border-amber-500/25 px-4 py-3 mb-3 text-center">
                <CaseSparkle text={level.target} />
              </div>
              <label className="sr-only" htmlFor="twin-key-input">
                Type the key exactly
              </label>
              <input
                id="twin-key-input"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitType();
                }}
                disabled={feedback === 'correct'}
                className="w-full rounded-xl bg-white/5 border border-white/20 px-4 py-3 font-mono text-lg text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 disabled:opacity-60"
                placeholder="Type here…"
              />
            </div>
          )}

          <div className="space-y-3">
            {level.kind === 'pickExact' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pickOptions.map((opt) => (
                  <motion.button
                    key={opt}
                    type="button"
                    disabled={feedback === 'correct'}
                    onClick={() => handlePickExact(opt)}
                    className="rounded-xl border-2 px-4 py-4 font-mono text-lg text-left transition-colors min-h-[52px] bg-white/5 border-white/20 hover:border-fuchsia-400/60 hover:bg-fuchsia-500/10 disabled:opacity-50"
                    whileTap={{ scale: 0.98 }}
                  >
                    <CaseSparkle text={opt} />
                  </motion.button>
                ))}
              </div>
            )}

            {level.kind === 'findIntruder' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {intruderOptions.map((opt, idx) => (
                  <motion.button
                    key={`${opt}-${idx}`}
                    type="button"
                    disabled={feedback === 'correct'}
                    onClick={() => handleIntruder(opt)}
                    className="rounded-xl border-2 px-4 py-4 font-mono text-lg text-left transition-colors min-h-[52px] bg-white/5 border-white/20 hover:border-cyan-400/60 hover:bg-cyan-500/10 disabled:opacity-50"
                    whileTap={{ scale: 0.98 }}
                  >
                    <CaseSparkle text={opt} />
                  </motion.button>
                ))}
              </div>
            )}

            {level.kind === 'sameOrDifferent' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  disabled={feedback === 'correct'}
                  onClick={() => handleSameDifferent(true)}
                  className="rounded-xl border-2 px-4 py-4 text-base font-semibold bg-white/5 border-white/20 hover:border-emerald-400/50 hover:bg-emerald-500/10 disabled:opacity-50 min-h-[52px]"
                  whileTap={{ scale: 0.98 }}
                >
                  Yes — same name
                </motion.button>
                <motion.button
                  type="button"
                  disabled={feedback === 'correct'}
                  onClick={() => handleSameDifferent(false)}
                  className="rounded-xl border-2 px-4 py-4 text-base font-semibold bg-white/5 border-white/20 hover:border-rose-400/50 hover:bg-rose-500/10 disabled:opacity-50 min-h-[52px]"
                  whileTap={{ scale: 0.98 }}
                >
                  No — different names
                </motion.button>
              </div>
            )}

            {level.kind === 'typeExact' && (
              <motion.button
                type="button"
                onClick={handleSubmitType}
                disabled={feedback === 'correct' || !typed}
                className="w-full rounded-xl py-3.5 font-bold text-white disabled:opacity-40 min-h-[48px]"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent2})`,
                  boxShadow: `0 8px 32px ${accent}33`,
                }}
                whileHover={{ scale: feedback === 'correct' || !typed ? 1 : 1.02 }}
                whileTap={{ scale: feedback === 'correct' || !typed ? 1 : 0.98 }}
              >
                Check my spelling
              </motion.button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {feedback === 'wrong' && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-center text-rose-300 text-sm font-medium"
              >
                Not exact — in code, every capital matters. Peek at the hint below!
              </motion.p>
            )}
            {feedback === 'correct' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4"
              >
                <p className="text-emerald-200 font-semibold mb-2">Perfect match! 🔓</p>
                <p className="text-gray-300 text-sm leading-relaxed">{level.teachTip}</p>
                <motion.button
                  type="button"
                  onClick={goNext}
                  className="mt-4 w-full rounded-xl py-3 font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors min-h-[48px]"
                  whileTap={{ scale: 0.98 }}
                >
                  {levelIndex < levels.length - 1 ? 'Next level →' : 'Back to Code Quest'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => setShowTip((v) => !v)}
              className="text-sm text-fuchsia-300/90 hover:text-fuchsia-200 underline-offset-2 hover:underline"
            >
              {showTip ? 'Hide hint' : 'Need a hint?'}
            </button>
          </div>
          <AnimatePresence>
            {showTip && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-gray-400 text-sm mt-2 text-center"
              >
                {level.hint}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.article>

        <p className="text-center text-xs text-gray-600 max-w-md mx-auto">
          Golden glow = uppercase letters. Cyan glow = lowercase. Same letter, different size = different key.
        </p>
      </div>
    </main>
  );
}
