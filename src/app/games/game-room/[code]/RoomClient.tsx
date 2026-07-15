'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import * as Ably from 'ably';
import FloatingShapes from '@/components/FloatingShapes';
import { useGameStore } from '@/store/gameStore';
import {
  applyMove,
  channelNameForCode,
  createInitialGame,
  getPlayerClientId,
  normalizeRoomCode,
  type Cell,
  type GameState,
  type Mark,
  type PresencePlayer,
  type RoomRole,
} from '@/lib/gameRoom';

type ConnStatus = 'connecting' | 'ready' | 'error' | 'full' | 'missing';

export default function GameRoomPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const { playerName, ageGroup } = useGameStore();

  const code = normalizeRoomCode(String(params.code || ''));
  const role: RoomRole = search.get('as') === 'guest' ? 'guest' : 'host';
  const myMark: Mark = role === 'host' ? 'X' : 'O';

  const displayName = useMemo(
    () => (playerName?.trim() ? playerName.trim() : role === 'host' ? 'Host' : 'Guest'),
    [playerName, role]
  );

  const [conn, setConn] = useState<ConnStatus>('connecting');
  const [error, setError] = useState('');
  const [players, setPlayers] = useState<PresencePlayer[]>([]);
  const [game, setGame] = useState<GameState>(createInitialGame());
  const [copied, setCopied] = useState(false);

  const clientRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!ageGroup) router.push('/');
  }, [ageGroup, router]);

  const syncPlayers = useCallback((members: Ably.PresenceMessage[]) => {
    const list: PresencePlayer[] = members
      .map((m) => m.data as PresencePlayer)
      .filter((p) => p && (p.role === 'host' || p.role === 'guest'));
    setPlayers(list);
    return list;
  }, []);

  useEffect(() => {
    if (!ageGroup || !code) return;
    let cancelled = false;
    const clientId = getPlayerClientId();
    startedRef.current = false;

    const client = new Ably.Realtime({
      authUrl: `/api/ably-token?clientId=${encodeURIComponent(clientId)}`,
      clientId,
    });
    clientRef.current = client;

    const channel = client.channels.get(channelNameForCode(code));
    channelRef.current = channel;

    const onGameMessage = (msg: Ably.Message) => {
      if (msg.name === 'game:state' && msg.data) {
        setGame(msg.data as GameState);
      }
    };

    const boot = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          const onChange = (state: Ably.ConnectionStateChange) => {
            if (state.current === 'connected') {
              client.connection.off(onChange);
              resolve();
            }
            if (state.current === 'failed') {
              client.connection.off(onChange);
              reject(new Error(state.reason?.message || 'Ably connection failed'));
            }
          };
          client.connection.on(onChange);
          if (client.connection.state === 'connected') resolve();
        });

        if (cancelled) return;

        await channel.attach();
        const existing = await channel.presence.get();
        if (cancelled) return;

        if (role === 'guest') {
          if (existing.length === 0) {
            setConn('missing');
            setError('No room with that code. Ask your friend to create it first.');
            client.close();
            return;
          }
          if (existing.length >= 2) {
            setConn('full');
            setError('This room is full (max 2 players).');
            client.close();
            return;
          }
        }

        if (role === 'host' && existing.length >= 2) {
          setConn('full');
          setError('This room is already full.');
          client.close();
          return;
        }

        const presenceData: PresencePlayer = {
          name: displayName,
          role,
          mark: myMark,
        };

        await channel.presence.enter(presenceData);
        const after = await channel.presence.get();
        if (after.length > 2) {
          await channel.presence.leave();
          setConn('full');
          setError('This room is full (max 2 players).');
          client.close();
          return;
        }

        if (cancelled) return;

        const beginMatch = async () => {
          if (role !== 'host' || startedRef.current) return;
          startedRef.current = true;
          const next: GameState = {
            board: Array(9).fill(null),
            turn: 'X',
            status: 'playing',
            winner: null,
          };
          setGame(next);
          await channel.publish('game:state', next);
        };

        channel.subscribe(onGameMessage);
        channel.presence.subscribe(async () => {
          const members = await channel.presence.get();
          const list = syncPlayers(members);
          if (list.length === 2) {
            await beginMatch();
          } else {
            startedRef.current = false;
            setGame(createInitialGame());
          }
        });

        syncPlayers(after);

        try {
          const history = await channel.history({ limit: 15 });
          const lastState = history.items.find((m) => m.name === 'game:state');
          if (lastState?.data) {
            const state = lastState.data as GameState;
            setGame(state);
            if (state.status === 'playing' || state.status === 'done') {
              startedRef.current = true;
            }
          }
        } catch {
          /* history optional */
        }

        if (after.length === 2) {
          await beginMatch();
        }

        setConn('ready');
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setConn('error');
          setError(
            err instanceof Error
              ? err.message
              : 'Could not connect. Check ABLY_API_KEY in .env.local and restart the server.'
          );
        }
      }
    };

    void boot();

    return () => {
      cancelled = true;
      try {
        channel.unsubscribe(onGameMessage);
        void channel.presence.leave();
      } catch {
        /* ignore */
      }
      client.close();
      clientRef.current = null;
      channelRef.current = null;
    };
  }, [ageGroup, code, displayName, myMark, role, syncPlayers]);

  const publishGame = async (next: GameState) => {
    setGame(next);
    const ch = channelRef.current;
    if (ch) await ch.publish('game:state', next);
  };

  const onCellClick = async (index: number) => {
    if (conn !== 'ready' || players.length < 2) return;
    const next = applyMove(game, index, myMark);
    if (!next) return;
    await publishGame(next);
  };

  const rematch = async () => {
    if (role !== 'host') return;
    startedRef.current = true;
    const next: GameState = {
      board: Array(9).fill(null),
      turn: 'X',
      status: players.length === 2 ? 'playing' : 'waiting',
      winner: null,
    };
    await publishGame(next);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const opponent = players.find((p) => p.role !== role);
  const me: PresencePlayer = {
    name: displayName,
    role,
    mark: myMark,
  };

  if (!ageGroup) return null;

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative">
      <FloatingShapes />

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link
            href="/sections/game-room"
            className="glass px-3 py-2 rounded-xl text-sm text-white/90 hover:bg-white/10 border border-white/10"
          >
            ← Leave room
          </Link>
          <div className="glass px-3 py-2 rounded-xl border border-cyan-500/25 text-center">
            <div className="text-[10px] uppercase tracking-wide text-cyan-200/70">Room code</div>
            <button
              type="button"
              onClick={copyCode}
              className="text-xl font-bold tracking-[0.3em] text-white"
              title="Copy code"
            >
              {code || '———'}
            </button>
            <div className="text-[10px] text-gray-400">{copied ? 'Copied!' : 'Tap to copy'}</div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <p className="text-cyan-300 text-xs font-semibold uppercase tracking-wide mb-1">
            Nebula Noughts
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">2-player duel</h1>
          <p className="text-gray-400 text-sm">
            You are {myMark === 'X' ? '⭐ Stars (X)' : '🪐 Planets (O)'}
          </p>
        </motion.div>

        {(conn === 'error' || conn === 'full' || conn === 'missing') && (
          <div className="glass rounded-2xl p-6 border border-amber-500/40 text-center mb-6">
            <p className="text-amber-200 font-semibold mb-3">{error}</p>
            <Link
              href="/sections/game-room"
              className="btn-cosmic inline-block px-5 py-2 rounded-xl text-sm"
            >
              Back to Game Room
            </Link>
          </div>
        )}

        {conn === 'connecting' && (
          <div className="glass rounded-2xl p-8 border border-white/10 text-center text-gray-300 mb-6">
            Connecting to room…
          </div>
        )}

        {conn === 'ready' && (
          <>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <SeatCard
                title="Seat 1 · Host"
                player={players.find((p) => p.role === 'host')}
                fallback={role === 'host' ? me : null}
                accent="#22d3ee"
                mark="X"
              />
              <SeatCard
                title="Seat 2 · Guest"
                player={players.find((p) => p.role === 'guest')}
                fallback={role === 'guest' ? me : null}
                accent="#e879f9"
                mark="O"
                waitingLabel="Waiting for friend…"
              />
            </div>

            {players.length < 2 && (
              <div className="glass rounded-2xl p-5 border border-cyan-500/20 text-center mb-6">
                <p className="text-white font-semibold mb-1">Share this code</p>
                <p className="text-3xl font-bold tracking-[0.35em] text-cyan-300 mb-2">{code}</p>
                <p className="text-gray-400 text-sm">
                  Friend opens Game Room → Join → enters the code. Room locks at 2 players.
                </p>
              </div>
            )}

            <div className="glass rounded-2xl p-4 sm:p-6 border border-violet-500/25">
              <div className="flex items-center justify-between gap-2 mb-4 text-sm">
                <StatusLine game={game} myMark={myMark} opponentName={opponent?.name} />
                {game.status === 'done' && role === 'host' && (
                  <button
                    type="button"
                    onClick={rematch}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    Rematch
                  </button>
                )}
                {game.status === 'done' && role === 'guest' && (
                  <span className="text-xs text-gray-400">Host can rematch</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {game.board.map((cell, i) => (
                  <CellButton
                    key={i}
                    cell={cell}
                    disabled={
                      game.status !== 'playing' ||
                      game.turn !== myMark ||
                      Boolean(cell) ||
                      players.length < 2
                    }
                    onClick={() => onCellClick(i)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function SeatCard({
  title,
  player,
  fallback,
  accent,
  mark,
  waitingLabel = 'Empty seat',
}: {
  title: string;
  player?: PresencePlayer;
  fallback?: PresencePlayer | null;
  accent: string;
  mark: Mark;
  waitingLabel?: string;
}) {
  const shown = player || fallback;
  return (
    <div className="glass rounded-xl p-4 border" style={{ borderColor: `${accent}40` }}>
      <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{title}</div>
      {shown ? (
        <>
          <div className="text-white font-semibold truncate">{shown.name}</div>
          <div className="text-xs mt-1" style={{ color: accent }}>
            {mark === 'X' ? '⭐ Stars' : '🪐 Planets'} ({mark})
            {player ? ' · online' : ' · connecting'}
          </div>
        </>
      ) : (
        <div className="text-gray-500 text-sm py-1">{waitingLabel}</div>
      )}
    </div>
  );
}

function StatusLine({
  game,
  myMark,
  opponentName,
}: {
  game: GameState;
  myMark: Mark;
  opponentName?: string;
}) {
  if (game.status === 'waiting') {
    return <span className="text-gray-400">Waiting for both players…</span>;
  }
  if (game.status === 'done') {
    if (game.winner === 'draw') return <span className="text-amber-300 font-semibold">Draw!</span>;
    if (game.winner === myMark) {
      return <span className="text-emerald-300 font-semibold">You win! 🎉</span>;
    }
    return (
      <span className="text-rose-300 font-semibold">{opponentName || 'Opponent'} wins</span>
    );
  }
  if (game.turn === myMark) return <span className="text-cyan-300 font-semibold">Your turn</span>;
  return <span className="text-gray-400">Waiting for {opponentName || 'opponent'}…</span>;
}

function CellButton({
  cell,
  disabled,
  onClick,
}: {
  cell: Cell;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      className="aspect-square rounded-xl bg-white/5 border border-white/15 text-3xl font-bold text-white disabled:opacity-80 hover:border-cyan-400/40 transition-colors"
    >
      <AnimatePresence mode="wait">
        {cell && (
          <motion.span
            key={cell}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {cell === 'X' ? '⭐' : '🪐'}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
