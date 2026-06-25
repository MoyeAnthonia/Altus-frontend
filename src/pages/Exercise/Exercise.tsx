import styles from "./Exercise.module.css";
import { useNavigate } from "react-router";

/* ── Types ── */
interface Platform {
  id: string;
  top: string;
  left: string;
  width: string;
}

/* ── Static game-state data (wire to useState in Week 2) ── */
const REPS_DONE = 1;
const REPS_TOTAL = 5;
const SCORE = 10;
const MULTIPLIER = 1;
const PROGRESS_PCT = Math.round((REPS_DONE / REPS_TOTAL) * 100);

const platforms: Platform[] = [
  { id: "p1", top: "18%", left: "52%", width: "140px" },
  { id: "p2", top: "34%", left: "62%", width: "110px" },
  { id: "p3", top: "52%", left: "55%", width: "130px" },
  { id: "p4", top: "68%", left: "64%", width: "90px" },
];

/* ── Component ── */
function GamePage() {
  const nav = useNavigate();
  return (
    <div className={styles.gphPage}>
      <div className={styles.gphArena}>
        {/* ── LEFT: CAMERA PANEL ── */}
        <div className={styles.gphCamera}>
          {/* Back button */}
          <button className={styles.gphBackBtn} onClick={() => nav(-1)}>
            ← Back
          </button>

          {/* Reps badge — hangs from top-centre */}
          <div className={styles.gphRepsBadge}>
            <span className={styles.gphRepsBadgeLabel}>Reps</span>
            <span className={styles.gphRepsBadgeCount}>{REPS_DONE}</span>
          </div>

          {/* Corner brackets */}
          <div className={`${styles.gphCorner} ${styles.gphCornerTl}`}></div>
          <div className={`${styles.gphCorner} ${styles.gphCornerTr}`}></div>
          <div className={`${styles.gphCorner} ${styles.gphCornerBl}`}></div>
          <div className={`${styles.gphCorner} ${styles.gphCornerBr}`}></div>

          {/* Stick figure (Week 4: replace with <canvas> for MediaPipe) */}
          <svg
            className={styles.gphStickFigure}
            viewBox="0 0 100 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* head */}
            <circle cx="50" cy="20" r="16" stroke="#38e1ff" strokeWidth="2" />
            {/* body */}
            <line x1="50" y1="36" x2="50" y2="90" stroke="#38e1ff" strokeWidth="2" />
            {/* left arm */}
            <line x1="50" y1="55" x2="20" y2="78" stroke="#38e1ff" strokeWidth="2" />
            {/* right arm */}
            <line x1="50" y1="55" x2="80" y2="78" stroke="#38e1ff" strokeWidth="2" />
            {/* left leg */}
            <line x1="50" y1="90" x2="25" y2="130" stroke="#38e1ff" strokeWidth="2" />
            {/* right leg */}
            <line x1="50" y1="90" x2="75" y2="130" stroke="#38e1ff" strokeWidth="2" />
            {/* wrist joints */}
            <circle cx="20" cy="78" r="6" stroke="#f59e0b" strokeWidth="1.8" />
            <circle cx="80" cy="78" r="6" stroke="#f59e0b" strokeWidth="1.8" />
          </svg>

          {/* Tracking CTA */}
          <button className={styles.gphTrackingBtn}>
            <span className={styles.gphTrackingDot}></span>
            Tracking · Push Up [Space]
          </button>
        </div>

        {/* ── MIDDLE: REP PROGRESS BAR ── */}
        <div className={styles.gphProgressCol}>
          <div className={styles.gphProgressTrack}>
            {/* tick marks */}
            <div className={styles.gphProgressSegments}>
              {Array.from({ length: REPS_TOTAL - 1 }).map((_, i) => (
                <div key={i} className={styles.gphProgressSegment}></div>
              ))}
            </div>
            {/* fill */}
            <div
              className={styles.gphProgressFill}
              style={{ height: `${PROGRESS_PCT}%` }}
              role="progressbar"
              aria-valuenow={PROGRESS_PCT}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
            {/* threshold marker */}
            <div className={styles.gphProgressMarker} style={{ bottom: "18%" }}></div>
          </div>
          <span className={styles.gphProgressLabel}>
            {REPS_DONE}/{REPS_TOTAL}
          </span>
        </div>

        {/* ── RIGHT: GAME CANVAS ── */}
        <div className={styles.gphGame}>
          {/* Score badge */}
          <div className={styles.gphScoreBadge}>
            <span className={styles.gphScoreLabel}>Score</span>
            <span className={styles.gphScoreValue}>{SCORE}</span>
          </div>

          {/* Multiplier pill */}
          <div className={styles.gphMultiplier}>×{MULTIPLIER}</div>

          {/* Central pillar obstacle */}
          <div className={styles.gphPillar}></div>

          {/* Platforms */}
          <div className={styles.gphPlatforms}>
            {platforms.map((p) => (
              <div
                key={p.id}
                className={styles.gphPlatform}
                style={{ top: p.top, left: p.left, width: p.width }}
              ></div>
            ))}
          </div>

          {/* Bird character */}
          <div
            className={styles.gphBird}
            style={{ bottom: "36%", left: "58%" }}
            role="img"
            aria-label="Branch Hopper bird character"
          >
            🐦
          </div>

          {/* Ground turtle */}
          <div
            className={styles.gphTurtle}
            style={{ bottom: "12%", left: "42%" }}
            role="img"
            aria-label="Turtle on the ground"
          >
            🐢
          </div>

          {/* Ambient sparkles */}
          <div className={styles.gphSparkle} style={{ top: "22%", right: "18%" }}></div>
          <div className={styles.gphSparkle} style={{ top: "55%", right: "8%" }}></div>

          {/* Watermark */}
          <span className={styles.gphWatermark}>Branch Hopper</span>
        </div>
      </div>
    </div>
  );
}

export default GamePage;
