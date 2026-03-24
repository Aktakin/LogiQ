'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';

const COLS = 10;
const ROWS = 20;
const VISIBLE_BUFFER = 4;
/** Every Nth lily cluster is a firefly — matches any blueprint pad. */
const FIREFLY_EVERY = 8;
/**
 * Min orthogonally connected same-symbol cells to clash. Tetrominoes are at most 4 cells, so 5+ means only
 * merged blobs from multiple drops pop — single pieces always stick and the pond can fill.
 */
const MIN_CLASH_GROUP = 5;

type ConceptId = 'cmd' | 'loop' | 'var' | 'cond' | 'fn';

const CONCEPT_META: Record<
  ConceptId,
  { emoji: string; label: string; short: string; color: string; teach: string }
> = {
  cmd: {
    emoji: '🐸',
    label: 'Hop',
    short: 'one step',
    color: '#4ade80',
    teach: 'One hop at a time — like a single command in a program.',
  },
  loop: {
    emoji: '🌀',
    label: 'Whirlpool',
    short: 'repeat',
    color: '#c084fc',
    teach: 'Whirlpools go round and round — like a loop that repeats.',
  },
  var: {
    emoji: '🪷',
    label: 'Lily pad',
    short: 'holds a value',
    color: '#f472b6',
    teach: 'A lily pad can “hold” something — like a variable storing data.',
  },
  cond: {
    emoji: '🔀',
    label: 'Fork',
    short: 'which way?',
    color: '#fbbf24',
    teach: 'Two paths from the fork — like if / else choosing what happens next.',
  },
  fn: {
    emoji: '🪵',
    label: 'Log raft',
    short: 'reuse',
    color: '#2dd4bf',
    teach: 'A raft bundles hops together — like a function you can reuse.',
  },
};

const WILD_LILY: { emoji: string; label: string; color: string; blurb: string } = {
  emoji: '🪰',
  label: 'Firefly lily',
  color: '#fde047',
  blurb: 'Counts as its own symbol — only clashes with another firefly patch.',
};

type PieceType = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z' | 'F';

const PIECE_CONCEPT: Record<Exclude<PieceType, 'F'>, ConceptId> = {
  I: 'loop',
  O: 'var',
  T: 'cond',
  L: 'cmd',
  J: 'fn',
  S: 'cmd',
  Z: 'loop',
};

const LILY_CLUSTER_NAME: Record<PieceType, string> = {
  I: 'Reed line',
  O: 'Lily quartet',
  T: 'Croaking T',
  L: 'Leap L',
  J: 'Jump J',
  S: 'Stream S',
  Z: 'Zigzag Z',
  F: 'Firefly patch',
};

function conceptForActivePiece(type: PieceType): ConceptId | 'wild' {
  if (type === 'F') return 'wild';
  return PIECE_CONCEPT[type];
}

function metaForCellConcept(c: ConceptId | 'wild') {
  if (c === 'wild') return { emoji: WILD_LILY.emoji, color: WILD_LILY.color, label: WILD_LILY.label };
  return CONCEPT_META[c];
}

/** Bottom-front cell of the cluster — little frog sits here while falling. */
function frogRiderCell(cells: [number, number][]): [number, number] {
  if (cells.length === 0) return [0, 0];
  const maxY = Math.max(...cells.map((c) => c[1]));
  const bottom = cells.filter((c) => c[1] === maxY);
  const maxX = Math.max(...bottom.map((c) => c[0]));
  return [maxX, maxY];
}

/** [rotation][cell] = [dx, dy] from piece anchor (min x,y of cells) */
const SHAPES: Record<PieceType, [number, number][][]> = {
  I: [
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
    ],
  ],
  O: [
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  ],
  T: [
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  L: [
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  ],
  J: [
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [0, 2],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [0, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ],
  ],
  S: [
    [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 1],
      [2, 1],
      [0, 2],
      [1, 2],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  Z: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [2, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ],
  ],
  F: [
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  ],
};

interface Cell {
  concept: ConceptId | 'wild';
}

interface LevelConfig {
  id: number;
  name: string;
  dropMs: number;
  linesToClear: number;
  tip: string;
}

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Twin hops',
    dropMs: 900,
    linesToClear: 1,
    tip: 'Five+ matching symbols touching splash away (whole clusters). Single clusters are only 4 cells max — they stay put so you can fill rows. Clear 1 full line.',
  },
  {
    id: 2,
    name: 'Eddy then hop',
    dropMs: 820,
    linesToClear: 1,
    tip: 'Whirlpools 🌀 only clash with other whirlpools. Use clashes to drop your stack, then clear a line.',
  },
  {
    id: 3,
    name: 'Pad then leap',
    dropMs: 760,
    linesToClear: 1,
    tip: 'Five+ 🪷 in one blob vanish. Smaller groups stay. Fireflies 🪰 only match other fireflies.',
  },
  {
    id: 4,
    name: 'Fork path',
    dropMs: 700,
    linesToClear: 1,
    tip: 'Bigger matching groups pop all at once — great for carving space before a line clear.',
  },
  {
    id: 5,
    name: 'Raft & whirlpool',
    dropMs: 640,
    linesToClear: 1,
    tip: 'Faster drops — plan so same ideas land touching and shrink the pond.',
  },
  {
    id: 6,
    name: 'Long chorus',
    dropMs: 580,
    linesToClear: 2,
    tip: 'Clear 2 full rows. Lines clear before clashes; big blobs of 5+ same symbol still shrink the stack.',
  },
];

type Board = (Cell | null)[][];

function emptyBoard(): Board {
  return Array.from({ length: ROWS + VISIBLE_BUFFER }, () => Array<Cell | null>(COLS).fill(null));
}

/** Random bag (gameplay only — not for initial SSR/hydration). */
function createBag(): PieceType[] {
  const types: PieceType[] = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
}

/** Same seed → same bag on server and client (fixes Next.js hydration mismatches). */
function createBagSeeded(seed: number): PieceType[] {
  const types: PieceType[] = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
  let s = seed >>> 0;
  const rand = () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
}

function createBagForLevel(levelIndex: number): PieceType[] {
  return createBagSeeded((0x9e3779b9 + levelIndex * 2654435761) >>> 0);
}

function trySpawnPiece(
  b: Board,
  queue: PieceType[],
  idx: number,
  serial: number,
  onNeedNewBag: () => PieceType[]
): { type: PieceType; rot: number; x: number; y: number; nextIdx: number; nextQueue: PieceType[] } | null {
  const rot = 0;
  const x = 3;
  const y = VISIBLE_BUFFER;

  if (serial > 0 && serial % FIREFLY_EVERY === 0) {
    const type: PieceType = 'F';
    if (!valid(b, type, rot, x, y)) return null;
    return { type, rot, x, y, nextIdx: idx, nextQueue: queue };
  }

  let q = queue;
  let i = idx;
  if (i >= q.length) {
    q = onNeedNewBag();
    i = 0;
  }
  const type = q[i];
  if (type === undefined || !valid(b, type, rot, x, y)) return null;
  return { type, rot, x, y, nextIdx: i + 1, nextQueue: q };
}

/** First-paint state identical on server & client (level 0). */
const LILYFALL_SSR_INITIAL = (() => {
  const board = emptyBoard();
  const bag = createBagForLevel(0);
  const spawned = trySpawnPiece(board, bag, 0, 1, createBag);
  if (!spawned) {
    throw new Error('Lilyfall: initial spawn failed');
  }
  return {
    board,
    nextQueue: spawned.nextQueue,
    queueIdx: spawned.nextIdx,
    pieceType: spawned.type,
    pieceRot: spawned.rot,
    pieceX: spawned.x,
    pieceY: spawned.y,
  };
})();

function getCells(type: PieceType, rot: number, px: number, py: number): [number, number][] {
  const rots = SHAPES[type];
  const r = rot % rots.length;
  const shape = rots[r];
  let minX = Infinity;
  let minY = Infinity;
  for (const [dx, dy] of shape) {
    minX = Math.min(minX, dx);
    minY = Math.min(minY, dy);
  }
  return shape.map(([dx, dy]) => [px + dx - minX, py + dy - minY]);
}

function valid(board: Board, type: PieceType, rot: number, px: number, py: number): boolean {
  const cells = getCells(type, rot, px, py);
  for (const [x, y] of cells) {
    if (x < 0 || x >= COLS || y < 0 || y >= board.length) return false;
    if (board[y][x]) return false;
  }
  return true;
}

function mergePiece(board: Board, type: PieceType, rot: number, px: number, py: number): Board {
  const next = board.map((row) => [...row]);
  const concept: ConceptId | 'wild' = type === 'F' ? 'wild' : PIECE_CONCEPT[type];
  for (const [x, y] of getCells(type, rot, px, py)) {
    if (y >= 0 && y < next.length && x >= 0 && x < COLS) {
      next[y][x] = { concept };
    }
  }
  return next;
}

function rowFull(row: (Cell | null)[]): boolean {
  return row.every((c) => c !== null);
}

/** Pack cells toward the bottom (larger y) within each column. */
function applyGravity(board: Board): Board {
  const h = board.length;
  const next: Board = Array.from({ length: h }, () => Array<Cell | null>(COLS).fill(null));
  for (let x = 0; x < COLS; x++) {
    const stack: Cell[] = [];
    for (let y = h - 1; y >= 0; y--) {
      const c = board[y][x];
      if (c) stack.push(c);
    }
    let writeY = h - 1;
    for (const c of stack) {
      next[writeY][x] = c;
      writeY--;
    }
  }
  return next;
}

/**
 * Orthogonally connected groups of MIN_CLASH_GROUP+ same-symbol cells “clash” — removed, then gravity.
 * Wild / firefly only matches other wilds.
 */
function clashResolveOnce(board: Board): { board: Board; removed: boolean } {
  const h = board.length;
  const visited = new Set<string>();
  const toRemove = new Set<string>();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < COLS; x++) {
      const start = `${x},${y}`;
      if (visited.has(start)) continue;
      const cell = board[y][x];
      if (!cell) {
        visited.add(start);
        continue;
      }
      const concept = cell.concept;
      const inComp = new Set<string>();
      const q: [number, number][] = [[x, y]];

      while (q.length) {
        const [cx, cy] = q.shift()!;
        const k = `${cx},${cy}`;
        if (inComp.has(k)) continue;
        const c = board[cy]?.[cx];
        if (!c || c.concept !== concept) continue;
        inComp.add(k);
        for (const [dx, dy] of [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ]) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= COLS || ny < 0 || ny >= h) continue;
          const nk = `${nx},${ny}`;
          if (inComp.has(nk)) continue;
          const nc = board[ny][nx];
          if (nc && nc.concept === concept) q.push([nx, ny]);
        }
      }

      for (const k of inComp) visited.add(k);
      if (inComp.size >= MIN_CLASH_GROUP) {
        for (const k of inComp) toRemove.add(k);
      }
    }
  }

  if (toRemove.size === 0) return { board, removed: false };

  const next = board.map((row) => [...row]);
  for (const k of toRemove) {
    const [sx, sy] = k.split(',').map(Number);
    next[sy][sx] = null;
  }
  return { board: applyGravity(next), removed: true };
}

function resolveAllClashes(board: Board): { board: Board; rounds: number } {
  let b = board;
  let rounds = 0;
  while (true) {
    const { board: nb, removed } = clashResolveOnce(b);
    b = nb;
    if (!removed) break;
    rounds++;
  }
  return { board: b, rounds };
}

/** After a lock: clear full rows first (so a line can complete), then clashes — repeat until stable. */
function settleAfterLock(board: Board): { board: Board; clashRounds: number; linesCleared: number } {
  let b = board;
  let clashRounds = 0;
  let linesCleared = 0;

  while (true) {
    let changed = false;

    const rowsToClear: number[] = [];
    for (let y = 0; y < b.length; y++) {
      if (rowFull(b[y])) rowsToClear.push(y);
    }

    if (rowsToClear.length > 0) {
      changed = true;
      linesCleared += rowsToClear.length;
      const sorted = [...rowsToClear].sort((a, z) => z - a);
      for (const y of sorted) {
        b.splice(y, 1);
        b.unshift(Array<Cell | null>(COLS).fill(null));
      }
    }

    const c = resolveAllClashes(b);
    b = c.board;
    if (c.rounds > 0) changed = true;
    clashRounds += c.rounds;

    if (!changed) break;
  }

  return { board: b, clashRounds, linesCleared };
}

export default function PatternStackPage() {
  const router = useRouter();
  const { addStars, incrementGamesPlayed, recordAnswer } = useGameStore();

  const [levelIndex, setLevelIndex] = useState(0);
  const [board, setBoard] = useState<Board>(() => LILYFALL_SSR_INITIAL.board.map((row) => [...row]));
  const [pieceType, setPieceType] = useState<PieceType>(() => LILYFALL_SSR_INITIAL.pieceType);
  const [pieceRot, setPieceRot] = useState(() => LILYFALL_SSR_INITIAL.pieceRot);
  const [pieceX, setPieceX] = useState(() => LILYFALL_SSR_INITIAL.pieceX);
  const [pieceY, setPieceY] = useState(() => LILYFALL_SSR_INITIAL.pieceY);
  const [nextQueue, setNextQueue] = useState<PieceType[]>(() => [...LILYFALL_SSR_INITIAL.nextQueue]);
  const [queueIdx, setQueueIdx] = useState(() => LILYFALL_SSR_INITIAL.queueIdx);
  /** 1-based count of lily clusters spawned this level (every 8th = firefly). */
  const [pieceSerial, setPieceSerial] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [levelComplete, setLevelComplete] = useState(false);

  const level = LEVELS[levelIndex];
  const dropRef = useRef(level.dropMs);
  const boardRef = useRef(board);
  const pieceRef = useRef({ type: pieceType, rot: pieceRot, x: pieceX, y: pieceY });
  const queueRef = useRef({ queue: nextQueue, idx: queueIdx });
  useEffect(() => {
    dropRef.current = level.dropMs;
  }, [level.dropMs]);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    pieceRef.current = { type: pieceType, rot: pieceRot, x: pieceX, y: pieceY };
  }, [pieceType, pieceRot, pieceX, pieceY]);

  useEffect(() => {
    queueRef.current = { queue: nextQueue, idx: queueIdx };
  }, [nextQueue, queueIdx]);

  const spawnPiece = useCallback(
    (b: Board, queue: PieceType[], idx: number, serial: number) =>
      trySpawnPiece(b, queue, idx, serial, createBag),
    []
  );

  const initLevel = useCallback(() => {
    const b = emptyBoard();
    const bag = createBagForLevel(levelIndex);
    setPieceSerial(1);
    const spawned = trySpawnPiece(b, bag, 0, 1, createBag);
    if (!spawned) return;
    setBoard(b);
    setNextQueue(spawned.nextQueue);
    setQueueIdx(spawned.nextIdx);
    setPieceType(spawned.type);
    setPieceRot(spawned.rot);
    setPieceX(spawned.x);
    setPieceY(spawned.y);
    setLinesCleared(0);
    setGameOver(false);
    setLevelComplete(false);
    setPaused(false);
  }, [levelIndex]);

  useEffect(() => {
    initLevel();
  }, [levelIndex, initLevel]);

  const finalizePiece = useCallback(
    (lock: { type: PieceType; rot: number; x: number; y: number }) => {
      const b0 = boardRef.current;
      const merged = mergePiece(b0, lock.type, lock.rot, lock.x, lock.y);
      const { board: settled, clashRounds, linesCleared: linesFromLock } = settleAfterLock(merged);

      if (linesFromLock > 0) {
        setLinesCleared((p) => {
          const next = p + linesFromLock;
          if (next >= level.linesToClear) {
            setLevelComplete(true);
            addStars(3);
            incrementGamesPlayed();
            recordAnswer(true);
          } else {
            setToast(`Cleared ${linesFromLock} full line${linesFromLock > 1 ? 's' : ''}! ${next}/${level.linesToClear} toward goal.`);
            window.setTimeout(() => setToast(null), 2600);
            recordAnswer(true);
          }
          return next;
        });
      } else if (clashRounds > 0) {
        setToast('Splash! Same symbols touched — they popped and the stack shrank.');
        window.setTimeout(() => setToast(null), 2200);
      }

      const { queue, idx } = queueRef.current;
      const nextSerial = pieceSerial + 1;
      const spawned = spawnPiece(settled, queue, idx, nextSerial);
      if (!spawned) {
        setGameOver(true);
        recordAnswer(false);
        setBoard(settled);
        return;
      }
      setBoard(settled);
      setPieceSerial(nextSerial);
      setNextQueue(spawned.nextQueue);
      setQueueIdx(spawned.nextIdx);
      setPieceType(spawned.type);
      setPieceRot(spawned.rot);
      setPieceX(spawned.x);
      setPieceY(spawned.y);
    },
    [level.linesToClear, pieceSerial, spawnPiece, addStars, incrementGamesPlayed, recordAnswer]
  );

  const tryMove = useCallback(
    (dx: number) => {
      if (gameOver || paused || levelComplete) return;
      const b = boardRef.current;
      const p = pieceRef.current;
      const nx = p.x + dx;
      if (valid(b, p.type, p.rot, nx, p.y)) setPieceX(nx);
    },
    [gameOver, paused, levelComplete]
  );

  const tryRotate = useCallback(() => {
    if (gameOver || paused || levelComplete) return;
    const b = boardRef.current;
    const p = pieceRef.current;
    const nextRot = (p.rot + 1) % SHAPES[p.type].length;
    if (valid(b, p.type, nextRot, p.x, p.y)) {
      setPieceRot(nextRot);
    } else if (valid(b, p.type, nextRot, p.x - 1, p.y)) {
      setPieceX(p.x - 1);
      setPieceRot(nextRot);
    } else if (valid(b, p.type, nextRot, p.x + 1, p.y)) {
      setPieceX(p.x + 1);
      setPieceRot(nextRot);
    }
  }, [gameOver, paused, levelComplete]);

  const softDropTick = useCallback(() => {
    if (gameOver || paused || levelComplete) return;
    const b = boardRef.current;
    const p = pieceRef.current;
    if (valid(b, p.type, p.rot, p.x, p.y + 1)) {
      setPieceY(p.y + 1);
    } else {
      finalizePiece(p);
    }
  }, [gameOver, paused, levelComplete, finalizePiece]);

  const hardDrop = useCallback(() => {
    if (gameOver || paused || levelComplete) return;
    const b = boardRef.current;
    const p = pieceRef.current;
    let y = p.y;
    while (valid(b, p.type, p.rot, p.x, y + 1)) y += 1;
    finalizePiece({ ...p, y });
  }, [gameOver, paused, levelComplete, finalizePiece]);

  useEffect(() => {
    if (gameOver || paused || levelComplete) return;
    const id = window.setInterval(() => {
      softDropTick();
    }, dropRef.current);
    return () => window.clearInterval(id);
  }, [softDropTick, gameOver, paused, levelComplete, level.dropMs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver || levelComplete) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        tryMove(-1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        tryMove(1);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        softDropTick();
      }
      if (e.key === 'ArrowUp' || e.key === 'x') {
        e.preventDefault();
        tryRotate();
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        hardDrop();
      }
      if (e.key === 'p') {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove, tryRotate, softDropTick, hardDrop, gameOver, levelComplete]);

  const ghostY = useMemo(() => {
    let y = pieceY;
    while (valid(board, pieceType, pieceRot, pieceX, y + 1)) y += 1;
    return y;
  }, [board, pieceType, pieceRot, pieceX, pieceY]);

  const nextPreview = useMemo(() => {
    const ns = pieceSerial + 1;
    if (ns > 0 && ns % FIREFLY_EVERY === 0) {
      return { kind: 'wild' as const };
    }
    if (queueIdx < nextQueue.length) {
      return { kind: 'shape' as const, type: nextQueue[queueIdx]! };
    }
    const first = createBag()[0] ?? 'I';
    return { kind: 'shape' as const, type: first };
  }, [pieceSerial, nextQueue, queueIdx]);

  const totalRows = ROWS + VISIBLE_BUFFER;

  return (
    <main className="h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden bg-gradient-to-b from-emerald-950 via-teal-950/90 to-slate-950 p-2 sm:p-3 md:p-4 relative text-white">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 120% 80% at 50% 100%, rgba(52,211,153,0.25), transparent 50%), radial-gradient(ellipse 60% 40% at 20% 30%, rgba(45,212,191,0.08), transparent 45%)',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.06] z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(167,243,208,0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(167,243,208,0.25) 1px, transparent 1px)`,
          backgroundSize: '22px 22px',
        }}
      />

      <header className="max-w-5xl mx-auto mb-2 sm:mb-3 flex-shrink-0 relative z-10 flex flex-wrap items-center justify-between gap-2">
        <motion.button
          type="button"
          onClick={() => router.push('/games/programming')}
          className="glass px-3 py-2 rounded-xl text-gray-300 hover:text-white text-sm min-h-[44px] border border-white/10"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ← Code Quest
        </motion.button>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="glass px-3 py-1.5 rounded-lg border border-violet-500/30">
            Level {level.id}/{LEVELS.length}
          </span>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="glass px-3 py-1.5 rounded-lg border border-white/15 text-gray-300"
          >
            {paused ? 'Resume' : 'Pause'} (P)
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto relative z-10 flex-1 min-h-0 min-w-0 w-full flex flex-col lg:flex-row lg:gap-3 gap-2">
        <div className="flex flex-col min-h-0 min-w-0 flex-1">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-1.5 sm:mb-2 flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              🐸 Lilyfall
            </h1>
            <p className="text-emerald-100/70 text-[11px] sm:text-xs mt-0.5 leading-snug line-clamp-2 sm:line-clamp-none">
              <span className="text-cyan-200/95">Full rows clear first.</span> Then blobs of {MIN_CLASH_GROUP}+ matching symbols touching (up/down/left/right) clash. One piece is only 4 cells — it always stays until lines clear or it joins a bigger blob. Every {FIREFLY_EVERY}th drop is a{' '}
              <span className="text-yellow-200/90">firefly 🪰</span>.
            </p>
          </motion.div>

          <div className="glass rounded-xl p-2 sm:p-3 mb-1.5 border border-cyan-500/30 max-w-md bg-emerald-950/20 flex-shrink-0 lg:hidden">
            <p className="text-cyan-200 font-semibold text-xs mb-0.5">Symbol clash</p>
            <p className="text-gray-500 text-[10px] sm:text-xs mb-1.5 leading-snug">
              <span className="text-cyan-300/90">Full lines clear first.</span> Then {MIN_CLASH_GROUP}+ of the{' '}
              <span className="italic text-gray-400">same</span> idea in one blob pop off (one piece = 4 cells max, so it sticks).
            </p>
            <p className="text-[10px] text-gray-500 mb-1">
              <span className="text-emerald-300/90">Win:</span> Clear {level.linesToClear} full row{level.linesToClear > 1 ? 's' : ''} (all 10 cells). Progress{' '}
              {linesCleared}/{level.linesToClear}. Then tap <span className="text-white">Next level →</span> on the popup.
            </p>
            <p className="text-[10px] text-gray-500">
              <span className="text-amber-300/90">Tip:</span> {level.tip}
            </p>
          </div>

          <p className="hidden sm:block text-[10px] text-teal-200/85 mb-1 font-medium flex-shrink-0">
            Pond below — fill rows to clear them; big same-symbol blobs can still clash
          </p>

          <div className="flex-1 min-h-0 min-w-0 w-full flex flex-col items-stretch justify-center py-0.5">
            <div className="flex-1 min-h-[100px] min-w-0 w-full [container-type:size] relative rounded-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="glass rounded-2xl p-1 sm:p-1.5 border border-teal-500/30 shadow-inner shadow-black/30 box-border max-w-full">
                  <div
                    className="grid gap-px bg-teal-950/80 p-0.5 sm:p-1 rounded-xl border border-emerald-700/40 shadow-inner shadow-black/30"
                    style={{
                      gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${totalRows}, minmax(0, 1fr))`,
                      width: `min(100cqw, calc(100cqh * ${COLS} / ${totalRows}))`,
                      aspectRatio: `${COLS} / ${totalRows}`,
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                  >
                    {Array.from({ length: totalRows }).flatMap((_, rowIdx) => {
                      const y = rowIdx;
                      return Array.from({ length: COLS }).map((_, colIdx) => {
                        const x = colIdx;
                        const cell = board[y]?.[x];
                        const activeCells = getCells(pieceType, pieceRot, pieceX, pieceY);
                        const isActive = activeCells.some(([cx, cy]) => cx === x && cy === y);
                        const ghostCells = getCells(pieceType, pieceRot, pieceX, ghostY);
                        const isGhost = !isActive && ghostCells.some(([cx, cy]) => cx === x && cy === y);
                        const concept = cell?.concept ?? (isActive ? conceptForActivePiece(pieceType) : null);
                        const meta = concept ? metaForCellConcept(concept) : null;
                        const [rx, ry] = frogRiderCell(activeCells);
                        const showRider = isActive && rx === x && ry === y;
                        return (
                          <div
                            key={`${x}-${rowIdx}`}
                            className={`relative min-h-0 min-w-0 rounded-md sm:rounded-lg flex flex-col items-center justify-center text-[clamp(0.55rem,6cqmin,0.95rem)] ${
                              cell || isActive
                                ? 'border border-emerald-400/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                                : isGhost
                                  ? 'border border-dashed border-teal-400/25'
                                  : 'bg-slate-950/50'
                            }`}
                            style={{
                              backgroundColor: meta
                                ? isGhost && !cell && !isActive
                                  ? `${meta.color}18`
                                  : `${meta.color}50`
                                : undefined,
                            }}
                          >
                            {meta ? (
                              <>
                                <span className="leading-none select-none">{meta.emoji}</span>
                                {showRider && (
                                  <span
                                    className="absolute bottom-px right-px text-[clamp(0.45rem,4cqmin,0.65rem)] drop-shadow-md"
                                    title="Your frog"
                                  >
                                    🐸
                                  </span>
                                )}
                              </>
                            ) : isGhost ? (
                              <span className="opacity-25 text-[0.6em] text-teal-300">~</span>
                            ) : null}
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap gap-1.5 lg:hidden flex-shrink-0 pb-1 max-lg:pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))]">
            <button type="button" onClick={() => tryMove(-1)} className="flex-1 min-h-[40px] sm:min-h-[44px] rounded-xl bg-white/10 border border-white/20 text-sm">
              ◀
            </button>
            <button type="button" onClick={() => tryRotate()} className="flex-1 min-h-[40px] sm:min-h-[44px] rounded-xl bg-white/10 border border-white/20 text-sm">
              🔄
            </button>
            <button type="button" onClick={() => tryMove(1)} className="flex-1 min-h-[40px] sm:min-h-[44px] rounded-xl bg-white/10 border border-white/20 text-sm">
              ▶
            </button>
            <button type="button" onClick={() => softDropTick()} className="flex-1 min-h-[40px] sm:min-h-[44px] rounded-xl bg-violet-600/40 border border-violet-400/40 text-sm">
              ▼
            </button>
            <button type="button" onClick={() => hardDrop()} className="w-full min-h-[40px] sm:min-h-[44px] rounded-xl bg-fuchsia-600/35 border border-fuchsia-400/40 text-xs sm:text-sm">
              Drop ⬇️
            </button>
          </div>
        </div>

        <aside className="flex flex-col gap-2 min-h-0 lg:w-[min(260px,30vw)] lg:max-w-[280px] lg:flex-shrink-0 lg:overflow-y-auto lg:pr-0.5 max-lg:grid max-lg:grid-cols-2 max-lg:gap-2 max-lg:max-h-[40vh] max-lg:overflow-y-auto max-lg:overflow-x-hidden">
          <div className="glass rounded-xl p-2.5 sm:p-3 border border-cyan-500/35">
            <h2 className="text-xs font-bold text-cyan-100 mb-1">Symbol clash</h2>
            <p className="text-[10px] text-gray-400 leading-snug mb-2">
              <span className="text-amber-200/90">Completed rows clear first</span> (like Tetris). After that, <span className="text-cyan-200/90">{MIN_CLASH_GROUP}+ matching symbols</span> in one connected blob clash. Each drop is at most 4 cells, so pieces land and stay until you complete a row or merge a big enough blob.
            </p>
            <p className="text-[10px] text-gray-500 border-t border-white/10 pt-2">
              <span className="text-emerald-200/95 font-semibold">How to win:</span> Pack the pond until a row is{' '}
              <span className="text-gray-300">full left-to-right</span> (all 10 columns). That line clears and counts toward your goal (
              {linesCleared}/{level.linesToClear}). Levels 1–5 need <strong className="text-gray-400">1</strong> line; level 6 needs{' '}
              <strong className="text-gray-400">2</strong>.
            </p>
            <p className="text-[10px] text-gray-500 mt-1.5">
              <span className="text-amber-200/80 font-semibold">Next level:</span> When the goal is met, a popup appears — tap{' '}
              <span className="text-white">Next level →</span>. There is no skip menu; levels unlock in order (1→{LEVELS.length}).
            </p>
          </div>

          <div className="glass rounded-xl p-3 border border-white/10">
            <h2 className="text-xs font-bold text-gray-200 mb-1">Next cluster</h2>
            {nextPreview.kind === 'wild' ? (
              <div className="flex items-center gap-2">
                <span className="text-3xl">{WILD_LILY.emoji}</span>
                <div>
                  <p className="text-sm text-yellow-200">{WILD_LILY.label}</p>
                  <p className="text-xs text-gray-400">{WILD_LILY.blurb}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-3xl">{metaForCellConcept(conceptForActivePiece(nextPreview.type)).emoji}</span>
                <div>
                  <p className="text-sm">{LILY_CLUSTER_NAME[nextPreview.type]}</p>
                  <p className="text-xs text-gray-400">{metaForCellConcept(conceptForActivePiece(nextPreview.type)).label}</p>
                </div>
              </div>
            )}
          </div>

          <div className="glass rounded-xl p-3 border border-teal-500/25 text-[10px] sm:text-xs text-gray-400 max-lg:max-h-[min(22vh,200px)] max-lg:overflow-y-auto">
            <p className="font-semibold text-emerald-200 mb-1.5 text-xs">Pad meanings</p>
            <ul className="space-y-1">
              {(['I', 'O', 'T', 'L', 'J', 'S', 'Z'] as const).map((t) => {
                const m = metaForCellConcept(PIECE_CONCEPT[t]);
                return (
                  <li key={t} className="flex justify-between gap-2">
                    <span>{LILY_CLUSTER_NAME[t]}</span>
                    <span className="text-gray-500">
                      {m.emoji} {m.label}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-yellow-200/80 border-t border-white/10 pt-2">
              {WILD_LILY.emoji} {LILY_CLUSTER_NAME.F}: {WILD_LILY.blurb}
            </p>
          </div>

          <div className="glass rounded-xl p-3 border border-white/10 text-[10px] text-gray-400 leading-snug max-lg:col-span-2">
            <p className="font-semibold text-white mb-0.5 text-xs">Controls</p>
            <p>← → move · ↑ rotate · ↓ soft · Space drop</p>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass px-4 py-2 rounded-xl border border-amber-500/40 text-amber-100 text-sm max-w-md text-center"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paused && !gameOver && !levelComplete && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="glass rounded-2xl p-6 text-center border border-white/20 max-w-sm">
              <h3 className="text-xl font-bold mb-2">Paused</h3>
              <button type="button" onClick={() => setPaused(false)} className="mt-2 px-6 py-2 rounded-xl bg-violet-600 text-white">
                Resume
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameOver && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="glass rounded-2xl p-6 text-center border border-red-500/30 max-w-sm">
              <h3 className="text-2xl font-bold text-red-300 mb-2">Pond&apos;s too full!</h3>
              <p className="text-gray-300 text-sm mb-4">Lilies stacked to the top. Picture the lily line, then place clusters before it floods.</p>
              <button
                type="button"
                onClick={() => initLevel()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 font-bold"
              >
                Retry level
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {levelComplete && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="glass rounded-2xl p-6 text-center border border-emerald-500/35 max-w-sm">
              <div className="text-4xl mb-2">🐸✨</div>
              <h3 className="text-xl font-bold text-white mb-2">Level clear!</h3>
              <p className="text-emerald-200/90 text-sm mb-2">{level.tip}</p>
              <p className="text-amber-300 text-sm mb-4">⭐ +3 stars</p>
              <button
                type="button"
                onClick={() => {
                  if (levelIndex < LEVELS.length - 1) setLevelIndex((i) => i + 1);
                  else router.push('/games/programming');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 font-bold"
              >
                {levelIndex < LEVELS.length - 1 ? 'Next level →' : 'Back to Code Quest'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
