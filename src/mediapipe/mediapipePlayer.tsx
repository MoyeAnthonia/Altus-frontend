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

// These four are declared at MODULE scope (outside any function), not with
// useState/useRef — because initMediaPipe() and stopMediaPipe() are plain
// functions, not React components or hooks, so they can't use React's
// hooks at all. A module-level `let` is the only way for stopMediaPipe()
// to reach the exact same stream/model/loop that initMediaPipe() started.
// That also means these survive independently of any component mounting
// or unmounting — see docs/react-from-scratch.md §3-4 for the full story.
let currentVideo: HTMLVideoElement | null = null;
let currentStream: MediaStream | null = null;
let currentPoseLandmarker: PoseLandmarker | null = null;
let rafId: number | null = null;

// Undoes everything initMediaPipe() below started. Called from
// useMediaPipe.tsx's useEffect cleanup, i.e. when the page using the
// camera unmounts. Order doesn't matter much here, but each line stops
// one distinct resource:
export function stopMediaPipe(): void {
  // 1. Stop the frame loop first, so it can't fire one more time and try
  //    to use a video/model that's about to be torn down below.
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  // 2. Stop the camera hardware itself. A MediaStream is made of one or
  //    more "tracks" (here, just a video track) — calling .stop() on each
  //    track is what actually turns the camera light off. Just letting
  //    the stream/video element get garbage-collected is NOT enough; the
  //    browser keeps the hardware active until .stop() is called explicitly.
  currentStream?.getTracks().forEach((track) => track.stop());
  currentStream = null;
  // 3. Release the pose model's WASM/GPU resources.
  currentPoseLandmarker?.close();
  currentPoseLandmarker = null;
  // 4. Remove the hidden <video> element we created in initMediaPipe()
  //    from the page entirely.
  currentVideo?.remove();
  currentVideo = null;
}

export async function initMediaPipe({ onReady }: { onReady?: () => void } = {}) {
  // A <video> element is how the browser plays a camera stream — but we
  // never want the RAW feed visible (there's a separate #mediapipe-canvas
  // elsewhere that draws the frame + skeleton overlay on top of it). So
  // this one is created purely in memory, made invisible (opacity:0) and
  // click-through (pointer-events:none), and only exists so the pose
  // model has something to read frames from via detectForVideo() below.
  const video = document.createElement("video");
  video.setAttribute("playsinline", ""); // iOS Safari: play inline instead of fullscreen
  video.style.cssText = "position:absolute;opacity:0;pointer-events:none";
  document.body.appendChild(video); // must be in the DOM for the browser to actually decode/play it

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

  currentPoseLandmarker = poseLandmarker;

  // navigator.mediaDevices.getUserMedia(...) is the actual browser API
  // that (a) pops up the "allow this site to use your camera?" permission
  // prompt, and (b) if allowed, hands back a live MediaStream — a
  // continuously-updating feed from the webcam. It's a Promise because the
  // permission prompt is asynchronous (waiting on the user to click
  // Allow/Block). { video: { width: 640, height: 480 } } asks for a video
  // track at that resolution — no audio track is requested since we never
  // pass `audio: true`.
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 },
  });

  // A MediaStream by itself doesn't "play" anywhere — it has to be handed
  // to something that can display it. srcObject is how you attach a
  // stream to a <video> element (the modern replacement for the old
  // `video.src = someUrl` pattern, used for live streams instead of files).
  video.srcObject = stream;

  // The stream can be attached before the browser has actually decoded a
  // single frame yet. "loadeddata" fires once the very first frame is
  // ready — waiting for it here means detectForVideo() below is
  // guaranteed a real frame to analyze, instead of possibly running
  // against an empty/black video on the very first call.
  await new Promise<void>((resolve) => {
    video.addEventListener("loadeddata", () => resolve(), { once: true });
  });

  video.play(); // actually starts playback (still muted/invisible — see above)
  currentVideo = video;
  currentStream = stream; // stashed in module scope so stopMediaPipe() can find it later

  let drawingUtils: DrawingUtils | null = null; // created lazily, once a canvas ctx exists
  let lastTs = -1;

  // This function is the actual "loop" — it re-schedules itself at the
  // bottom (via requestAnimationFrame), so once called once, it keeps
  // running on its own, roughly once per screen repaint (~30-60x/sec),
  // until cancelAnimationFrame(rafId) stops it in stopMediaPipe() above.
  function processFrame() {
    const now = performance.now();

    // detectForVideo requires a strictly-increasing timestamp
    if (now > lastTs) {
      lastTs = now;
      // The actual "ask the model what it sees right now" call — pass it
      // the current video frame + timestamp, get back landmark points.
      const result = poseLandmarker.detectForVideo(video, now);

      // Draw the VISIBLE debug view: the raw camera frame plus a green
      // skeleton overlay (drawConnectors = the lines between joints,
      // drawLandmarks = the dots at each joint) onto the on-page canvas.
      // This is purely visual — it has no effect on detection itself.
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

      // Broadcast the raw landmarks so squatDetector.tsx and
      // armGestureDetector.tsx can react — see docs/mediapipe-from-scratch.md
      // §7 for what dispatchEvent/addEventListener actually do here.
      // Only fires when a person was actually detected this frame
      // (result.landmarks is empty if nobody's in frame).
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

    // Re-book this same function for "right before the next repaint" —
    // this is what makes it a loop instead of a one-off call. The
    // returned id is stored (not thrown away) specifically so
    // stopMediaPipe() has something to pass to cancelAnimationFrame().
    rafId = requestAnimationFrame(processFrame);
  }

  // The very first call — everything after this point happens because
  // processFrame() keeps re-scheduling itself, forever, until stopped.
  rafId = requestAnimationFrame(processFrame);

  // A separate, one-time event — fired once setup finishes, so
  // useMediaPipe.tsx knows the camera/model are ready (e.g. to hide a
  // loading spinner). Not to be confused with "mv:pose", which fires
  // continuously once per frame.
  window.dispatchEvent(new CustomEvent("mv:mediapipe-ready"));
  onReady?.();

  return { poseLandmarker, video };
}
