'use client';

import { motion } from 'framer-motion';
import FloatingShapes from './FloatingShapes';

interface Skill {
  label: string;
  icon: string;
}

interface AssessmentIntroProps {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  skills: Skill[];
  totalQuestions: number;
  timePerQuestion: number;
  color: string;
  onStart: () => void;
  onBack: () => void;
}

export default function AssessmentIntro({
  icon,
  title,
  subtitle,
  description,
  skills,
  totalQuestions,
  timePerQuestion,
  color,
  onStart,
  onBack,
}: AssessmentIntroProps) {
  return (
    <main className="min-h-screen min-h-[100dvh] p-4 sm:p-6 md:p-8 relative flex items-center justify-center">
      <FloatingShapes />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-xl"
      >
        <div
          className="glass rounded-3xl p-6 sm:p-8 border"
          style={{ borderColor: `${color}40` }}
        >
          {/* Icon + Title */}
          <div className="text-center mb-6">
            <motion.div
              className="text-5xl sm:text-6xl mb-3"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {icon}
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{title}</h1>
            <p className="text-gray-400 text-sm sm:text-base">{subtitle}</p>
          </div>

          {/* Description */}
          <div
            className="rounded-2xl p-4 mb-5 text-sm sm:text-base text-gray-200 leading-relaxed"
            style={{ backgroundColor: `${color}10`, border: `1px solid ${color}25` }}
          >
            {description}
          </div>

          {/* Skills */}
          <div className="mb-5">
            <h3 className="text-white font-semibold text-sm mb-3">Skills you will build:</h3>
            <div className="grid grid-cols-2 gap-2">
              {skills.map((skill) => (
                <div
                  key={skill.label}
                  className="flex items-center gap-2 rounded-xl p-2.5 bg-white/5 border border-white/10"
                >
                  <span className="text-lg flex-shrink-0">{skill.icon}</span>
                  <span className="text-xs sm:text-sm text-gray-300">{skill.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3 mb-6">
            <div
              className="flex-1 rounded-xl p-3 text-center"
              style={{ backgroundColor: `${color}15`, border: `1px solid ${color}20` }}
            >
              <div className="text-xl sm:text-2xl font-bold text-white">{totalQuestions}</div>
              <div className="text-xs text-gray-400">Questions</div>
            </div>
            <div
              className="flex-1 rounded-xl p-3 text-center"
              style={{ backgroundColor: `${color}15`, border: `1px solid ${color}20` }}
            >
              <div className="text-xl sm:text-2xl font-bold text-white">{timePerQuestion}s</div>
              <div className="text-xs text-gray-400">Per question</div>
            </div>
            <div
              className="flex-1 rounded-xl p-3 text-center"
              style={{ backgroundColor: `${color}15`, border: `1px solid ${color}20` }}
            >
              <div className="text-xl sm:text-2xl font-bold text-white">⭐</div>
              <div className="text-xs text-gray-400">Earn stars</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              onClick={onStart}
              className="btn-cosmic flex-1 px-6 py-3.5 text-base font-semibold min-h-[48px] touch-target"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Start Assessment →
            </motion.button>
            <motion.button
              onClick={onBack}
              className="glass px-5 py-3 rounded-xl text-gray-300 hover:text-white text-sm min-h-[48px] touch-target"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              ← Back
            </motion.button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
