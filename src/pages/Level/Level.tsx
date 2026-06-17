import styles from "./Level.module.css";
import { useNavigate } from "react-router";

function LevelSection() {
  const nav = useNavigate();
  const gameNavigate = () => {
    nav("/warmup");
  };
  return (
    <>
      <nav className={styles.lsNav}>
        <button className={styles.lsBackBtn} onClick={() => nav(-1)}>
          Back
        </button>
        <span className={styles.lsGameTitle}>Branch Hopper</span>
        <div className={styles.lsNavSpacer}></div>
      </nav>

      <main className={styles.lsMain}>
        <h1 className={styles.lsHeading}>Select Difficulty</h1>
        <p className={styles.lsSubtitle}>How many push-ups can you do?</p>

        <div className={styles.lsCards} onClick={gameNavigate}>
          {/* EASY */}
          <article
            className={`${styles.lsCard} ${styles.lsCardEasy}`}
            role="button"
            tabIndex={0}
            aria-label="Easy – 5 push-ups"
          >
            <span className={styles.lsCardLevel}>Easy</span>
            <span className={styles.lsCardCount}>5</span>
            <span className={styles.lsCardUnit}>Push-ups</span>
            <p className={styles.lsCardDesc}>Perfect for beginners</p>
            <div className={styles.lsCardDots} aria-label="Difficulty: 1 of 3">
              <span className={`${styles.lsDot} ${styles.lsDotEasy}`}></span>
              <span className={`${styles.lsDot} ${styles.lsDotEmpty}`}></span>
              <span className={`${styles.lsDot} ${styles.lsDotEmpty}`}></span>
            </div>
          </article>

          {/* MEDIUM */}
          <article
            className={`${styles.lsCard} ${styles.lsCardMedium}`}
            role="button"
            tabIndex={0}
            aria-label="Medium – 10 push-ups"
          >
            <span className={styles.lsCardLevel}>Medium</span>
            <span className={styles.lsCardCount}>10</span>
            <span className={styles.lsCardUnit}>Push-ups</span>
            <p className={styles.lsCardDesc}>A solid workout</p>
            <div className={styles.lsCardDots} aria-label="Difficulty: 2 of 3">
              <span className={`${styles.lsDot} ${styles.lsDotMedium}`}></span>
              <span className={`${styles.lsDot} ${styles.lsDotMedium}`}></span>
              <span className={`${styles.lsDot} ${styles.lsDotEmpty}`}></span>
            </div>
          </article>

          {/* HARD */}
          <article
            className={`${styles.lsCard} ${styles.lsCardHard}`}
            role="button"
            tabIndex={0}
            aria-label="Hard – 20 push-ups"
          >
            <span className={styles.lsCardLevel}>Hard</span>
            <span className={styles.lsCardCount}>20</span>
            <span className={styles.lsCardUnit}>Push-ups</span>
            <p className={styles.lsCardDesc}>For the dedicated</p>
            <div className={styles.lsCardDots} aria-label="Difficulty: 3 of 3">
              <span className={`${styles.lsDot} ${styles.lsDotHard}`}></span>
              <span className={`${styles.lsDot} ${styles.lsDotHard}`}></span>
              <span className={`${styles.lsDot} ${styles.lsDotHard}`}></span>
            </div>
          </article>
        </div>

        <p className={styles.lsFooterHint}>Select your challenge level</p>
      </main>
    </>
  );
}

export default LevelSection;
