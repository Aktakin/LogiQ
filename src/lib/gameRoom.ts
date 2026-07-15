export type RoomRole = 'host' | 'guest';
export type Mark = 'X' | 'O';
export type Cell = Mark | null;

export type PresencePlayer = {
  name: string;
  role: RoomRole;
  mark: Mark;
};

export type GameStatus = 'waiting' | 'playing' | 'done';

export type GameState = {
  board: Cell[];
  turn: Mark;
  status: GameStatus;
  winner: Mark | 'draw' | null;
};

export const EMPTY_BOARD: Cell[] = Array(9).fill(null);

export function createInitialGame(): GameState {
  return {
    board: [...EMPTY_BOARD],
    turn: 'X',
    status: 'waiting',
    winner: null,
  };
}

export function channelNameForCode(code: string) {
  return `game-room:${code.toUpperCase()}`;
}

/** Kid-friendly room codes (no 0/O/1/I). */
export function generateRoomCode(length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < length; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

export function normalizeRoomCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
}

export function getPlayerClientId(): string {
  if (typeof window === 'undefined') return `player-ssr`;
  const key = 'logiq-game-room-client-id';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = `player-${crypto.randomUUID()}`;
  sessionStorage.setItem(key, id);
  return id;
}

const WINS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export function evaluateBoard(board: Cell[]): {
  winner: Mark | 'draw' | null;
  status: GameStatus;
} {
  for (const [a, b, c] of WINS) {
    const v = board[a];
    if (v && v === board[b] && v === board[c]) {
      return { winner: v, status: 'done' };
    }
  }
  if (board.every(Boolean)) return { winner: 'draw', status: 'done' };
  return { winner: null, status: 'playing' };
}

export function applyMove(state: GameState, index: number, mark: Mark): GameState | null {
  if (state.status !== 'playing') return null;
  if (state.turn !== mark) return null;
  if (index < 0 || index > 8 || state.board[index]) return null;
  const board = [...state.board];
  board[index] = mark;
  const { winner, status } = evaluateBoard(board);
  return {
    board,
    turn: mark === 'X' ? 'O' : 'X',
    status,
    winner,
  };
}
