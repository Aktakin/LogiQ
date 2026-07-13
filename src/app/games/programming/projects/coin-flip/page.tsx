'use client';

import CodeTypingProject from '@/components/CodeTypingProject';

const HTML_CODE = `
<div class="game">
  <div class="card">
    <h1>🪙 Coin Flip Challenge</h1>
    <p id="result" class="result-box">Pick heads or tails — can you beat the computer?</p>
    <p class="picks"><span id="your-pick">You: —</span> &nbsp; vs &nbsp; <span id="flip-pick">Flip: —</span></p>
    <div class="choices">
      <button type="button" data-choice="heads"><span class="emoji">👑</span> Heads</button>
      <button type="button" data-choice="tails"><span class="emoji">🦊</span> Tails</button>
    </div>
    <p id="score" class="score">Wins: 0 &nbsp;|&nbsp; Losses: 0</p>
  </div>
</div>
`;

const CSS_CODE = `
* { box-sizing: border-box; }
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #422006 0%, #78350f 45%, #451a03 100%);
  color: #fef3c7;
}
.game { width: 100%; max-width: 380px; }
.card {
  background: linear-gradient(180deg, rgba(69,26,3,0.95) 0%, rgba(28,15,4,0.98) 100%);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
  border: 1px solid rgba(251,191,36,0.25);
}
.card h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.25rem 0;
  letter-spacing: -0.02em;
  color: #fde68a;
}
.result-box {
  font-size: 1.05rem;
  margin: 0 0 0.75rem 0;
  min-height: 2.5em;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  background: rgba(28,15,4,0.6);
  border-radius: 12px;
  border: 1px solid rgba(251,191,36,0.15);
  color: #fcd34d;
}
.picks {
  margin: 0 0 1.25rem 0;
  font-size: 0.95rem;
  color: #d97706;
  text-align: center;
}
.picks span { font-weight: 600; color: #fde68a; }
.choices { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
.card button {
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 14px;
  background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
  color: #451a03;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(217,119,6,0.4);
  transition: transform 0.15s ease, box-shadow 0.15s ease, outline 0.15s ease;
  outline: 3px solid transparent;
}
.card button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(217,119,6,0.5);
}
.card button:active { transform: translateY(0); }
.card button.selected {
  outline-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34,197,94,0.5), 0 4px 14px rgba(217,119,6,0.4);
}
.card button .emoji { display: inline-block; margin-right: 0.35em; font-size: 1.15em; }
.score {
  margin: 1.25rem 0 0 0;
  text-align: center;
  font-size: 0.95rem;
  color: #fbbf24;
  font-weight: 600;
}
`;

const EXPECTED_JS = `const sides = ['heads', 'tails'];
const resultEl = document.getElementById('result');
const yourPickEl = document.getElementById('your-pick');
const flipPickEl = document.getElementById('flip-pick');
const scoreEl = document.getElementById('score');
const buttons = document.querySelectorAll('button[data-choice]');
let wins = 0;
let losses = 0;

function flipCoin() {
  const i = Math.floor(Math.random() * sides.length);
  return sides[i];
}

function updateScore() {
  scoreEl.textContent = "Wins: " + wins + "  |  Losses: " + losses;
}

function play(playerChoice, clickedBtn) {
  buttons.forEach(function(b) { b.classList.remove('selected'); });
  if (clickedBtn) clickedBtn.classList.add('selected');
  yourPickEl.textContent = "You: " + playerChoice;
  const flip = flipCoin();
  flipPickEl.textContent = "Flip: " + flip;
  if (playerChoice === flip) {
    wins = wins + 1;
    resultEl.textContent = "You win! The coin landed on " + flip + ". Nice guess!";
    resultEl.style.color = "#22c55e";
  } else {
    losses = losses + 1;
    resultEl.textContent = "You lose! It was " + flip + ", not " + playerChoice + ". Try again!";
    resultEl.style.color = "#ef4444";
  }
  updateScore();
}

buttons.forEach(function(btn) {
  btn.addEventListener('click', function() {
    play(btn.getAttribute('data-choice'), btn);
  });
});
`;

export default function CoinFlipPage() {
  return (
    <CodeTypingProject
      title="🪙 Coin Flip Challenge"
      description="Heads or tails? Type the code to flip the coin, track your wins, and see if you can beat luck!"
      htmlCode={HTML_CODE}
      cssCode={CSS_CODE}
      expectedJs={EXPECTED_JS}
    />
  );
}
