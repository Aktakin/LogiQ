'use client';

import CodeTypingProject from '@/components/CodeTypingProject';

const HTML_CODE = `
<div class="game">
  <div class="card">
    <h1>🎲 Secret Number Challenge</h1>
    <p id="hint" class="hint">I'm hiding a number from 1 to 10. Can you guess it?</p>
    <div class="input-row">
      <input type="number" id="guess" min="1" max="10" placeholder="1–10" inputmode="numeric" />
      <button type="button" id="check">Am I right?</button>
      <button type="button" id="reset">Play again!</button>
    </div>
    <p id="result" class="result-box"></p>
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
  background: linear-gradient(135deg, #0c4a6e 0%, #0e7490 30%, #155e75 70%, #0c4a6e 100%);
  color: #e2e8f0;
}
.game { width: 100%; max-width: 360px; }
.card {
  background: linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(6,28,44,0.98) 100%);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06) inset;
  border: 1px solid rgba(94,234,212,0.2);
}
.card h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
  color: #f0fdfa;
}
.hint {
  margin: 0 0 1.25rem 0;
  color: #94a3b8;
  font-size: 0.95rem;
}
.input-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}
.card input {
  padding: 0.75rem 1rem;
  font-size: 1.1rem;
  border-radius: 12px;
  border: 2px solid rgba(94,234,212,0.3);
  background: rgba(15,23,42,0.6);
  color: #f0fdfa;
  width: 5rem;
  text-align: center;
}
.card input:focus {
  outline: none;
  border-color: #2dd4bf;
  box-shadow: 0 0 0 3px rgba(45,212,191,0.2);
}
.card input::placeholder { color: #64748b; }
.card #check {
  padding: 0.75rem 1.35rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  background: linear-gradient(180deg, #06b6d4 0%, #0891b2 100%);
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(8,145,178,0.4);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.card #check:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(8,145,178,0.5); }
.card #check:active { transform: translateY(0); }
.card #check:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.card #reset {
  padding: 0.75rem 1.35rem;
  font-size: 1rem;
  font-weight: 600;
  border: 2px solid rgba(148,163,184,0.5);
  border-radius: 12px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}
.card #reset:hover { border-color: #94a3b8; color: #e2e8f0; transform: translateY(-2px); }
.card #reset:active { transform: translateY(0); }
.result-box {
  margin: 0;
  min-height: 2em;
  font-size: 1.05rem;
  font-weight: 600;
  text-align: center;
  padding: 0.5rem;
  border-radius: 10px;
  background: rgba(15,23,42,0.5);
}
`;

const EXPECTED_JS = `let secret = Math.floor(Math.random() * 10) + 1;
const hintEl = document.getElementById('hint');
const guessInput = document.getElementById('guess');
const checkBtn = document.getElementById('check');
const resultEl = document.getElementById('result');
const resetBtn = document.getElementById('reset');

checkBtn.addEventListener('click', function() {
  const num = parseInt(guessInput.value, 10);
  if (isNaN(num) || num < 1 || num > 10) {
    resultEl.textContent = "Please enter a number from 1 to 10.";
    return;
  }
  if (num === secret) {
    resultEl.textContent = "You got it! The number was " + secret + ".";
    resultEl.style.color = "#22c55e";
    checkBtn.disabled = true;
    return;
  }
  resultEl.textContent = num < secret ? "Too low! Try again." : "Too high! Try again.";
  resultEl.style.color = "#f59e0b";
});

resetBtn.addEventListener('click', function() {
  secret = Math.floor(Math.random() * 10) + 1;
  guessInput.value = "";
  resultEl.textContent = "";
  resultEl.style.color = "";
  checkBtn.disabled = false;
});
`;

export default function GuessTheNumberPage() {
  return (
    <CodeTypingProject
      title="🎲 Secret Number Challenge"
      description="Crack the secret number! Type the code so the game picks a number 1–10 and tells players if they're right."
      htmlCode={HTML_CODE}
      cssCode={CSS_CODE}
      expectedJs={EXPECTED_JS}
    />
  );
}
