import styles from "./Warmup.module.css";
import { useNavigate } from "react-router";
type CheckStatus = "pending" | "checking" | "ok" | "fail";
import { useMediaPipe } from "../../mediapipe/useMediaPipe";

interface CheckItem {
  id: string;
  label: string;
  status: CheckStatus;
}

const checkItems: CheckItem[] = [
  { id: "camera", label: "Camera Detected", status: "pending" },
  { id: "lighting", label: "Good Lighting", status: "checking" },
  { id: "body", label: "Body in Frame", status: "checking" },
];

function circleClass(status: CheckStatus): string {
  if (status === "ok") return `${styles.csCheckCircle} ${styles.csCheckCircleOk}`;
  if (status === "fail") return `${styles.csCheckCircle} ${styles.csCheckCircleFail}`;
  return `${styles.csCheckCircle} ${styles.csCheckCirclePending}`;
}

function CameraSetupPage() {
  const allReady = checkItems.every((c) => c.status === "ok");
  const nav = useNavigate();
  const { isReady } = useMediaPipe();
  const gameNavigate = () => {
    nav("/exercise");
  };
  return (
    <div className={styles.csPage}>
      {/* NAV */}
      <nav className={styles.csNav}>
        <button className={styles.csBackBtn}>Back</button>
        <span className={styles.csPageTitle}>Camera Setup</span>
        <div className={styles.csNavSpacer}></div>
      </nav>

      {/* MAIN LAYOUT */}
      <div className={styles.csLayout}>
        {/* LEFT – camera viewport */}
        <div className={styles.csViewport}>
          <div className={styles.csDashedInner}></div>

          {/* Stick figure SVG – placeholder for Week 4 MediaPipe canvas */}
          <canvas
            id="mediapipe-canvas"
            width={640}
            height={480}
            style={{ width: "100%", height: "100%", display: "block" }}
          />

          <div className={styles.csViewportLabel}>Squat Detection</div>
        </div>

        {/* RIGHT – sidebar */}
        <aside className={styles.csSidebar}>
          <p className={styles.csSidebarTitle}>Setup Checklist</p>

          {checkItems.map((item) => (
            <div key={item.id} className={styles.csCheckItem}>
              <div className={styles.csCheckLeft}>
                <div className={circleClass(item.status)}></div>
                <span className={styles.csCheckLabel}>{item.label}</span>
              </div>
              {item.status === "checking" && (
                <div className={styles.csSpinner} aria-label="Checking…"></div>
              )}
            </div>
          ))}

          <p className={styles.csStatusText}>Preparing detection…</p>

          <button
            className={
              allReady ? `${styles.csStartBtn} ${styles.csStartBtnReady}` : styles.csStartBtn
            }
            // disabled={!allReady}
            // aria-disabled={!allReady}
            onClick={gameNavigate}
          >
            Waiting…
          </button>
        </aside>
      </div>
    </div>
  );
}

export default CameraSetupPage;
