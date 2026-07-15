'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FloatingShapes from '@/components/FloatingShapes';
import { useGameStore } from '@/store/gameStore';
import { generateRoomCode, normalizeRoomCode } from '@/lib/gameRoom';

export default function GameRoomHubPage() {
  const router = useRouter();
  const { playerName, ageGroup } = useGameStore();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ageGroup) router.push('/');
  }, [ageGroup, router]);

  const displayName = useMemo(
    () => (playerName?.trim() ? playerName.trim() : 'Player'),
    [playerName]
  );

  const createRoom = () => {
    setError('');
    setBusy(true);
    const code = generateRoomCode(6);
    router.push(`/games/game-room/${code}?as=host`);
  };

  const joinRoom = () => {
    setError('');
    const code = normalizeRoomCode(joinCode);
    if (code.length < 4) {
      setError('Enter the 6-letter room code from your friend.');
      return;
    }
    setBusy(true);
    router.push(`/games/game-room/${code}?as=guest`);
  };

  if (!ageGroup) return null;

  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative">
      <FloatingShapes />

      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-3xl mx-auto mb-8"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <Link
            href="/dashboard"
            className="glass px-3 py-2 rounded-xl text-sm text-white/90 hover:bg-white/10 border border-white/10"
          >
            ← Dashboard
          </Link>
          <div className="glass px-3 py-2 rounded-xl text-xs text-cyan-200/90 border border-cyan-500/20">
            Playing as <span className="font-semibold text-white">{displayName}</span>
          </div>
        </div>
        <p className="text-cyan-300/90 text-xs font-semibold tracking-wide uppercase mb-1">
          Multiplayer
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Game Room</h1>
        <p className="text-gray-400 text-sm max-w-xl">
          One player creates a room and shares the code. The other joins with that code. Max{' '}
          <span className="text-cyan-300 font-semibold">2 players</span> — then duel in Nebula Noughts.
        </p>
      </motion.header>

      <div className="relative z-10 max-w-3xl mx-auto grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-cyan-500/25"
        >
          <div className="text-4xl mb-3">🛰️</div>
          <h2 className="text-xl font-bold text-white mb-2">Create a room</h2>
          <p className="text-gray-400 text-sm mb-5">
            Generate a short code and wait for your friend to join.
          </p>
          <motion.button
            type="button"
            onClick={createRoom}
            disabled={busy}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-cosmic w-full py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            Create room code
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass rounded-2xl p-6 border border-fuchsia-500/25"
        >
          <div className="text-4xl mb-3">🔑</div>
          <h2 className="text-xl font-bold text-white mb-2">Join a room</h2>
          <p className="text-gray-400 text-sm mb-4">Type the code your friend shared.</p>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(normalizeRoomCode(e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            placeholder="e.g. AB12XY"
            maxLength={8}
            className="w-full mb-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-center text-xl tracking-[0.35em] font-bold uppercase placeholder:tracking-normal placeholder:text-sm placeholder:font-medium"
          />
          <motion.button
            type="button"
            onClick={joinRoom}
            disabled={busy}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-xl font-semibold text-white bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50"
          >
            Join room
          </motion.button>
        </motion.div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 max-w-3xl mx-auto mt-4 text-center text-amber-300 text-sm"
        >
          {error}
        </motion.p>
      )}

      <p className="relative z-10 max-w-3xl mx-auto mt-8 text-center text-gray-500 text-xs">
        Needs an Ably API key in <code className="text-gray-400">.env.local</code> — see{' '}
        <code className="text-gray-400">.env.example</code>.
      </p>
    </main>
  );
}
