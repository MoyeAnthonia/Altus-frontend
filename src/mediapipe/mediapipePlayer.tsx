/**
 * This file handles everything to do with the webcam and load Mediapipe Pose.
 *
 * How mediapipe works: Mediapipe gives us X and Y positions between 0 and 1.
 * Y = 0 means TOP of the camera frame.
 * Y = 1 means BOTTOM of the camera frame.
 *
 * So for example when the player jumps, their hips go UP = Y is smaller
 * When the player squats, their hips go DOWN = Y gets bigger
 */

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// Data sent with the "mv:pose" event
export interface MyPoseDetail {
  y: number; // current average hip Y position (0 to 1)
  landmarks: Landmark[];
}

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

// Main function to start Mediapipe
export async function initMediaPipe({ onReady }: { onReady?: () => void } = {}) {
  // First Step: Need of a video element to feed webcam frames into Mediapipe
  const video = document.createElement("video");
  video.width = VIDEO_WIDTH;
  video.height = VIDEO_HEIGHT;
  video.autoplay = true;
  video.playsInline = true; // this is required for iOS Safari for iPad for example
  video.style.display = "none";
  document.body.appendChild(video);

  // Second Step: This triggers the browser's "Allow camera?" popup
  // getUserMedia returns a MediaStream which we attach to the video element
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
  });
  video.srcObject = stream;

  // Third Step: Loading Mediapipe Pose from CDN (content delivery network)
  if (!(window as any).Pose) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";
    document.head.appendChild(script);
    await new Promise<void>((resolve) => {
      script.onload = () => resolve();
    });
  }

  // Fourth Step: Configuration of Mediapipe pose
  const pose = new (window as any).Pose({
    locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });

  pose.setOptions({
    modelComplexity: 0,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  // Fith Step: starting the frame loop
  video.addEventListener("loadeddata", () => {
    processLoop();
    if (typeof window != "undefined") {
      window.dispatchEvent(new CustomEvent("mv:mediapipe-ready"));
    }
    onReady?.();
  });

  return { pose, video };

  // Internal frame loop that will send the current video frame to Mediapipe to analyze.
  // requestAnimationFrame runs this around 60 tines per second
  async function processLoop() {
    if (video.readyState >= 2) {
      await pose.send({ image: video });
    }

    requestAnimationFrame(processLoop);
  }
}
