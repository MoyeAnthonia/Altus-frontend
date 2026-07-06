import GamePage from "../Game/Game";
import styles from "./Exercise.module.css";
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
  { id: "calibration", label: "Calibration Complete", status: "checking" },
];

function ExercisePage() {
  const allReady = checkItems.every((c) => c.status === "ok");
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const { isCalibrated } = useMediaPipe({ enabled: cameraEnabled });


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
    nav("/level");
  };

  return (
    <div className={styles.gphPage}>
      <header className={styles.gphHeader}>
        <button className={styles.gphBackBtn} onClick={() => nav(-1)}>
          ← Back
        </button>
      </header>

      <div className={styles.gphArena}>
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

        {!hasStarted ? (
          <aside className={styles.csSidebar}>
            <p className={styles.csSidebarTitle}>Setup Checklist</p>

            {checkItems.map((item) => (
              <div key={item.id} className={styles.csCheckItem}>
                <div className={styles.csCheckLeft}>
                  <span className={styles.csCheckLabel}>{item.label}</span>
                </div>
              </div>
            ))}

            <div className={styles.csCheckItem}>
              <div className={styles.csCheckLeft}>
                <span
                  className={styles.csCheckLabel}
                  style={{ color: isCalibrated ? '#4ade80' : '#94a3b8' }}
                >
                  {isCalibrated ? '✓ MediaPipe Calibrated' : '⏳ MediaPipe Calibrating...'}
                </span>
              </div>
            </div>
            
            <p className={styles.csStatusText}>Preparing detection…</p>

            <button
              className={
                allReady ? `${styles.csStartBtn} ${styles.csStartBtnReady}` : styles.csStartBtn
              }
              onClick={() => setHasStarted(true)}
            >
              Begin
            </button>
          </aside>
        ) : (
          <div className={styles.gphGameCol}>
            <div className={styles.gphGame}>
              <GamePage />
            </div>
            <button className={styles.gphGameBackBtn} onClick={gameNavigate}>
              ← Back to difficulty select
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExercisePage;
