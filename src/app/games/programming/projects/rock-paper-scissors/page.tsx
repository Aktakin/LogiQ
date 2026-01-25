'use client';

import CodeTypingProject from '@/components/CodeTypingProject';

const HTML_CODE = `
<div class="game">
  <div class="card">
    <h1>🪨 Rock Paper ✂️ Scissors</h1>
    <p id="result" class="result-box">Pick your weapon! Can you beat the computer?</p>
    <p class="picks"><span id="your-pick">You: —</span> &nbsp; vs &nbsp; <span id="computer-pick">Computer: —</span></p>
    <div class="choices">
      <button type="button" data-choice="rock"><span class="emoji">🪨</span> Rock</button>
      <button type="button" data-choice="paper"><span class="emoji">📄</span> Paper</button>
      <button type="button" data-choice="scissors"><span class="emoji">✂️</span> Scissors</button>
    </div>
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
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: #f1f5f9;
}
.game { width: 100%; max-width: 380px; }
.card {
  background: linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
  border: 1px solid rgba(148,163,184,0.2);
}
.card h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.25rem 0;
  letter-spacing: -0.02em;
  background: linear-gradient(90deg, #f1f5f9, #94a3b8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.result-box {
  font-size: 1.05rem;
  margin: 0 0 0.75rem 0;
  min-height: 2.5em;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  background: rgba(15,23,42,0.6);
  border-radius: 12px;
  border: 1px solid rgba(148,163,184,0.15);
  color: #94a3b8;
}
.picks {
  margin: 0 0 1.25rem 0;
  font-size: 0.95rem;
  color: #64748b;
  text-align: center;
}
.picks span { font-weight: 600; color: #94a3b8; }
.choices { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
.card button {
  padding: 0.875rem 1.35rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 14px;
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(37,99,235,0.4);
  transition: transform 0.15s ease, box-shadow 0.15s ease, outline 0.15s ease;
  outline: 3px solid transparent;
}
.card button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37,99,235,0.5);
}
.card button:active { transform: translateY(0); }
.card button.selected {
  outline-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34,197,94,0.5), 0 4px 14px rgba(37,99,235,0.4);
}
.card button .emoji { display: inline-block; margin-right: 0.35em; font-size: 1.15em; }
`;

const EXPECTED_JS = `const choices = ['rock', 'paper', 'scissors'];
const resultEl = document.getElementById('result');
const yourPickEl = document.getElementById('your-pick');
const computerPickEl = document.getElementById('computer-pick');
const buttons = document.querySelectorAll('button[data-choice]');

function getComputerChoice() {
  const i = Math.floor(Math.random() * choices.length);
  return choices[i];
}

function play(playerChoice, clickedBtn) {
  buttons.forEach(function(b) { b.classList.remove('selected'); });
  if (clickedBtn) clickedBtn.classList.add('selected');
  yourPickEl.textContent = "You: " + playerChoice;
  const computer = getComputerChoice();
  computerPickEl.textContent = "Computer: " + computer;
  if (playerChoice === computer) {
    resultEl.textContent = "It's a tie! You both chose " + playerChoice + ". Try again!";
    resultEl.style.color = "#94a3b8";
    return;
  }
  const win = (playerChoice === 'rock' && computer === 'scissors') ||
    (playerChoice === 'paper' && computer === 'rock') ||
    (playerChoice === 'scissors' && computer === 'paper');
  if (win) {
    resultEl.textContent = "You win! " + playerChoice + " beats " + computer + ". Awesome!";
    resultEl.style.color = "#22c55e";
  } else {
    resultEl.textContent = "You lose! " + computer + " beats " + playerChoice + ". Try again!";
    resultEl.style.color = "#ef4444";
  }
}

buttons.forEach(function(btn) {
  btn.addEventListener('click', function() {
    play(btn.getAttribute('data-choice'), btn);
  });
});
`;

export default function RockPaperScissorsPage() {
  return (
    <CodeTypingProject
      title="🪨 Rock Paper Scissors Showdown"
      description="Can you beat the computer? Type the code to make rock, paper, and scissors work — then play and see if you win!"
      htmlCode={HTML_CODE}
      cssCode={CSS_CODE}
      expectedJs={EXPECTED_JS}
    />
  );
}
