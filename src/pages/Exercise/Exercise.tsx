import { MotionCard } from "../../components/Cards/Cards";
import { useRef, useState } from "react";
import GamePage from "../Game/Game";
import styles from "./Exercise.module.css";
import { useNavigate } from "react-router";
import Button from "../../components/Button/Button";

function ExercisePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const nav = useNavigate();
  const gameNavigate = () => {
    nav("/level");
  };
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  return (
    <div className={styles.gphPage}>
      {/* TOP — back button */}
      <header className={styles.gphHeader}>
        <button className={styles.gphBackBtn} onClick={() => nav(-1)}>
          ← Back
        </button>
      </header>

      {/* TWO-COLUMN ARENA */}
      <div className={styles.gphArena}>
        <MotionCard videoRef={videoRef} label="Squat Detection" showGuide={!isCameraOpen}>
          {!isCameraOpen && <Button label="Open Camera" onClick={openCamera} />}
        </MotionCard>

        <div className={styles.gphGameCol}>
          <div className={styles.gphGame}>
            <GamePage />
          </div>
          <button className={styles.gphGameBackBtn} onClick={gameNavigate}>
            ← Back to difficulty select
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExercisePage;
