import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AgeGroup = '4-6' | '7-9' | '10-12' | null;
export type GameType =
  | 'programming'
  | 'patterns'
  | 'sequences'
  | 'deduction'
  | 'spatial'
  | 'maze'
  | 'dino'
  | 'matrix-reasoning'
  | 'analogy-lab'
  | 'transitive-trails'
  | 'rule-switch'
  | 'syllogism-snap'
  | 'truth-gates'
  | 'loop-lab'
  | 'output-oracle'
  | 'shape-sorter'
  | 'color-coder';

interface GameProgress {
  gamesPlayed: number;
  correctAnswers: number;
  currentStreak: number;
  bestStreak: number;
  totalStars: number;
  levelsByGame: Record<GameType, number>;
}

interface GameState {
  ageGroup: AgeGroup;
  playerName: string;
  progress: GameProgress;
  soundEnabled: boolean;
  
  // Actions
  setAgeGroup: (age: AgeGroup) => void;
  setPlayerName: (name: string) => void;
  incrementGamesPlayed: () => void;
  recordAnswer: (correct: boolean) => void;
  addStars: (count: number) => void;
  levelUp: (game: GameType) => void;
  toggleSound: () => void;
  resetProgress: () => void;
}

const initialProgress: GameProgress = {
  gamesPlayed: 0,
  correctAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalStars: 0,
  levelsByGame: {
    programming: 1,
    patterns: 1,
    sequences: 1,
    deduction: 1,
    spatial: 1,
    maze: 1,
    dino: 1,
    'matrix-reasoning': 1,
    'analogy-lab': 1,
    'transitive-trails': 1,
    'rule-switch': 1,
    'syllogism-snap': 1,
    'truth-gates': 1,
    'loop-lab': 1,
    'output-oracle': 1,
    'shape-sorter': 1,
    'color-coder': 1,
  },
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ageGroup: null,
      playerName: '',
      progress: initialProgress,
      soundEnabled: true,

      setAgeGroup: (age) => set({ ageGroup: age }),
      
      setPlayerName: (name) => set({ playerName: name }),
      
      incrementGamesPlayed: () =>
        set((state) => ({
          progress: {
            ...state.progress,
            gamesPlayed: state.progress.gamesPlayed + 1,
          },
        })),
      
      recordAnswer: (correct) =>
        set((state) => {
          const newStreak = correct ? state.progress.currentStreak + 1 : 0;
          return {
            progress: {
              ...state.progress,
              correctAnswers: correct
                ? state.progress.correctAnswers + 1
                : state.progress.correctAnswers,
              currentStreak: newStreak,
              bestStreak: Math.max(newStreak, state.progress.bestStreak),
            },
          };
        }),
      
      addStars: (count) =>
        set((state) => ({
          progress: {
            ...state.progress,
            totalStars: state.progress.totalStars + count,
          },
        })),
      
      levelUp: (game) =>
        set((state) => ({
          progress: {
            ...state.progress,
            levelsByGame: {
              ...state.progress.levelsByGame,
              [game]: state.progress.levelsByGame[game] + 1,
            },
          },
        })),
      
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      
      resetProgress: () => set({ progress: initialProgress }),
    }),
    {
      name: 'logiquest-storage',
    }
  )
);

