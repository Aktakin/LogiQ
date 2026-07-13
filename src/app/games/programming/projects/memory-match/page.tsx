'use client';

import CodeTypingProject from '@/components/CodeTypingProject';

const HTML_CODE = `
<div class="pond-app">
  <header class="top-bar">
    <div class="brand">
      <span class="brand-icon">LP</span>
      <div>
        <h1>Lily Pad Memory Match</h1>
        <p class="subtitle">Flip cards, find every pair, beat your best time!</p>
      </div>
    </div>
    <div class="stats">
      <div class="stat">
        <span class="stat-label">Moves</span>
        <span id="moves" class="stat-value">0</span>
      </div>
      <div class="stat">
        <span class="stat-label">Pairs</span>
        <span id="pairs" class="stat-value">0 / 8</span>
      </div>
      <div class="stat">
        <span class="stat-label">Time</span>
        <span id="timer" class="stat-value">0:00</span>
      </div>
      <div class="stat">
        <span class="stat-label">Best</span>
        <span id="best" class="stat-value">--</span>
      </div>
    </div>
  </header>

  <section class="play-area">
    <div class="toolbar">
      <button type="button" id="new-game" class="btn primary">New game</button>
      <button type="button" id="hint" class="btn ghost">Hint</button>
      <button type="button" id="pause" class="btn ghost">Pause</button>
      <p id="status" class="status-text">Tap any card to begin.</p>
    </div>
    <div id="board" class="board" aria-label="Memory card grid"></div>
  </section>

  <footer class="footer-note">
    <span>Match all 8 letter pairs</span>
    <span>Fewer moves = higher score</span>
    <span>Timer starts on your first flip</span>
  </footer>

  <div id="overlay" class="overlay hidden" role="dialog" aria-modal="true">
    <div class="modal">
      <div class="modal-badge">Pond Champion</div>
      <h2 id="win-title">You cleared the pond!</h2>
      <p id="win-summary" class="win-summary"></p>
      <div class="score-grid">
        <div class="score-box">
          <span>Moves</span>
          <strong id="final-moves">0</strong>
        </div>
        <div class="score-box">
          <span>Time</span>
          <strong id="final-time">0:00</strong>
        </div>
        <div class="score-box">
          <span>Rating</span>
          <strong id="final-rating">Great!</strong>
        </div>
      </div>
      <button type="button" id="play-again" class="btn primary wide">Play again</button>
    </div>
  </div>

  <div id="pause-screen" class="pause-screen hidden">
    <p>Game paused</p>
    <button type="button" id="resume" class="btn primary">Resume</button>
  </div>
</div>
`;

const CSS_CODE = `
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: #ecfdf5;
  background:
    radial-gradient(circle at 20% 20%, rgba(52,211,153,0.18), transparent 28%),
    radial-gradient(circle at 80% 10%, rgba(59,130,246,0.16), transparent 24%),
    linear-gradient(160deg, #022c22 0%, #064e3b 38%, #134e4a 72%, #042f2e 100%);
}
.pond-app {
  width: min(980px, 100%);
  margin: 0 auto;
  padding: 1.25rem;
}
.top-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.brand-icon {
  width: 3.5rem;
  height: 3.5rem;
  display: grid;
  place-items: center;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  border-radius: 18px;
  background: rgba(16,185,129,0.18);
  border: 1px solid rgba(110,231,183,0.25);
  box-shadow: 0 10px 30px rgba(0,0,0,0.18);
}
.brand h1 {
  margin: 0;
  font-size: 1.45rem;
  letter-spacing: -0.02em;
}
.subtitle {
  margin: 0.2rem 0 0;
  color: #99f6e4;
  font-size: 0.92rem;
}
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}
.stat {
  min-width: 4.8rem;
  padding: 0.55rem 0.8rem;
  border-radius: 14px;
  background: rgba(2,44,34,0.55);
  border: 1px solid rgba(110,231,183,0.18);
  text-align: center;
}
.stat-label {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6ee7b7;
}
.stat-value {
  display: block;
  margin-top: 0.15rem;
  font-size: 1.05rem;
  font-weight: 700;
}
.play-area {
  background: rgba(2,44,34,0.42);
  border: 1px solid rgba(110,231,183,0.16);
  border-radius: 24px;
  padding: 1rem;
  box-shadow: 0 24px 60px rgba(0,0,0,0.22);
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
  margin-bottom: 1rem;
}
.btn {
  border: none;
  border-radius: 12px;
  padding: 0.7rem 1rem;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}
.btn:hover { transform: translateY(-1px); }
.btn:active { transform: translateY(0); }
.btn.primary {
  color: #042f2e;
  background: linear-gradient(180deg, #6ee7b7 0%, #34d399 100%);
  box-shadow: 0 8px 20px rgba(52,211,153,0.28);
}
.btn.ghost {
  color: #a7f3d0;
  background: rgba(15,118,110,0.35);
  border: 1px solid rgba(110,231,183,0.22);
}
.btn.wide { width: 100%; margin-top: 0.5rem; }
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}
.status-text {
  margin: 0 0 0 auto;
  color: #99f6e4;
  font-size: 0.92rem;
}
.board {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.8rem;
}
.card {
  aspect-ratio: 1;
  perspective: 900px;
  cursor: pointer;
}
.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.45s ease;
}
.card.flipped .card-inner,
.card.matched .card-inner {
  transform: rotateY(180deg);
}
.card-face {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 18px;
  backface-visibility: hidden;
  border: 2px solid rgba(255,255,255,0.08);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 24px rgba(0,0,0,0.18);
}
.card-front {
  background: linear-gradient(145deg, #065f46, #047857);
  font-size: 2rem;
}
.card-back {
  transform: rotateY(180deg);
  background: linear-gradient(145deg, #ecfdf5, #d1fae5);
  color: #065f46;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}
.card.matched .card-back {
  background: linear-gradient(145deg, #fef9c3, #fde68a);
  border-color: rgba(250,204,21,0.45);
}
.card.hint-flash .card-inner {
  animation: hintPulse 0.55s ease 2;
}
.card.shake .card-inner {
  animation: shake 0.35s ease;
}
@keyframes hintPulse {
  0%, 100% { transform: rotateY(180deg) scale(1); }
  50% { transform: rotateY(180deg) scale(1.06); }
}
@keyframes shake {
  0%, 100% { transform: rotateY(0deg); }
  25% { transform: rotateY(0deg) translateX(-4px); }
  75% { transform: rotateY(0deg) translateX(4px); }
}
.footer-note {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  justify-content: center;
  margin-top: 1rem;
  color: #6ee7b7;
  font-size: 0.85rem;
}
.overlay,
.pause-screen {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(2,44,34,0.72);
  backdrop-filter: blur(4px);
  z-index: 20;
}
.hidden { display: none; }
.modal {
  width: min(420px, 92vw);
  padding: 1.5rem;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(6,78,59,0.96), rgba(4,47,46,0.98));
  border: 1px solid rgba(110,231,183,0.25);
  box-shadow: 0 30px 80px rgba(0,0,0,0.35);
  text-align: center;
}
.modal-badge {
  display: inline-block;
  margin-bottom: 0.6rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(250,204,21,0.18);
  color: #fde68a;
  font-weight: 700;
  font-size: 0.85rem;
}
.modal h2 {
  margin: 0 0 0.5rem;
  font-size: 1.6rem;
}
.win-summary {
  margin: 0 0 1rem;
  color: #99f6e4;
}
.score-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
  margin-bottom: 0.5rem;
}
.score-box {
  padding: 0.75rem 0.5rem;
  border-radius: 14px;
  background: rgba(2,44,34,0.55);
  border: 1px solid rgba(110,231,183,0.16);
}
.score-box span {
  display: block;
  font-size: 0.75rem;
  color: #6ee7b7;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.score-box strong {
  display: block;
  margin-top: 0.25rem;
  font-size: 1.15rem;
}
.pause-screen p {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
@media (max-width: 640px) {
  .board { gap: 0.55rem; }
  .card-front, .card-back { font-size: 1.7rem; }
  .status-text { width: 100%; margin-left: 0; }
}
`;

const EXPECTED_JS = `const PAIR_COUNT = 8;
const boardEl = document.getElementById('board');
const movesEl = document.getElementById('moves');
const pairsEl = document.getElementById('pairs');
const timerEl = document.getElementById('timer');
const bestEl = document.getElementById('best');
const statusEl = document.getElementById('status');
const overlayEl = document.getElementById('overlay');
const pauseEl = document.getElementById('pause-screen');
const newGameBtn = document.getElementById('new-game');
const hintBtn = document.getElementById('hint');
const pauseBtn = document.getElementById('pause');
const resumeBtn = document.getElementById('resume');
const playAgainBtn = document.getElementById('play-again');
const finalMovesEl = document.getElementById('final-moves');
const finalTimeEl = document.getElementById('final-time');
const finalRatingEl = document.getElementById('final-rating');
const winSummaryEl = document.getElementById('win-summary');

let cards = [];
let firstPick = null;
let secondPick = null;
let lockBoard = false;
let moves = 0;
let matchedPairs = 0;
let seconds = 0;
let timerId = null;
let started = false;
let paused = false;
let hintsLeft = 3;

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function makeLabels() {
  const labels = [];
  for (let i = 0; i < PAIR_COUNT; i++) {
    labels.push(String.fromCharCode(65 + i));
  }
  return labels;
}

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const padded = secs < 10 ? '0' + secs : String(secs);
  return mins + ':' + padded;
}

function loadBest() {
  const saved = localStorage.getItem('lilyPadBestMoves');
  bestEl.textContent = saved ? saved + ' moves' : '--';
}

function saveBestIfBetter() {
  const saved = localStorage.getItem('lilyPadBestMoves');
  if (!saved || moves < Number(saved)) {
    localStorage.setItem('lilyPadBestMoves', String(moves));
    bestEl.textContent = moves + ' moves';
  }
}

function updateStats() {
  movesEl.textContent = String(moves);
  pairsEl.textContent = matchedPairs + ' / ' + PAIR_COUNT;
  timerEl.textContent = formatTime(seconds);
}

function startTimer() {
  if (timerId || paused) return;
  timerId = setInterval(function() {
    if (!paused) {
      seconds = seconds + 1;
      updateStats();
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function buildDeck() {
  const labels = makeLabels();
  const doubled = labels.concat(labels);
  const shuffled = shuffle(doubled);
  return shuffled.map(function(label, index) {
    return {
      id: index,
      label: label,
      matched: false
    };
  });
}

function renderBoard() {
  boardEl.innerHTML = '';
  cards.forEach(function(card) {
    const cardEl = document.createElement('button');
    cardEl.type = 'button';
    cardEl.className = 'card';
    cardEl.dataset.id = String(card.id);
    cardEl.innerHTML =
      '<div class="card-inner">' +
        '<div class="card-face card-front">?</div>' +
        '<div class="card-face card-back">' + card.label + '</div>' +
      '</div>';
    cardEl.addEventListener('click', function() {
      onCardClick(card.id);
    });
    boardEl.appendChild(cardEl);
  });
}

function getCardElement(id) {
  return boardEl.querySelector('[data-id="' + id + '"]');
}

function onCardClick(id) {
  if (lockBoard || paused) return;
  const card = cards[id];
  const cardEl = getCardElement(id);
  if (!card || card.matched || cardEl.classList.contains('flipped')) return;

  if (!started) {
    started = true;
    statusEl.textContent = 'Find matching pairs!';
    startTimer();
  }

  cardEl.classList.add('flipped');

  if (!firstPick) {
    firstPick = id;
    return;
  }

  if (firstPick === id) return;

  secondPick = id;
  lockBoard = true;
  moves = moves + 1;
  updateStats();
  checkForMatch();
}

function checkForMatch() {
  const firstCard = cards[firstPick];
  const secondCard = cards[secondPick];
  const firstEl = getCardElement(firstPick);
  const secondEl = getCardElement(secondPick);
  const isMatch = firstCard.label === secondCard.label;

  if (isMatch) {
    firstCard.matched = true;
    secondCard.matched = true;
    firstEl.classList.add('matched');
    secondEl.classList.add('matched');
    matchedPairs = matchedPairs + 1;
    resetTurn();
    if (matchedPairs === PAIR_COUNT) {
      handleWin();
    } else {
      statusEl.textContent = 'Nice match! Keep going.';
    }
    return;
  }

  statusEl.textContent = 'No match - try again.';
  firstEl.classList.add('shake');
  secondEl.classList.add('shake');
  setTimeout(function() {
    firstEl.classList.remove('flipped', 'shake');
    secondEl.classList.remove('flipped', 'shake');
    resetTurn();
  }, 700);
}

function resetTurn() {
  firstPick = null;
  secondPick = null;
  lockBoard = false;
}

function getRating() {
  if (moves <= 14) return 'Pond Legend';
  if (moves <= 18) return 'Super Frog';
  if (moves <= 24) return 'Great Job';
  return 'Keep Practicing';
}

function handleWin() {
  stopTimer();
  saveBestIfBetter();
  statusEl.textContent = 'You won!';
  finalMovesEl.textContent = String(moves);
  finalTimeEl.textContent = formatTime(seconds);
  finalRatingEl.textContent = getRating();
  winSummaryEl.textContent =
    'You matched all ' + PAIR_COUNT + ' pairs in ' + moves + ' moves and ' + formatTime(seconds) + '.';
  overlayEl.classList.remove('hidden');
}

function resetGame() {
  stopTimer();
  cards = buildDeck();
  firstPick = null;
  secondPick = null;
  lockBoard = false;
  moves = 0;
  matchedPairs = 0;
  seconds = 0;
  started = false;
  paused = false;
  hintsLeft = 3;
  overlayEl.classList.add('hidden');
  pauseEl.classList.add('hidden');
  hintBtn.disabled = false;
  statusEl.textContent = 'Tap any card to begin.';
  updateStats();
  renderBoard();
}

function showHint() {
  if (hintsLeft <= 0 || paused || lockBoard) return;
  const unmatched = cards.filter(function(card) {
    return !card.matched;
  });
  if (unmatched.length < 2) return;
  const targetLabel = unmatched[0].label;
  const pairCards = unmatched.filter(function(card) {
    return card.label === targetLabel;
  }).slice(0, 2);
  pairCards.forEach(function(card) {
    const el = getCardElement(card.id);
    el.classList.add('flipped', 'hint-flash');
    setTimeout(function() {
      if (!card.matched) {
        el.classList.remove('flipped', 'hint-flash');
      }
    }, 1100);
  });
  hintsLeft = hintsLeft - 1;
  if (hintsLeft <= 0) {
    hintBtn.disabled = true;
  }
  statusEl.textContent = 'Hint used! ' + hintsLeft + ' left.';
}

function togglePause() {
  if (!started || matchedPairs === PAIR_COUNT) return;
  paused = !paused;
  if (paused) {
    pauseEl.classList.remove('hidden');
    statusEl.textContent = 'Paused.';
  } else {
    pauseEl.classList.add('hidden');
    statusEl.textContent = 'Back in the game!';
    startTimer();
  }
}

newGameBtn.addEventListener('click', resetGame);
hintBtn.addEventListener('click', showHint);
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', togglePause);
playAgainBtn.addEventListener('click', resetGame);

loadBest();
resetGame();
`;

export default function MemoryMatchPage() {
  return (
    <CodeTypingProject
      title="Lily Pad Memory Match"
      description="A full memory card game! Match letters A through H. Type the HTML, CSS, and JavaScript on each tab."
      htmlCode={HTML_CODE}
      cssCode={CSS_CODE}
      expectedJs={EXPECTED_JS}
    />
  );
}
