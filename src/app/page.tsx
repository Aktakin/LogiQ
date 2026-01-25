'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import FloatingShapes from '@/components/FloatingShapes';

export default function HomePage() {
  const router = useRouter();
  const { setAgeGroup, setPlayerName, playerName } = useGameStore();
  const [step, setStep] = useState<'welcome' | 'name'>('welcome');
  const [tempName, setTempName] = useState(playerName);

  const handleStart = () => {
    // Set default age group and go directly to dashboard
    setAgeGroup('7-9');
    if (playerName) {
      router.push('/dashboard');
    } else {
      setStep('name');
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setPlayerName(tempName.trim());
      setAgeGroup('7-9');
      router.push('/dashboard');
    }
  };

  return (
    <main className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 relative">
      <FloatingShapes />
      
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <WelcomeScreen key="welcome" onStart={handleStart} playerName={playerName} />
        )}
        
        {step === 'name' && (
          <NameScreen
            key="name"
            tempName={tempName}
            setTempName={setTempName}
            onSubmit={handleNameSubmit}
            onBack={() => setStep('welcome')}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function WelcomeScreen({ onStart, playerName }: { onStart: () => void; playerName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-2xl w-full relative z-10 px-3 sm:px-4"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className="mb-4 sm:mb-8"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 glow mb-4">
          <span className="text-5xl sm:text-6xl">🧩</span>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl sm:text-6xl md:text-7xl font-bold mb-3 sm:mb-4 px-1"
      >
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          LogiQuest
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xl md:text-2xl text-gray-400 mb-8"
      >
        Discover the magic of logic through play!
      </motion.p>

      {/* Returning player greeting */}
      {playerName && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-purple-300 mb-6"
        >
          Welcome back, <span className="font-bold text-pink-400">{playerName}</span>! 🎉
        </motion.p>
      )}

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-10"
      >
        {['🎮 Fun Games', '🧠 Smart Puzzles', '⭐ Earn Stars', '📈 Track Progress'].map(
          (feature, i) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="glass px-4 py-2 rounded-full text-sm"
            >
              {feature}
            </motion.div>
          )
        )}
      </motion.div>

      {/* Start button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="btn-cosmic text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 rounded-2xl min-h-[48px] touch-target w-full sm:w-auto max-w-xs sm:max-w-none"
      >
        <span>{playerName ? 'Continue Adventure' : 'Start Adventure'} 🚀</span>
      </motion.button>

      {/* Floating elements - hidden on small screens to avoid overlap */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute left-2 sm:-left-20 top-20 text-3xl sm:text-5xl opacity-30 sm:opacity-50 pointer-events-none"
      >
        ✨
      </motion.div>
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute right-2 sm:-right-10 bottom-20 text-2xl sm:text-4xl opacity-30 sm:opacity-50 pointer-events-none"
      >
        🌙
      </motion.div>
    </motion.div>
  );
}

function NameScreen({
  tempName,
  setTempName,
  onSubmit,
  onBack,
}: {
  tempName: string;
  setTempName: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
      className="text-center max-w-md w-full relative z-10"
    >
      <motion.button
        onClick={onBack}
        className="absolute -top-16 left-0 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        whileHover={{ x: -4 }}
      >
        ← Back
      </motion.button>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-6xl mb-6"
      >
        👋
      </motion.div>

      <h2 className="text-4xl font-bold mb-4 text-white">What&apos;s your name?</h2>
      <p className="text-gray-400 mb-8">Let&apos;s make this adventure personal!</p>

      <form onSubmit={onSubmit}>
        <motion.input
          type="text"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          placeholder="Enter your name..."
          className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xl text-center placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
          maxLength={20}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          autoFocus
        />

        <motion.button
          type="submit"
          disabled={!tempName.trim()}
          className="btn-cosmic mt-6 w-full py-4 text-lg min-h-[48px] touch-target disabled:opacity-50 disabled:cursor-not-allowed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={tempName.trim() ? { scale: 1.02 } : {}}
          whileTap={tempName.trim() ? { scale: 0.98 } : {}}
        >
          <span>Let&apos;s Go! 🚀</span>
        </motion.button>
      </form>
    </motion.div>
  );
}
