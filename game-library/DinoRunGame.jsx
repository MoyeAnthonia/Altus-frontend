import { useEffect, useRef } from 'react';
import { DinoRunGame as Engine } from './dinoRunEngine.js';
import './DinoRunGame.css';

/**
 * Mounts the Dino Run canvas game.
 *
 * @param {Object} props
 * @param {'easy'|'medium'|'hard'|'score_attack'} props.difficulty
 *        Chosen on your existing difficulty-selection screen, passed in here.
 * @param {(result: {result: 'won'|'lost', score: number, finalScore: number}) => void} [props.onGameEnd]
 *        Fired once when the player wins or loses. Use this to show your own
 *        post-game UI, navigate away, save a score, etc.
 */
export default function DinoRunGame({ difficulty, onGameEnd }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      gameRef.current = new Engine({
        canvas: canvasRef.current,
        difficulty,
        onGameEnd,
      });
    };

    if (document.fonts?.ready) {
      document.fonts.load('16px "Press Start 2P"').finally(start);
    } else {
      start();
    }

    return () => {
      cancelled = true;
      gameRef.current?.destroy();
      gameRef.current = null;
    };
    // Intentionally only re-mount on first render; see note below about
    // changing difficulty without a full remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the difficulty prop can change while this component stays mounted
  // (e.g. user picks a new difficulty without navigating away), push it
  // into the engine directly rather than remounting the whole canvas.
  useEffect(() => {
    gameRef.current?.setDifficulty(difficulty);
  }, [difficulty]);

  return (
    <div className="dino-game-wrapper">
      <div className="dino-game-container">
        <canvas ref={canvasRef} />
      </div>
      <div className="dino-game-info">
        SPACE / &uarr; to jump &nbsp;|&nbsp; Score +1 per cactus cleared
      </div>
    </div>
  );
}