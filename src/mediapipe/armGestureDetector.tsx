// MyPoseDetail is a type only — erased at compile time, just describes
// the shape of the "mv:pose" CustomEvent's .detail payload (see
// mediapipePlayer.tsx for where that event actually gets dispatched).
import type { MyPoseDetail } from "./mediapipePlayer";

// Index into the 33-point poseLandmarks array — see
// docs/mediapipe-from-scratch.md §1 for what these arrays actually are.
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

// Module-scope, not useState/useRef — this file is plain functions, not a
// component or hook, so these three persist across every "mv:pose" frame
// the same way mediapipePlayer.tsx's camera/model state does. See
// docs/react-from-scratch.md §3-4 for why that's the only option here.
let currentGesture: "confirm" | "cancel" | null = null;
let confirmCount = 0;
let lastTriggerAt = 0;

// The actual listener callback — the browser calls this automatically
// every time mediapipePlayer.tsx dispatches "mv:pose" (see
// docs/mediapipe-from-scratch.md §7 for how addEventListener/dispatchEvent
// connect the two). `e.detail` is the payload; onPoseFrame just wants the
// landmarks, so this one line unwraps it before passing it on.
function handlePoseEvent(e: Event) {
  onPoseFrame((e as CustomEvent<MyPoseDetail>).detail);
}

// Called once, from useMediaPipe.tsx, once the camera + model are ready —
// see that file for exactly where. Subscribing is all this does; nothing
// happens again until the browser starts calling handlePoseEvent on its own.
export function initArmGestureDetector() {
  window.addEventListener("mv:pose", handlePoseEvent);
}

export function stopArmGestureDetector() {
  window.removeEventListener("mv:pose", handlePoseEvent);
  currentGesture = null;
  confirmCount = 0;
}

// Runs once per frame, for as long as the detector is active — `results`
// is literally e.detail from handlePoseEvent above, just renamed.
function onPoseFrame(results: MyPoseDetail) {
  if (!results.poseLandmarks) return; // no person detected this frame

  // Pull just the 4 points this file cares about out of the full 33-point
  // array — everything else in poseLandmarks (hips, knees, face, etc.) is
  // ignored here; squatDetector.tsx reads its own different subset from
  // this exact same array, independently.
  const rShoulder = results.poseLandmarks[RIGHT_SHOULDER];
  const rWrist = results.poseLandmarks[RIGHT_WRIST];
  const lShoulder = results.poseLandmarks[LEFT_SHOULDER];
  const lWrist = results.poseLandmarks[LEFT_WRIST];

  // visibility is MediaPipe's own per-point confidence score — low values
  // mean "occluded/out of frame/bad lighting," not "this is actually 0".
  // Guard against acting on a wrist/shoulder the model isn't sure about.
  const rightVisible =
    (rShoulder?.visibility ?? 0) >= VISIBILITY_OK && (rWrist?.visibility ?? 0) >= VISIBILITY_OK;
  const leftVisible =
    (lShoulder?.visibility ?? 0) >= VISIBILITY_OK && (lWrist?.visibility ?? 0) >= VISIBILITY_OK;

  // Remember: y=0 is the TOP of frame, y=1 is the BOTTOM — so a raised
  // wrist has a SMALLER y than the shoulder, not larger. "Raised" here
  // means "at least RAISE_THRESHOLD higher on screen than the shoulder."
  const rightRaised = rightVisible && rWrist.y < rShoulder.y - RAISE_THRESHOLD;
  const leftRaised = leftVisible && lWrist.y < lShoulder.y - RAISE_THRESHOLD;

  // Chained ternary — reads as: right raised → "confirm", else left
  // raised → "cancel", else neither → null. Same logic as an if/else-if/
  // else chain, just written as one expression so it can be assigned
  // directly with const.
  const detected = rightRaised ? "confirm" : leftRaised ? "cancel" : null;

  // Consecutive-frame counter: keeps counting up only while the SAME
  // gesture keeps being detected frame after frame. Any change — a
  // different gesture, or losing the raise entirely — resets it to 0 (or
  // 1, if a new gesture just started this frame).
  confirmCount = detected && detected === currentGesture ? confirmCount + 1 : detected ? 1 : 0;
  currentGesture = detected;

  const now = performance.now();
  // Only actually fire once the SAME gesture has been held for
  // CONFIRM_FRAMES straight frames (filters out one noisy frame looking
  // like a raise), and only if COOLDOWN_MS has passed since the last time
  // this fired (stops one raised arm from firing repeatedly while held).
  if (detected && confirmCount >= CONFIRM_FRAMES && now - lastTriggerAt > COOLDOWN_MS) {
    lastTriggerAt = now;
    // Template literal builds either "mv:confirm" or "mv:cancel" — never
    // both in one call, and only ever when `detected` is truthy (the
    // guard above already ruled out `detected === null` reaching here).
    // DinoRunGameEngine.ts is what's actually listening for these.
    window.dispatchEvent(new CustomEvent(`mv:${detected}`));
  }
}
