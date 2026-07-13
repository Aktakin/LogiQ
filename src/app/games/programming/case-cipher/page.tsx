'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import FloatingShapes from '@/components/FloatingShapes';
import Confetti from '@/components/Confetti';

const STORAGE_KEY_BEST_MS = 'kidsapp-case-cipher-best-ms';
const STORAGE_KEY_HIGH_SCORE = 'kidsapp-case-cipher-high-score';

/** After this many successful cracks in one run, drop cyan/emerald case hints — everything one green. */
const SUCCESSES_BEFORE_COLOR_LOCK = 5;

/** Multiply round points into displayed “USD” for a juicy on-screen haul (still fiction / game). */
const DOLLARS_PER_POINT = 48;

/** Session points removed on each wrong full-length password try (wallet can go negative). */
const FAIL_PENALTY_POINTS = 40;

function formatHaul(points: number): string {
  const usd = points * DOLLARS_PER_POINT;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(usd);
}

/** Solve in under this many ms to earn points; at or above → 0 for this round. */
const SCORE_TIME_LIMIT_MS = 14000;

/** Maximum points for an instant solve (linearly down to 0 at SCORE_TIME_LIMIT_MS). */
const MAX_POINTS_PER_ROUND = 550;

/**
 * Very common-style compound tokens (camelCase + snake_case) — weighted heavily in picks.
 */
const COMMON_TOKENS = [
  // camelCase — typical JS / API names
  'userName',
  'firstName',
  'lastName',
  'isActive',
  'isValid',
  'hasError',
  'getUserId',
  'setItemCount',
  'totalPrice',
  'orderId',
  'createdAt',
  'updatedAt',
  'maxLength',
  'minValue',
  'defaultTheme',
  'primaryKey',
  'fileName',
  'filePath',
  'homePage',
  'signUp',
  'logOut',
  'userId',
  'apiRoute',
  'dbConnection',
  'errorCode',
  'retryCount',
  'accessToken',
  'refreshToken',
  'isLoading',
  'isEnabled',
  'buttonText',
  'pageTitle',
  'menuItem',
  'cartTotal',
  'shippingAddress',
  'billingZip',
  'phoneNumber',
  'emailAddress',
  'darkMode',
  'fullScreen',
  'copyToClipboard',
  'parseJson',
  'sendRequest',
  'handleClick',
  'onSubmit',
  'currentUser',
  'nextPage',
  'prevPage',
  'sortOrder',
  'filterBy',
  'searchQuery',
  'dateFormat',
  'timeZone',
  'localeCode',
  'httpClient',
  'webSocket',
  'cacheKey',
  'sessionId',
  'rowCount',
  'columnIndex',
  'isChecked',
  'readOnly',
  'placeholderText',
  'inputValue',
  'formData',
  'buildNumber',
  'releaseNotes',
  // snake_case — env vars, DB, Python-y style
  'user_name',
  'first_name',
  'last_name',
  'is_active',
  'is_valid',
  'order_id',
  'created_at',
  'updated_at',
  'api_key',
  'access_token',
  'error_message',
  'max_retries',
  'total_count',
  'page_size',
  'sort_field',
  'search_query',
  'file_name',
  'file_path',
  'home_page',
  'user_id',
  'session_id',
  'db_host',
  'db_name',
  'log_level',
  'time_zone',
  'phone_number',
  'email_address',
  'billing_zip',
  'shipping_city',
  'cart_total',
  'retry_delay',
  'cache_ttl',
  'rate_limit',
  'web_hook',
  'client_secret',
  'public_key',
  'private_key',
  'batch_size',
  'row_limit',
  'is_deleted',
  'has_permission',
  'read_only',
  'dark_mode',
  'full_screen',
  // DOM / React-style & dotted names (exact punctuation matters)
  'onClick',
  'getElementById',
  'camelCasing',
  'self.player',
  'console.log',
  // Real-world compound names
  'sportsInstitute',
  'youthCamps',
  'YouthComputers',
];

/** Rarer / punchier tokens — still valid challenges */
const MIXED_TOKENS = [
  'Password',
  'OpenDoor',
  'ACCESS',
  'RootAccess',
  'HelloWorld',
  'CaseTest',
  'API_TOKEN',
  'LogiQuest',
  'adminKey',
  'loginUser',
  'secretKey',
  'maxRetries',
  'getData',
];

const COMMON_PICK_WEIGHT = 0.78;

function computeRoundPoints(timeMs: number): number {
  if (timeMs >= SCORE_TIME_LIMIT_MS) return 0;
  return Math.round(MAX_POINTS_PER_ROUND * (1 - timeMs / SCORE_TIME_LIMIT_MS));
}

function pickWord(exclude?: string): string {
  const pool = Math.random() < COMMON_PICK_WEIGHT ? COMMON_TOKENS : MIXED_TOKENS;
  if (pool.length <= 1) return pool[0];
  let w = pool[Math.floor(Math.random() * pool.length)];
  let guard = 0;
  while (w === exclude && guard++ < 40) {
    const p = Math.random() < COMMON_PICK_WEIGHT ? COMMON_TOKENS : MIXED_TOKENS;
    w = p[Math.floor(Math.random() * p.length)];
  }
  return w;
}

function CipherChars({ text, showCaseColors }: { text: string; showCaseColors: boolean }) {
  return (
    <span className="font-mono text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[0.12em] sm:tracking-[0.18em] break-all transition-colors duration-700 select-none">
      {text.split('').map((ch, i) => {
        if (!showCaseColors) {
          // Hard mode (5+ successes this run): one green for all letters — no cyan vs emerald split.
          return (
            <span
              key={`${i}-${ch}`}
              className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.25)]"
            >
              {ch}
            </span>
          );
        }
        const isUpper = /[A-Z]/.test(ch);
        const isLower = /[a-z]/.test(ch);
        let cls = 'text-slate-400';
        if (ch === '_') cls = 'text-slate-500';
        if (isUpper) cls = 'text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.35)]';
        else if (isLower) cls = 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]';
        return (
          <span key={`${i}-${ch}`} className={cls}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}

type Phase = 'intro' | 'running' | 'solved';

export default function CaseCipherPage() {
  const router = useRouter();
  const { recordAnswer, addStars, incrementGamesPlayed } = useGameStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [target, setTarget] = useState('');
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [lastTimeMs, setLastTimeMs] = useState<number | null>(null);
  const [bestMs, setBestMs] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<'none' | 'ok' | 'deny'>('none');
  const [shake, setShake] = useState(0);
  const [round, setRound] = useState(0);
  const [denyCount, setDenyCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  /** Successful cracks this session; at >= SUCCESSES_BEFORE_COLOR_LOCK, case hints turn off for new rounds. */
  const [sessionSuccessCount, setSessionSuccessCount] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [lastRoundPoints, setLastRoundPoints] = useState<number | null>(null);
  const [highScore, setHighScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BEST_MS);
      if (raw != null) {
        const n = Number(raw);
        if (!Number.isNaN(n) && n > 0) setBestMs(n);
      }
      const hs = localStorage.getItem(STORAGE_KEY_HIGH_SCORE);
      if (hs != null) {
        const n = Number(hs);
        if (!Number.isNaN(n) && n >= 0) setHighScore(n);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (phase !== 'running' || startTime == null) return;
    const id = window.setInterval(() => setClock(Date.now()), 48);
    return () => clearInterval(id);
  }, [phase, startTime]);

  const caseColorHintsActive = sessionSuccessCount < SUCCESSES_BEFORE_COLOR_LOCK;
  const cracksUntilHardMode = Math.max(0, SUCCESSES_BEFORE_COLOR_LOCK - sessionSuccessCount);

  const liveMs =
    phase === 'running' && startTime != null
      ? Math.max(0, clock - startTime)
      : lastTimeMs ?? 0;

  const nextAfterSolve = useCallback(() => {
    const t = Date.now();
    setClock(t);
    setTyped('');
    setFeedback('none');
    setPhase('running');
    setStartTime(t);
    setTarget((prev) => pickWord(prev));
    setLastTimeMs(null);
    setLastRoundPoints(null);
    setDenyCount(0);
    setRound((r) => r + 1);
    queueMicrotask(() => inputRef.current?.focus());
  }, []);

  const onInput = (value: string) => {
    if (phase !== 'running' || !target) return;
    setTyped(value);
    if (value.length < target.length) {
      setFeedback('none');
      return;
    }
    if (value.length > target.length) {
      setTyped(value.slice(0, target.length));
      return;
    }
    const end = Date.now();
    const tMs = startTime != null ? end - startTime : 0;
    if (value === target) {
      setSessionSuccessCount((c) => c + 1);
      setLastTimeMs(tMs);
      const pts = computeRoundPoints(tMs);
      setLastRoundPoints(pts);
      setSessionScore((s) => {
        const next = s + pts;
        setHighScore((hs) => {
          if (next > hs) {
            try {
              localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(next));
            } catch {
              /* ignore */
            }
            return next;
          }
          return hs;
        });
        return next;
      });
      setPhase('solved');
      setFeedback('ok');
      recordAnswer(true);
      if (pts > 0) {
        const stars = pts >= 350 ? 3 : pts >= 150 ? 2 : 1;
        addStars(stars);
      }
      incrementGamesPlayed();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2200);
      try {
        setBestMs((prev) => {
          if (prev == null || tMs < prev) {
            localStorage.setItem(STORAGE_KEY_BEST_MS, String(tMs));
            return tMs;
          }
          return prev;
        });
      } catch {
        /* ignore */
      }
    } else {
      setFeedback('deny');
      setSessionScore((s) => s - FAIL_PENALTY_POINTS);
      setDenyCount((c) => c + 1);
      setShake((s) => s + 1);
      setTyped('');
      recordAnswer(false);
    }
  };

  const idleStart = () => {
    const t = Date.now();
    setClock(t);
    setTarget((prev) => pickWord(prev || undefined));
    setTyped('');
    setFeedback('none');
    setPhase('running');
    setStartTime(t);
    setLastTimeMs(null);
    setLastRoundPoints(null);
    setDenyCount(0);
    setSessionScore(0);
    setSessionSuccessCount(0);
    setRound(1);
    queueMicrotask(() => inputRef.current?.focus());
  };

  const scoreDeadlineRemaining =
    phase === 'running' && startTime != null
      ? Math.max(0, SCORE_TIME_LIMIT_MS - (clock - startTime))
      : null;

  return (
    <main className="min-h-screen min-h-[100dvh] p-3 sm:p-6 md:p-8 relative overflow-hidden">
      <FloatingShapes />
      <Confetti show={showConfetti} />

      <header className="max-w-2xl mx-auto relative z-10 flex justify-between items-start gap-3 mb-4">
        <motion.button
          type="button"
          onClick={() => router.push('/games/programming')}
          className="glass px-4 py-2.5 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px] touch-target shrink-0"
          whileTap={{ scale: 0.97 }}
        >
          ← Code Quest
        </motion.button>
      </header>

      {/* Pre-game briefing — case sensitivity, speed, accuracy (fiction framing) */}
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.section
            key="intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="max-w-2xl mx-auto relative z-10 mb-8"
          >
            <div className="glass rounded-2xl border border-cyan-500/25 p-5 sm:p-8 shadow-[0_0_48px_rgba(34,211,238,0.08)]">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-cyan-400/90 mb-2">Mission briefing</p>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Case Cipher — quick brief</h2>
              <div className="text-left text-sm text-slate-300 space-y-3 leading-relaxed">
                <p>
                  Pretend &quot;password crack&quot; for practice: type each token <span className="text-white font-medium">exactly</span>{' '}
                  — capitals matter, like real code (<code className="text-emerald-300/90 font-mono text-[0.85em]">password</code> ≠{' '}
                  <code className="text-emerald-300/90 font-mono text-[0.85em]">Password</code>).
                </p>
                <div className="rounded-xl bg-rose-950/35 border border-rose-500/25 px-3 py-2.5 text-rose-50/95 text-sm">
                  <p className="font-semibold text-white mb-1.5">Rules (fiction)</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <span className="text-white font-medium">Too slow</span> → you get &quot;hacked&quot; (smaller payout).
                    </li>
                    <li>
                      <span className="text-white font-medium">Miss it</span> → you get &quot;hacked&quot; too (trace fees). After{' '}
                      {SUCCESSES_BEFORE_COLOR_LOCK} successful cracks this run, case color hints switch to one green.
                    </li>
                  </ul>
                </div>
                <p className="text-xs text-slate-500">Learning game only — not real hacking.</p>
              </div>
              <motion.button
                type="button"
                onClick={idleStart}
                className="mt-8 w-full sm:w-auto min-h-[52px] rounded-xl py-3.5 px-8 font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                I understand — open the terminal
              </motion.button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Big haul — “money” from cracked passwords (game fiction) */}
      {phase !== 'intro' && (
      <div className="max-w-2xl mx-auto relative z-10 mb-6 sm:mb-8">
        <motion.div
          className={`rounded-2xl border px-4 py-5 sm:px-8 sm:py-7 text-center ${
            sessionScore < 0
              ? 'border-rose-500/40 bg-gradient-to-b from-rose-950/70 via-slate-950/90 to-slate-950/95 shadow-[0_0_60px_rgba(244,63,94,0.12)]'
              : 'border-emerald-500/30 bg-gradient-to-b from-emerald-950/80 via-slate-950/90 to-slate-950/95 shadow-[0_0_60px_rgba(16,185,129,0.12)]'
          }`}
          layout
        >
          <p
            className={`text-[10px] sm:text-xs uppercase tracking-[0.28em] mb-1 ${
              sessionScore < 0 ? 'text-rose-400/90' : 'text-emerald-400/90'
            }`}
          >
            {sessionScore < 0
              ? 'Heist wallet · trace fees eating your haul'
              : 'Heist wallet · siphoned from cracked passwords'}
          </p>
          <p
            className={`font-mono font-black text-4xl sm:text-6xl md:text-7xl leading-none tabular-nums ${
              sessionScore < 0
                ? 'text-rose-300 drop-shadow-[0_0_24px_rgba(251,113,133,0.35)]'
                : 'text-emerald-300 drop-shadow-[0_0_24px_rgba(52,211,153,0.35)]'
            }`}
            aria-live="polite"
          >
            {formatHaul(sessionScore)}
          </p>
          <p className="mt-2 text-[11px] sm:text-xs text-slate-500 max-w-md mx-auto">
            Simulation only — each bad crack costs {formatHaul(FAIL_PENALTY_POINTS)} in trace fees; clean breaks add fictional
            funds.
          </p>
          {highScore > 0 && (
            <p className="mt-3 text-xs text-slate-600">
              Personal best run:{' '}
              <span className="text-amber-400/90 font-mono font-semibold">{formatHaul(highScore)}</span>
            </p>
          )}
        </motion.div>
      </div>
      )}

      <div className={`max-w-lg mx-auto relative z-10 ${phase === 'intro' ? 'hidden' : ''}`}>
        <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-5xl mb-2" aria-hidden>
            🔐
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-cyan-400 to-emerald-400">
              Case Cipher
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Break the password: type the token <span className="text-cyan-200 font-medium">exactly</span>. For your first{' '}
            <span className="text-emerald-300/90 font-medium">{SUCCESSES_BEFORE_COLOR_LOCK} successful cracks</span> this run,
            cyan = uppercase and emerald = lowercase — then it&apos;s all one green (hard mode).
          </p>
        </motion.div>

        <motion.section
          className="glass rounded-2xl p-5 sm:p-8 border border-teal-500/20 text-center shadow-[0_0_40px_rgba(45,212,191,0.08)]"
          animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <p className="text-xs uppercase tracking-[0.2em] text-teal-400/80">Target password</p>
            {phase === 'running' && caseColorHintsActive && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-500/30">
                Case hints ON · {cracksUntilHardMode} more successful crack{cracksUntilHardMode === 1 ? '' : 's'} until hard mode
              </span>
            )}
            {phase === 'running' && !caseColorHintsActive && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/50 text-rose-200 border border-rose-500/35">
                Hard mode — one green for all letters; remember capitals yourself
              </span>
            )}
          </div>

          <div
            className="min-h-[3.5rem] sm:min-h-[4rem] flex items-center justify-center rounded-xl bg-black/35 border border-teal-500/25 px-3 py-4 mb-4 select-none"
            aria-live="polite"
          >
            <CipherChars text={target} showCaseColors={caseColorHintsActive} />
          </div>

          <label htmlFor="case-cipher-input" className="sr-only">
            Type the challenge exactly
          </label>
          <input
            ref={inputRef}
            id="case-cipher-input"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={phase !== 'running'}
            value={typed}
            onChange={(e) => onInput(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                e.preventDefault();
              }
              if (e.shiftKey && e.key === 'Insert') {
                e.preventDefault();
              }
            }}
            placeholder={phase === 'running' ? 'Type here…' : '—'}
            className="w-full max-w-sm mx-auto block rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-mono text-lg text-center text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/45 disabled:opacity-45"
          />

          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center items-stretch">
            {phase === 'solved' && (
              <motion.button
                type="button"
                onClick={nextAfterSolve}
                className="rounded-xl py-3 px-6 font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 min-h-[48px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Next challenge
              </motion.button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {phase === 'running' && (
              <motion.p
                key="hint-run"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-xs text-gray-500"
              >
                Wrong full-length guess clears the field and costs trace fees. After {SUCCESSES_BEFORE_COLOR_LOCK} successful
                cracks this run, cyan/emerald hints turn off (one green only). Finish under {SCORE_TIME_LIMIT_MS / 1000}s for a
                bigger payout.
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-5 min-h-[2.5rem]">
            <AnimatePresence mode="wait">
              {feedback === 'ok' && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  <p className="text-emerald-400 font-semibold">
                    Access granted — {lastTimeMs != null ? `${lastTimeMs} ms` : ''}
                  </p>
                  <p className={`text-sm font-mono ${lastRoundPoints != null && lastRoundPoints > 0 ? 'text-amber-300' : 'text-gray-500'}`}>
                    {lastRoundPoints != null && lastRoundPoints > 0
                      ? `+${formatHaul(lastRoundPoints)} wired this break-in`
                      : lastRoundPoints === 0
                        ? `No payout — crack it faster than ${SCORE_TIME_LIMIT_MS / 1000}s next time`
                        : null}
                  </p>
                </motion.div>
              )}
              {feedback === 'deny' && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  <p className="text-rose-400 font-semibold">Access denied — check every character</p>
                  <p className="text-sm font-mono text-rose-300/90">
                    {formatHaul(-FAIL_PENALTY_POINTS)} trace fee (wallet updated)
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 text-sm text-gray-400 space-y-1 font-mono text-left sm:text-center">
            <p>
              <span className="text-slate-500">Score </span>
              <span className="text-amber-300 font-bold tabular-nums text-base">{sessionScore}</span>
              <span className="text-slate-600 text-xs ml-2">session</span>
              {highScore > 0 && (
                <span className="text-slate-500 text-xs ml-2">
                  · best session saved: <span className="text-amber-200/90">{highScore}</span>
                </span>
              )}
            </p>
            {phase === 'running' && scoreDeadlineRemaining != null && (
              <p className="text-xs text-slate-500">
                Points window:{' '}
                <span className={scoreDeadlineRemaining < 3000 ? 'text-rose-400/90' : 'text-teal-400/80'}>
                  {Math.ceil(scoreDeadlineRemaining / 1000)}s left for max score tier
                </span>
              </p>
            )}
            <p>
              ⏱ Time:{' '}
              <span className="text-teal-300 tabular-nums">
                {phase === 'running' && startTime != null
                  ? `${liveMs} ms`
                  : lastTimeMs != null
                    ? `${lastTimeMs} ms`
                    : '—'}
              </span>
            </p>
            <p>
              🏆 Best:{' '}
              <span className="text-amber-300/90 tabular-nums">{bestMs != null ? `${bestMs} ms` : '—'}</span>
              <span className="text-slate-600 text-xs ml-1">(single solve)</span>
            </p>
            {round > 0 && (
              <p className="text-gray-500 text-xs pt-1">
                Round {round}
                {denyCount > 0 && phase === 'running' && (
                  <span className="text-rose-400/80"> · denials this round: {denyCount}</span>
                )}
              </p>
            )}
          </div>

            <p className="mt-4 text-[11px] text-gray-600 leading-relaxed">
            While hints are on: cyan = uppercase, emerald = lowercase. After {SUCCESSES_BEFORE_COLOR_LOCK} successful cracks this
            run, everything is one green (no cyan vs emerald). Each wrong full-length try charges {formatHaul(FAIL_PENALTY_POINTS)}{' '}
            in trace fees (wallet can go negative). Personal best run is saved on this device (still just a game).
          </p>
        </motion.section>
      </div>
    </main>
  );
}
