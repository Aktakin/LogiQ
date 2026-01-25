'use client';

import CodeTypingProject from '@/components/CodeTypingProject';

const HTML_CODE = `
<div class="game">
  <div class="card">
    <h1>🃏 Pick a Card</h1>
    <p class="hint">Click the button to draw a random card!</p>
    <button type="button" id="pick">Pick a card</button>
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
  background: linear-gradient(135deg, #1e3a2f 0%, #0d2818 50%, #1e3a2f 100%);
  color: #ecfdf5;
}
.game { width: 100%; max-width: 360px; }
.card {
  background: linear-gradient(180deg, rgba(30,58,47,0.95) 0%, rgba(13,40,24,0.98) 100%);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset;
  border: 1px solid rgba(52,211,153,0.25);
  text-align: center;
}
.card h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
  color: #a7f3d0;
}
.hint {
  margin: 0 0 1.5rem 0;
  color: #94a3b8;
  font-size: 0.95rem;
}
.card-display {
  width: 120px;
  height: 160px;
  margin: 0 auto 1rem auto;
  background: linear-gradient(145deg, #fefce8 0%, #fef9c3 100%);
  border-radius: 12px;
  border: 3px solid #e2e8f0;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}
#card-suit {
  font-size: 4rem;
  line-height: 1;
  color: #64748b;
}
#card-suit.red { color: #dc2626; }
#card-suit.black { color: #1e293b; }
.card #pick {
  margin-top: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 14px;
  background: linear-gradient(180deg, #059669 0%, #047857 100%);
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(5,150,105,0.4);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.card #pick:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(5,150,105,0.5); }
.card #pick:active { transform: translateY(0); }
.result-box {
  margin: 0 0 0.25rem 0;
  min-height: 1.5em;
  font-size: 1rem;
  font-weight: 700;
  color: #6ee7b7;
  padding: 0.5rem;
}
`;

const EXPECTED_JS = `const cards = ['Ace of Hearts', 'King of Spades', 'Queen of Diamonds', 'Jack of Clubs', '10 of Hearts', '7 of Spades', '3 of Diamonds', 'Ace of Clubs', '2 of Hearts', '9 of Spades'];
const pickBtn = document.getElementById('pick');
const resultEl = document.getElementById('result');
const cardSuitEl = document.getElementById('card-suit');
const suits = { Hearts: '♥', Spades: '♠', Diamonds: '♦', Clubs: '♣' };

pickBtn.addEventListener('click', function() {
  const i = Math.floor(Math.random() * cards.length);
  const name = cards[i];
  resultEl.textContent = name;
  const parts = name.split(' of ');
  const suitName = parts[1];
  cardSuitEl.textContent = suits[suitName] || '?';
  cardSuitEl.className = (suitName === 'Hearts' || suitName === 'Diamonds') ? 'red' : 'black';
});
`;

export default function PickACardPage() {
  return (
    <CodeTypingProject
      title="🃏 Magic Card Deck"
      description="Draw a mystery card! Type the code so your deck has cool cards and the button picks one at random."
      htmlCode={HTML_CODE}
      cssCode={CSS_CODE}
      expectedJs={EXPECTED_JS}
    />
  );
}
