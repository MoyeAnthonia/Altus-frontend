// src/pages/Game/GameResultModal.tsx
import styles from './GameResultModal.module.css';
import type { GameEndResult } from '../../engine/DinoRunGameEngine';

interface Props {
  result: GameEndResult;
  onRetry: () => void;
  onExit: () => void;
}

export default function GameResultModal({ result, onRetry, onExit }: Props) {
  const won = result.result === 'won';

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Title */}
        <p className={`${styles.title} ${won ? styles.titleWin : styles.titleLose}`}>
          {won ? '🏆 YOU WIN!' : 'GAME OVER'}
        </p>

        {/* Score breakdown rows */}
        <div className={styles.rows}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Base Score</span>
            <span className={styles.rowValue}>{result.score * 100}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Rep Streak ({result.score} reps)</span>
            <span className={styles.rowValue}>×{result.repStreak.toFixed(1)}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Game Time ({result.secs}s)</span>
            <span className={styles.rowValue}>×{result.timeMult.toFixed(2)}</span>
          </div>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Difficulty</span>
          <span className={styles.rowValue}>×{result.diffMult.toFixed(1)}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Close Calls ({result.closeCallCount})</span>
          <span className={styles.rowValue}>×{result.closeCallMult.toFixed(2)}</span>
        </div>

        <div className={styles.divider} />

        {/* Final score */}
        <div className={styles.finalRow}>
          <span className={styles.finalLabel}>FINAL SCORE</span>
          <span className={`styles.finalValue ${won ? styles.finalWin : styles.finalLose}`}>
            {result.finalScore}
          </span>
        </div>

        {/* Buttons */}
        <div className={styles.actions}>
          <button className={styles.retryBtn} onClick={onRetry}>
            Squat to Retry
          </button>
          <button className={styles.exitBtn} onClick={onExit}>
            ← Change Difficulty
          </button>
        </div>

      </div>
    </div>
  );
}