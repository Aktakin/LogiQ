'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import FloatingShapes from '@/components/FloatingShapes';
import { HomePageBackground } from '@/components/HomePageBackground';
import { HomeBentoGrid } from '@/components/HomeBentoGrid';
import { LogiQuestMark } from '@/components/home/HomeTheme';

export default function HomePage() {
  const router = useRouter();
  const { setAgeGroup, setPlayerName, playerName } = useGameStore();
  const [step, setStep] = useState<'welcome' | 'name'>('welcome');
  const [tempName, setTempName] = useState(playerName);

  const handleStart = () => {
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
    <main className="min-h-screen min-h-[100dvh] relative overflow-x-hidden z-0 py-8 sm:py-12 px-4 sm:px-6">
      <HomePageBackground />
      <FloatingShapes />

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <HomeBentoGrid playerName={playerName} onStart={handleStart} />
          </motion.div>
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
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="relative z-10 max-w-md mx-auto"
    >
      <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/10 pointer-events-none" />

        <div className="relative z-10">
          <motion.button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-white mb-6 flex items-center gap-1 transition-colors"
            whileHover={{ x: -3 }}
          >
            ← Back
          </motion.button>

          <div className="flex justify-center mb-6">
            <LogiQuestMark size="lg" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-2">
            What&apos;s your name?
          </h2>
          <p className="text-center text-sm text-gray-400 mb-6">
            Let&apos;s make this adventure personal.
          </p>

          <form onSubmit={onSubmit}>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-5 py-4 rounded-2xl bg-black/30 border border-white/15 text-center text-lg text-white font-medium placeholder:text-gray-500 focus:outline-none focus:border-purple-500/60 transition-colors"
              maxLength={20}
              autoFocus
            />
            <motion.button
              type="submit"
              disabled={!tempName.trim()}
              className="btn-cosmic mt-4 w-full py-4 rounded-xl font-bold text-white text-lg min-h-[48px] disabled:opacity-40 disabled:cursor-not-allowed"
              whileHover={tempName.trim() ? { scale: 1.02 } : {}}
              whileTap={tempName.trim() ? { scale: 0.98 } : {}}
            >
              Let&apos;s go
            </motion.button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
