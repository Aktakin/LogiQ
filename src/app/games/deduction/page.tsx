'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Confetti from '@/components/Confetti';
import FloatingShapes from '@/components/FloatingShapes';

interface Puzzle {
  scenario: string;
  clues: string[];
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

const puzzlesByAge: Record<string, Puzzle[]> = {
  '4-6': [
    {
      scenario: '🐕 Three puppies are playing in the park!',
      clues: ['🐕 Spot has black spots', '🐕 Buddy is brown', '🐕 Max is white with a red collar'],
      question: 'Which puppy has spots?',
      options: ['Spot', 'Buddy', 'Max'],
      answer: 'Spot',
      explanation: 'Spot has black spots - his name gives us a clue!',
    },
    {
      scenario: '🎈 Kids are holding balloons at a party!',
      clues: ['🎈 Mia has a red balloon', '🎈 Tom has a blue balloon', '🎈 Sara has a yellow balloon'],
      question: 'Who has the blue balloon?',
      options: ['Mia', 'Tom', 'Sara'],
      answer: 'Tom',
      explanation: 'The clues tell us Tom has the blue balloon!',
    },
    {
      scenario: '🍎 Fruits are in a basket!',
      clues: ['🍎 The apple is red', '🍌 The banana is yellow', '🍇 The grapes are purple'],
      question: 'What color is the banana?',
      options: ['Red', 'Yellow', 'Purple'],
      answer: 'Yellow',
      explanation: 'Bananas are yellow!',
    },
    {
      scenario: '🏠 Three friends live on the same street!',
      clues: ['🏠 Emma lives in the blue house', '🏠 Jack lives in the red house', '🏠 Lily lives next to Emma'],
      question: 'Who lives in the blue house?',
      options: ['Emma', 'Jack', 'Lily'],
      answer: 'Emma',
      explanation: 'The first clue tells us Emma lives in the blue house!',
    },
  ],
  '7-9': [
    {
      scenario: '🎒 Three students have different favorite subjects!',
      clues: [
        '📚 Alex loves reading but not math',
        '🔢 Beth does not like art or reading',
        '🎨 Carlos is best at art',
      ],
      question: 'Who loves math?',
      options: ['Alex', 'Beth', 'Carlos'],
      answer: 'Beth',
      explanation: 'Alex likes reading, Carlos likes art, so Beth must like math!',
    },
    {
      scenario: '🐱 Three cats live in different colored houses!',
      clues: [
        '🏠 Whiskers does not live in the blue or green house',
        '🏠 Mittens lives in the green house',
        '🏠 Shadow lives next to the red house',
      ],
      question: 'Where does Whiskers live?',
      options: ['Blue house', 'Green house', 'Red house'],
      answer: 'Red house',
      explanation: 'Mittens is in green, Whiskers is not in blue or green, so red!',
    },
    {
      scenario: '🍕 Three friends ordered different pizzas!',
      clues: [
        '🍕 Maya did not order pepperoni or cheese',
        '🍕 Noah ordered pepperoni',
        '🍕 Olivia does not like vegetables',
      ],
      question: 'What did Maya order?',
      options: ['Pepperoni', 'Cheese', 'Vegetable'],
      answer: 'Vegetable',
      explanation: 'Noah has pepperoni, Maya doesn\'t want pepperoni or cheese, so vegetable!',
    },
    {
      scenario: '🎮 Three kids played different games today!',
      clues: [
        '🎮 If Sam played soccer, then Tina played chess',
        '🎮 Tina did not play chess',
        '🎮 Uma played video games',
      ],
      question: 'What did Sam play?',
      options: ['Soccer', 'Chess', 'Something else'],
      answer: 'Something else',
      explanation: 'If Tina didn\'t play chess, Sam couldn\'t have played soccer!',
    },
  ],
  '10-12': [
    {
      scenario: '🔍 A detective is solving a mystery at school!',
      clues: [
        '🔍 The culprit is taller than Mike',
        '🔍 Sarah is the tallest in the group',
        '🔍 The culprit wears glasses',
        '🔍 Mike and Tom wear glasses, Sarah does not',
      ],
      question: 'Who is the culprit?',
      options: ['Mike', 'Sarah', 'Tom'],
      answer: 'Tom',
      explanation: 'Must be taller than Mike AND wear glasses. Sarah is tall but no glasses. Tom fits!',
    },
    {
      scenario: '🏆 Three teams competed in a tournament!',
      clues: [
        '🏆 Team A did not come first or last',
        '🏆 Team B beat Team C',
        '🏆 Team C did not come second',
      ],
      question: 'Which team won first place?',
      options: ['Team A', 'Team B', 'Team C'],
      answer: 'Team B',
      explanation: 'A is second (not first/last), C is last (B beat C, C not second), so B is first!',
    },
    {
      scenario: '🎭 Four actors are rehearsing for a play!',
      clues: [
        '🎭 The lead role goes to someone older than Diana',
        '🎭 Eric is older than Fiona but younger than Diana',
        '🎭 Grace is the oldest of all',
        '🎭 The lead role needs someone who can sing',
        '🎭 Only Grace and Eric can sing',
      ],
      question: 'Who gets the lead role?',
      options: ['Diana', 'Eric', 'Fiona', 'Grace'],
      answer: 'Grace',
      explanation: 'Must be older than Diana AND can sing. Only Grace is older than Diana and can sing!',
    },
    {
      scenario: '🔐 Crack the code to open the vault!',
      clues: [
        '🔢 The code is a 3-digit number',
        '🔢 All digits are different',
        '🔢 The first digit is twice the third digit',
        '🔢 The second digit is the sum of the other two',
        '🔢 The third digit is 2',
      ],
      question: 'What is the code?',
      options: ['426', '462', '624'],
      answer: '462',
      explanation: 'Third=2, First=2×2=4, Second=4+2=6. Code is 462!',
    },
  ],
};

export default function DeductionGame() {
  const router = useRouter();
  const { ageGroup, progress, recordAnswer, addStars, levelUp, incrementGamesPlayed } = useGameStore();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealedClues, setRevealedClues] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const totalRounds = 4;

  const level = progress.levelsByGame.deduction;

  const loadPuzzle = useCallback(() => {
    if (ageGroup) {
      const puzzles = puzzlesByAge[ageGroup];
      const idx = (puzzleIndex + round - 1) % puzzles.length;
      setPuzzle(puzzles[idx]);
      setSelected(null);
      setIsCorrect(null);
      setRevealedClues([0]); // Start with first clue revealed
    }
  }, [ageGroup, puzzleIndex, round]);

  useEffect(() => {
    if (!ageGroup) {
      router.push('/');
      return;
    }
    // Randomize starting puzzle
    setPuzzleIndex(Math.floor(Math.random() * puzzlesByAge[ageGroup].length));
  }, [ageGroup, router]);

  useEffect(() => {
    if (ageGroup) {
      loadPuzzle();
    }
  }, [ageGroup, loadPuzzle]);

  const revealNextClue = () => {
    if (puzzle && revealedClues.length < puzzle.clues.length) {
      setRevealedClues(prev => [...prev, prev.length]);
    }
  };

  const handleSelect = (option: string) => {
    if (selected || !puzzle) return;
    
    setSelected(option);
    const correct = option === puzzle.answer;
    setIsCorrect(correct);
    recordAnswer(correct);
    incrementGamesPlayed();

    if (correct) {
      const clueBonus = puzzle.clues.length - revealedClues.length;
      const points = 10 + clueBonus * 5;
      setScore(prev => prev + points);
      setShowConfetti(true);
      addStars(2 + clueBonus);
      setTimeout(() => setShowConfetti(false), 2000);
    }

    // Reveal all clues on answer
    setRevealedClues(puzzle.clues.map((_, i) => i));

    setTimeout(() => {
      if (round < totalRounds) {
        setRound(prev => prev + 1);
        loadPuzzle();
      }
    }, 3000);
  };

  const handleComplete = () => {
    if (score >= 35) {
      levelUp('deduction');
    }
    router.push('/dashboard');
  };

  if (!puzzle) return null;

  const gameComplete = round > totalRounds || (round === totalRounds && isCorrect !== null);

  return (
    <main className="min-h-screen p-6 md:p-10 relative">
      <FloatingShapes />
      <Confetti show={showConfetti} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mb-8"
      >
        <div className="flex items-center justify-between">
          <motion.button
            onClick={() => router.push('/dashboard')}
            className="glass px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-colors"
            whileHover={{ scale: 1.05, x: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back
          </motion.button>

          <div className="flex items-center gap-6">
            <div className="glass px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-gray-400">Case</div>
              <div className="text-lg font-bold text-white">{Math.min(round, totalRounds)}/{totalRounds}</div>
            </div>
            <div className="glass px-4 py-2 rounded-xl text-center">
              <div className="text-xs text-gray-400">Score</div>
              <div className="text-lg font-bold text-yellow-400">⭐ {score}</div>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {!gameComplete ? (
          <motion.div
            key={`round-${round}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto relative z-10"
          >
            {/* Title */}
            <motion.div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">🔍 Logic Detective</h1>
              <p className="text-gray-400 text-lg">Use the clues to solve the mystery!</p>
            </motion.div>

            {/* Scenario */}
            <motion.div
              className="glass rounded-2xl p-6 mb-6 text-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <p className="text-xl text-white">{puzzle.scenario}</p>
            </motion.div>

            {/* Clues */}
            <motion.div className="glass rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                📋 Clues
                <span className="text-sm text-gray-400 font-normal">
                  ({revealedClues.length}/{puzzle.clues.length} revealed)
                </span>
              </h3>
              <div className="space-y-3">
                {puzzle.clues.map((clue, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: revealedClues.includes(index) ? 1 : 0.3,
                      x: 0,
                    }}
                    transition={{ delay: index * 0.2 }}
                    className={`p-3 rounded-xl ${
                      revealedClues.includes(index)
                        ? 'bg-white/10'
                        : 'bg-white/5'
                    }`}
                  >
                    {revealedClues.includes(index) ? (
                      <p className="text-white">{clue}</p>
                    ) : (
                      <p className="text-gray-500 italic">Clue hidden...</p>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Reveal more clues button */}
              {revealedClues.length < puzzle.clues.length && selected === null && (
                <motion.button
                  onClick={revealNextClue}
                  className="mt-4 w-full glass px-4 py-3 rounded-xl text-yellow-400 hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💡 Reveal another clue (-5 points)
                </motion.button>
              )}
            </motion.div>

            {/* Question */}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-bold text-purple-400 mb-4">{puzzle.question}</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {puzzle.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleSelect(option)}
                    disabled={selected !== null}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={selected === null ? { scale: 1.05 } : {}}
                    whileTap={selected === null ? { scale: 0.95 } : {}}
                    className={`px-8 py-4 rounded-2xl text-lg font-semibold transition-all ${
                      selected === option
                        ? isCorrect
                          ? 'bg-green-500/30 border-2 border-green-400 text-green-400'
                          : 'bg-red-500/30 border-2 border-red-400 text-red-400'
                        : selected !== null && option === puzzle.answer
                          ? 'bg-green-500/30 border-2 border-green-400 text-green-400'
                          : 'bg-white/5 hover:bg-white/10 border-2 border-transparent text-white'
                    }`}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Explanation */}
            <AnimatePresence>
              {isCorrect !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-2xl p-6 text-center"
                >
                  <p className={`text-2xl font-bold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? '🎉 Case Solved!' : '🤔 Not quite right...'}
                  </p>
                  <p className="text-gray-300">{puzzle.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center relative z-10"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-8xl mb-6"
            >
              🕵️
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-4">Investigation Complete!</h2>
            <div className="glass rounded-2xl p-6 mb-6">
              <div className="text-5xl font-bold text-yellow-400 mb-2">⭐ {score}</div>
              <p className="text-gray-400">points earned</p>
              {score >= 35 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-400 mt-4 font-semibold"
                >
                  🎉 Level Up! You&apos;re now Level {level + 1}!
                </motion.p>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={() => { setRound(1); setScore(0); setPuzzleIndex(prev => prev + 1); loadPuzzle(); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass px-6 py-3 rounded-xl text-white"
              >
                🔄 New Cases
              </motion.button>
              <motion.button
                onClick={handleComplete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-cosmic px-6 py-3 rounded-xl"
              >
                <span>✓ Done</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}


