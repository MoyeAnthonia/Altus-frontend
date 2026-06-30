import styles from "./Warmup.module.css";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import Button from "../../components/Button/Button";
import { MotionCard } from "../../components/Cards/Cards";
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

function CameraSetupPage() {
  const allReady = checkItems.every((c) => c.status === "ok");
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  useMediaPipe({ enabled: cameraEnabled });

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
      setCameraEnabled(true);
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
        <button className={styles.csBackBtn} onClick={() => nav(-1)}>
          ← Back
        </button>
        <span className={styles.csPageTitle}>Camera Setup</span>
        <div className={styles.csNavSpacer}></div>
      </nav>

      {/* MAIN LAYOUT */}
      <div className={styles.csLayout}>
        {/* LEFT – camera viewport */}

        <MotionCard videoRef={videoRef} label="Squat Detection" showGuide={!isCameraOpen}>
          {!isCameraOpen && <Button label="Open Camera" onClick={openCamera} />}
          {isCameraOpen && (
            <canvas
              id="mediapipe-canvas"
              width={640}
              height={480}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            />
          )}
        </MotionCard>

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
