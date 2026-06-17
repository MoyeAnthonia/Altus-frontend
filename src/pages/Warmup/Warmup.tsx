import styles from "./Warmup.module.css";
import { useNavigate } from "react-router";
type CheckStatus = "pending" | "checking" | "ok" | "fail";

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
          <svg
            className={styles.csStickFigure}
            viewBox="0 0 100 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* head */}
            <circle cx="50" cy="22" r="18" stroke="#38e1ff" strokeWidth="2.5" />
            {/* body */}
            <line x1="50" y1="40" x2="50" y2="95" stroke="#38e1ff" strokeWidth="2.5" />
            {/* left leg */}
            <line x1="50" y1="95" x2="28" y2="135" stroke="#38e1ff" strokeWidth="2.5" />
            <line x1="28" y1="135" x2="28" y2="158" stroke="#38e1ff" strokeWidth="2.5" />
            {/* right leg */}
            <line x1="50" y1="95" x2="72" y2="135" stroke="#38e1ff" strokeWidth="2.5" />
            <line x1="72" y1="135" x2="72" y2="158" stroke="#38e1ff" strokeWidth="2.5" />
            {/* ankle circles (orange, matching screenshot) */}
            <circle cx="28" cy="135" r="7" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="72" cy="135" r="7" stroke="#f59e0b" strokeWidth="2" />
          </svg>

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
