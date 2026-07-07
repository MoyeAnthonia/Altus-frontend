import GamePage from "../Game/Game";
import styles from "./Exercise.module.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Button from "../../components/Button/Button";
import { MotionCard } from "../../components/Cards/Cards";
import GameOverModal, { type GameOverStats } from "../../components/Modal/Modal";
import { useMediaPipe } from "../../mediapipe/useMediaPipe";
import type { MyPoseDetail } from "../../mediapipe/mediapipePlayer";

type CheckStatus = "pending" | "checking" | "ok" | "fail";

interface CheckItem {
  id: string;
  label: string;
  status: CheckStatus;
}

// Shoulders + hips — used as a stand-in for "body is fully in frame"
const BODY_LANDMARKS = [11, 12, 23, 24];

// Mediapipe visibility below this reads as "can't see you properly"
// (occluded limbs, bad lighting, out of frame all lower this score)
const VISIBILITY_OK = 0.6;

function ExercisePage() {
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasPose, setHasPose] = useState(false);
  const [bodyInFrame, setBodyInFrame] = useState(false);
  const [goodLighting, setGoodLighting] = useState(false);

  // Game over state: null = game still running (or not started yet)
  const [gameOverStats, setGameOverStats] = useState<GameOverStats | null>(null);
  // Bumping this key remounts <GamePage />, giving us a fresh run on retry
  const [gameKey, setGameKey] = useState(0);

  const { isReady } = useMediaPipe({ enabled: cameraEnabled });

  // Read live pose landmarks to score "body in frame" and "good lighting"
  useEffect(() => {
    if (!cameraEnabled) return;

    const onPose = (e: Event) => {
      const { poseLandmarks } = (e as CustomEvent<MyPoseDetail>).detail;
      setHasPose(true);

      const bodyVisible = BODY_LANDMARKS.every(
        (i) => (poseLandmarks[i]?.visibility ?? 0) >= VISIBILITY_OK,
      );
      setBodyInFrame(bodyVisible);

      const avgVisibility =
        poseLandmarks.reduce((sum, lm) => sum + (lm.visibility ?? 0), 0) / poseLandmarks.length;
      setGoodLighting(avgVisibility >= VISIBILITY_OK);
    };

    window.addEventListener("mv:pose", onPose);
    return () => window.removeEventListener("mv:pose", onPose);
  }, [cameraEnabled]);

  // Listen for the game announcing that a run has ended.
  // GamePage dispatches "mv:gameover" with the run's stats — same
  // window-event pattern as "mv:pose", so the game stays decoupled
  // from the page that hosts it.
  useEffect(() => {
    if (!hasStarted) return;

    const onGameOver = (e: Event) => {
      setGameOverStats((e as CustomEvent<GameOverStats>).detail);
    };

    window.addEventListener("mv:gameover", onGameOver);
    return () => window.removeEventListener("mv:gameover", onGameOver);
  }, [hasStarted]);

  const checkItems: CheckItem[] = [
    {
      id: "camera",
      label: "Camera Detected",
      status: cameraFailed ? "fail" : isReady ? "ok" : cameraEnabled ? "checking" : "pending",
    },
    {
      id: "lighting",
      label: "Good Lighting",
      status: !isReady ? "pending" : !hasPose ? "checking" : goodLighting ? "ok" : "fail",
    },
    {
      id: "body",
      label: "Body in Frame",
      status: !isReady ? "pending" : !hasPose ? "checking" : bodyInFrame ? "ok" : "fail",
    },
  ];

  const allReady = checkItems.every((c) => c.status === "ok");

  // Auto-advance to the game once every check is OK — the user is mid-squat
  // at this point and can't reach for a mouse to click "Start". Debounced
  // so a one-frame flicker in pose detection doesn't trigger it early.
  useEffect(() => {
    if (!allReady || hasStarted) return;
    const timer = setTimeout(() => setHasStarted(true), 1000);
    return () => clearTimeout(timer);
  }, [allReady, hasStarted]);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
      setCameraEnabled(true);
      setCameraFailed(false);
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraFailed(true);
    }
  };

  const gameNavigate = () => {
    nav("/level");
  };

  const handlePlayAgain = () => {
    setGameOverStats(null);
    setGameKey((k) => k + 1); // fresh mount = fresh game state
  };

  const handleGoToDashboard = () => {
    nav("/profile");
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
                {item.status === "ok" && (
                  <div className={`${styles.csCheckCircle} ${styles.csCheckCircleOk}`}>✓</div>
                )}
                {item.status === "fail" && (
                  <div className={`${styles.csCheckCircle} ${styles.csCheckCircleFail}`}>!</div>
                )}
                {item.status === "pending" && (
                  <div className={`${styles.csCheckCircle} ${styles.csCheckCirclePending}`} />
                )}
                {item.status === "checking" && <div className={styles.csSpinner} />}
              </div>
            ))}

            <p className={styles.csStatusText}>
              {allReady ? "All set - you're ready to go!" : "Preparing detection…"}
            </p>

            <button
              className={
                allReady ? `${styles.csStartBtn} ${styles.csStartBtnReady}` : styles.csStartBtn
              }
              disabled={!allReady}
              onClick={() => setHasStarted(true)}
            >
              Start
            </button>
          </aside>
        ) : (
          <div className={styles.gphGameCol}>
            <div className={styles.gphGame}>
              <GamePage key={gameKey} />

              <GameOverModal
                isOpen={gameOverStats !== null}
                stats={
                  gameOverStats ?? { baseScore: 0, repStreak: 0, timeSeconds: 0, finalScore: 0 }
                }
                onPlayAgain={handlePlayAgain}
                onDashboard={handleGoToDashboard}
              />
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
