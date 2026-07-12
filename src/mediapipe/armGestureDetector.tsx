import type { MyPoseDetail } from "./mediapipePlayer";

// Landmark indices for shoulders and wrists (MediaPipe Pose)
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;

// How far above the shoulder line the wrist must be to count as "raised"
// 0.1 = 10% of frame height above the shoulder
const RAISE_THRESHOLD = 0.1;

// Same idea as squatDetector's confirm-frames + cooldown
const CONFIRM_FRAMES = 5;
const COOLDOWN_MS = 1000;
const VISIBILITY_OK = 0.6;

let currentGesture: "confirm" | "cancel" | null = null;
let confirmCount = 0;
let lastTriggerAt = 0;

function handlePoseEvent(e: Event) {
  onPoseFrame((e as CustomEvent<MyPoseDetail>).detail);
}

export function initArmGestureDetector() {
  window.addEventListener("mv:pose", handlePoseEvent);
}

export function stopArmGestureDetector() {
  window.removeEventListener("mv:pose", handlePoseEvent);
  currentGesture = null;
  confirmCount = 0;
}

function onPoseFrame(results: MyPoseDetail) {
  if (!results.poseLandmarks) return;

  const rShoulder = results.poseLandmarks[RIGHT_SHOULDER];
  const rWrist = results.poseLandmarks[RIGHT_WRIST];
  const lShoulder = results.poseLandmarks[LEFT_SHOULDER];
  const lWrist = results.poseLandmarks[LEFT_WRIST];

  const rightVisible =
    (rShoulder?.visibility ?? 0) >= VISIBILITY_OK && (rWrist?.visibility ?? 0) >= VISIBILITY_OK;
  const leftVisible =
    (lShoulder?.visibility ?? 0) >= VISIBILITY_OK && (lWrist?.visibility ?? 0) >= VISIBILITY_OK;

  const rightRaised = rightVisible && rWrist.y < rShoulder.y - RAISE_THRESHOLD;
  const leftRaised = leftVisible && lWrist.y < lShoulder.y - RAISE_THRESHOLD;

  const detected = rightRaised ? "confirm" : leftRaised ? "cancel" : null;

  confirmCount = detected && detected === currentGesture ? confirmCount + 1 : detected ? 1 : 0;
  currentGesture = detected;

  const now = performance.now();
  if (detected && confirmCount >= CONFIRM_FRAMES && now - lastTriggerAt > COOLDOWN_MS) {
    lastTriggerAt = now;
    window.dispatchEvent(new CustomEvent(`mv:${detected}`));
  }
}
