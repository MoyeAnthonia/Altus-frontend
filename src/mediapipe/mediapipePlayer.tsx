/**
 * This file handles everything to do with the webcam and MediaPipe Pose.
 *
 * How mediapipe works: Mediapipe gives us X and Y positions between 0 and 1.
 * Y = 0 means TOP of the camera frame.
 * Y = 1 means BOTTOM of the camera frame.
 *
 * So for example when the player jumps, their hips go UP = Y is smaller
 * When the player squats, their hips go DOWN = Y gets bigger
 */

import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// Shape of the detail sent with every "mv:pose" event
export interface MyPoseDetail {
  poseLandmarks: Landmark[];
  poseWorldLandmarks: Landmark[];
}

export async function initMediaPipe({ onReady }: { onReady?: () => void } = {}) {
  const video = document.createElement("video");
  video.setAttribute("playsinline", "");
  video.style.cssText = "position:absolute;opacity:0;pointer-events:none";
  document.body.appendChild(video);

  // Load MediaPipe WASM runtime from CDN (binary data, loaded async — not a blocking script)
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm",
  );

  // pose_landmarker_full ≈ modelComplexity: 1 from the old API
  const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false,
  });

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 },
  });
  video.srcObject = stream;
  await new Promise<void>((resolve) => {
    video.addEventListener("loadeddata", () => resolve(), { once: true });
  });
  video.play();

  let drawingUtils: DrawingUtils | null = null;
  let lastTs = -1;

  function processFrame() {
    const now = performance.now();

    // detectForVideo requires a strictly-increasing timestamp
    if (now > lastTs) {
      lastTs = now;
      const result = poseLandmarker.detectForVideo(video, now);

      const canvas = document.getElementById("mediapipe-canvas") as HTMLCanvasElement;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 640, 480);
        ctx.drawImage(video, 0, 0, 640, 480);

        if (result.landmarks.length > 0) {
          if (!drawingUtils) drawingUtils = new DrawingUtils(ctx);
          drawingUtils.drawConnectors(result.landmarks[0], PoseLandmarker.POSE_CONNECTIONS, {
            color: "#00FF88",
            lineWidth: 2,
          });
          drawingUtils.drawLandmarks(result.landmarks[0], {
            color: "#FF4444",
            lineWidth: 1,
            radius: 3,
          });
        }
      }

      if (result.landmarks.length > 0) {
        window.dispatchEvent(
          new CustomEvent<MyPoseDetail>("mv:pose", {
            detail: {
              poseLandmarks: result.landmarks[0],
              poseWorldLandmarks: result.worldLandmarks[0] ?? [],
            },
          }),
        );
      }
    }

    requestAnimationFrame(processFrame);
  }

  requestAnimationFrame(processFrame);
  window.dispatchEvent(new CustomEvent("mv:mediapipe-ready"));
  onReady?.();

  return { poseLandmarker, video };
}
