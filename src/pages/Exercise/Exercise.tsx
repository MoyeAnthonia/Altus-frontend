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
  const videoRef = useRef<HTMLVideoElement>(null);
  // Holds the preview stream so we can stop it manually — a MediaStream's
  // tracks keep the camera hardware active even after the <video> element
  // showing it unmounts, unless something explicitly calls track.stop().
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasPose, setHasPose] = useState(false);
  const [bodyInFrame, setBodyInFrame] = useState(false);
  const [goodLighting, setGoodLighting] = useState(false);

  const { isCalibrated } = useMediaPipe({ enabled: cameraEnabled });

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

  const checkItems: CheckItem[] = [
    {
      id: "camera",
      label: "Camera Detected",
      status: cameraFailed ? "fail" : isCalibrated ? "ok" : cameraEnabled ? "checking" : "pending",
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

  // Stop the camera when this page unmounts — back button, "Change
  // Difficulty", or any other navigation away. Without this the webcam
  // stays on in the background since nothing else holds a reference to it.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
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
        <MotionCard
          videoRef={videoRef}
          label="Squat Detection"
          showGuide={!isCameraOpen}
          className={styles.gphMotion}
        >
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
