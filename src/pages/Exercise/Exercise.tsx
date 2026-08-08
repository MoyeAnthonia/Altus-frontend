import GamePage from "../Game/Game";
import styles from "./Exercise.module.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Button from "../../components/Button/Button";
import { MotionCard } from "../../components/Cards/Cards";
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

  // MotionCard renders <video ref={videoRef}> internally and requires this
  // prop — but nothing attaches a stream to it anymore. There used to be a
  // second, independent getUserMedia() call in this file feeding it (see
  // docs/mediapipe-from-scratch.md §5.1-5.2 for that history); it was
  // removed because #mediapipe-canvas below always painted over it anyway.
  // The one real camera stream now lives entirely in mediapipePlayer.tsx,
  // started via useMediaPipe() below.
  const videoRef = useRef<HTMLVideoElement>(null);

  // Flipping this to true is the ONLY thing that starts the camera — see
  // useMediaPipe()'s effect, which is gated on this exact flag.
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasPose, setHasPose] = useState(false);
  const [bodyInFrame, setBodyInFrame] = useState(false);
  const [goodLighting, setGoodLighting] = useState(false);

  // isReady: true once mediapipePlayer.tsx's camera + model have actually
  // started (drives the button ↔ canvas swap in the JSX below).
  // hasFailed: true if getUserMedia()/model loading rejected — e.g. camera
  // permission denied (drives the "Camera Detected: fail" checklist row).
  const { isCalibrated, isReady, hasFailed } = useMediaPipe({ enabled: cameraEnabled });

  // Read live pose landmarks to score "body in frame" and "good lighting".
  // "mv:pose" is the same broadcast squatDetector.tsx listens to for
  // calibration — this component is just a second, independent listener
  // on it (see docs/mediapipe-from-scratch.md §7 for how that's not a
  // conflict — any number of addEventListener calls for the same name all
  // fire).
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

  const checkItems: CheckItem[] = [
    {
      id: "camera",
      label: "Camera Detected",
      status: hasFailed ? "fail" : isCalibrated ? "ok" : cameraEnabled ? "checking" : "pending",
    },
    {
      id: "lighting",
      label: "Good Lighting",
      status: !isCalibrated ? "pending" : !hasPose ? "checking" : goodLighting ? "ok" : "fail",
    },
    {
      id: "body",
      label: "Body in Frame",
      status: !isCalibrated ? "pending" : !hasPose ? "checking" : bodyInFrame ? "ok" : "fail",
    },
    {
      id: "mediapipe",
      label: "Pose Detection Ready",
      status: !isCalibrated ? "pending" : !hasPose ? "checking" : "ok",
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

  const profileNavigate = () => {
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
        {/* videoRef is passed only because MotionCard's prop type requires
            it — its underlying <video> never receives a stream now (see
            the comment at videoRef's declaration above). What's actually
            visible here, once isReady flips true, is #mediapipe-canvas —
            painted every frame by mediapipePlayer.tsx's own camera. */}
        <MotionCard
          videoRef={videoRef}
          label="Squat Detection"
          showGuide={!isReady}
          className={styles.gphMotion}
        >
          {/* Clicking this doesn't request the camera itself — it just
              flips cameraEnabled, which is what useMediaPipe() above is
              gated on. The actual getUserMedia() call happens inside
              mediapipePlayer.tsx once that effect fires. */}
          {!isReady && <Button label="Open Camera" onClick={() => setCameraEnabled(true)} />}
          {isReady && (
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

            <div className={styles.csCheckItem}>
              <div className={styles.csCheckLeft}>
                <span
                  className={styles.csCheckLabel}
                  style={{ color: isCalibrated ? "#4ade80" : "#94a3b8" }}
                >
                  {isCalibrated ? "✓ MediaPipe Calibrated" : "⏳ MediaPipe Calibrating..."}
                </span>
              </div>
            </div>

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
              <GamePage />
            </div>
            <button className={styles.gphGameBackBtn} onClick={profileNavigate}>
              Go To Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExercisePage;
