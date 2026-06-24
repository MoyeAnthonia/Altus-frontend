import { useState } from 'react';
import DinoRunGame from './DinoRunGame.jsx';
 
export default function ExampleGamePage() {
  const [difficulty, setDifficulty] = useState(null);
  const [result, setResult] = useState(null);
 
  if (!difficulty) {
    // Replace this block with your existing difficulty-selection component. (the one you already did on the webpage)
    // All it needs to do is call setDifficulty(key) with one of:
    // 'easy' | 'medium' | 'hard' | 'score_attack'
    return (
      <div>
        <h2>Select Difficulty</h2>
        <button onClick={() => setDifficulty('easy')}>Easy</button>
        <button onClick={() => setDifficulty('medium')}>Medium</button>
        <button onClick={() => setDifficulty('hard')}>Hard</button>
        <button onClick={() => setDifficulty('score_attack')}>Score Attack</button>
      </div>
    );
  }
 
  return (
    <div>
      <DinoRunGame
        difficulty={difficulty}
        onGameEnd={(res) => setResult(res)}
      />
      {result && (
        <div style={{ marginTop: 16 }}>
          {/* The engine already shows its own in-canvas win/lose screen.
              This is just an example of also reacting to the result
              outside the canvas — e.g. to persist the score to your backend,
              or let the player pick a new difficulty. */}
          <button onClick={() => { setDifficulty(null); setResult(null); }}>
            Choose a different difficulty
          </button>
        </div>
      )}
    </div>
  );
}
