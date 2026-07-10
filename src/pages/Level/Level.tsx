import styles from "./Level.module.css";
import { useNavigate } from "react-router";
import { useExercises } from "../../context/useExercises";
import { useSelectedGame } from "../../context/useSelectedGame";

function LevelSection() {
  const nav = useNavigate();
  const { gameId } = useSelectedGame();

  const { exercises } = useExercises();

  const gameToExerciseMap: Record<string, string> = {
    "dino-hopper": "squat",
    "lily-leaper": "push-up",
  };

  const exerciseName = gameToExerciseMap[gameId ?? ""];
  const selectedExercise = exercises.find(
    (exercise) => exercise.name.toLowerCase() === exerciseName,
  );
  const easyDifficulty = selectedExercise?.difficulties.find(
    (difficulty) => difficulty.level_name === "Easy",
  );

  const mediumDifficulty = selectedExercise?.difficulties.find(
    (difficulty) => difficulty.level_name === "Medium",
  );

  const hardDifficulty = selectedExercise?.difficulties.find(
    (difficulty) => difficulty.level_name === "Hard",
  );
  const gameNavigate = (
    difficulty: "easy" | "medium" | "hard" | "score_attack",
    exerciseDifficultyId?: string,
  ) => {
    nav("/exercise", { state: { difficulty, exerciseDifficultyId } });
  };

  return (
    <>
      <nav className={styles.lsNav}>
        <button className={styles.lsBackBtn} onClick={() => nav(-1)}>
          ← Back
        </button>
        <span className={styles.lsGameTitle}>Dino Hopper</span>
        <div className={styles.lsNavSpacer}></div>
      </nav>

      <main className={styles.lsMain}>
        <h1 className={styles.lsHeading}>Select Difficulty</h1>
        <p className={styles.lsSubtitle}>How many squats can you do?</p>

        <div className={styles.lsCards}>
          {/* EASY */}
          <article
            className={`${styles.lsCard} ${styles.lsCardEasy}`}
            role="button"
            tabIndex={0}
            aria-label="Easy – 10 push-ups"
            onClick={() => gameNavigate("easy", easyDifficulty?.id)}
            onKeyDown={(e) => e.key === "Enter" && gameNavigate("easy", easyDifficulty?.id)}
          >
            <span className={styles.lsCardLevel}>Easy</span>
            <span className={styles.lsCardCount}>{easyDifficulty?.target_reps}</span>
            <span className={styles.lsCardUnit}>Squats</span>
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
            aria-label="Medium – 20 push-ups"
            onClick={() => gameNavigate("medium", mediumDifficulty?.id)}
            onKeyDown={(e) => e.key === "Enter" && gameNavigate("medium", mediumDifficulty?.id)}
          >
            <span className={styles.lsCardLevel}>Medium</span>
            <span className={styles.lsCardCount}>{mediumDifficulty?.target_reps}</span>
            <span className={styles.lsCardUnit}>Squats</span>
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
            aria-label="Hard – 40 push-ups"
            onClick={() => gameNavigate("hard", hardDifficulty?.id)}
            onKeyDown={(e) => e.key === "Enter" && gameNavigate("hard", hardDifficulty?.id)}
          >
            <span className={styles.lsCardLevel}>Hard</span>
            <span className={styles.lsCardCount}>{hardDifficulty?.target_reps}</span>{" "}
            <span className={styles.lsCardUnit}>Squats</span>
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
