import styles from "./GameResultModal.module.css";

interface Props {
  difficulty: string;
  repGoal: number | string;
}

export default function GameIdleModal({ difficulty, repGoal }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p className={styles.title} style={{ color: "#38bdf8" }}>
          DINO RUN
        </p>

        <div className={styles.rows}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Difficulty</span>
            <span className={styles.rowValue}>{difficulty}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Rep Goal</span>
            <span className={styles.rowValue}>{repGoal === Infinity ? "∞" : repGoal}</span>
          </div>
        </div>

        <div className={styles.divider} />

        <p
          style={{
            fontFamily: 'var(--pixel, "Press Start 2P", monospace)',
            fontSize: "clamp(0.38rem, 0.9vw, 0.5rem)",
            color: "#94a3b8",
            textAlign: "center",
            letterSpacing: "0.1em",
            lineHeight: 1.8,
          }}
        >
          SQUAT TO START
        </p>
      </div>
    </div>
  );
}
