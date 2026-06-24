import styles from "./Warmup.module.css";
import { useRef } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/Button/Button";
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

function CameraSetupPage() {
  const allReady = checkItems.every((c) => c.status === "ok");
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

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

          <video ref={videoRef} autoPlay playsInline width="640" height="480"></video>
          <Button label="Open Camera" onClick={openCamera} />

          <div className={styles.csViewportLabel}>Squat Detection</div>
        </div>

        {/* RIGHT – sidebar */}
        <aside className={styles.csSidebar}>
          <p className={styles.csSidebarTitle}>Setup Checklist</p>

          {checkItems.map((item) => (
            <div key={item.id} className={styles.csCheckItem}>
              <div className={styles.csCheckLeft}>
                <span className={styles.csCheckLabel}>{item.label}</span>
              </div>
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
