import styles from "./Modal.module.css";

// Shape of the stats the game reports when a run ends.
// Also used as the `detail` type for the "mv:gameover" CustomEvent.
export interface GameOverStats {
  baseScore: number;
  repStreak: number;
  timeSeconds: number;
  finalScore: number;
}

interface GameOverModalProps {
  isOpen: boolean;
  stats: GameOverStats;
  onPlayAgain: () => void;
  onDashboard: () => void;
}

// 92 seconds -> "01:32"
function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function GameOverModal({ isOpen, stats, onPlayAgain, onDashboard }: GameOverModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.gomOverlay} role="dialog" aria-modal="true" aria-label="Game over">
      <div className={styles.gomPanel}>
        <p className={styles.gomTitle}>Game Over</p>

        <div className={styles.gomStats}>
          <div className={styles.gomStatRow}>
            <span className={styles.gomStatLabel}>Base Score</span>
            <span className={styles.gomStatValue}>{stats.baseScore}</span>
          </div>

          <div className={styles.gomStatRow}>
            <span className={styles.gomStatLabel}>Rep Streak</span>
            <span className={styles.gomStatValue}>x{stats.repStreak}</span>
          </div>

          <div className={styles.gomStatRow}>
            <span className={styles.gomStatLabel}>Game Time</span>
            <span className={styles.gomStatValue}>{formatTime(stats.timeSeconds)}</span>
          </div>

          <div className={`${styles.gomStatRow} ${styles.gomFinalRow}`}>
            <span className={styles.gomFinalLabel}>Final Score</span>
            <span className={styles.gomFinalValue}>{stats.finalScore}</span>
          </div>
        </div>

        <div className={styles.gomActions}>
          <button className={styles.gomRetryBtn} onClick={onPlayAgain}>
            Squat to Play Again
          </button>
          <button className={styles.gomDashBtn} onClick={onDashboard}>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOverModal;
