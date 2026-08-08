/**
 * React hook to connect all detectors to the React UI.
 *
 * This file starts MediapipePlayer and whichever detectors the games need.
 *
 * This is the ONLY place in the app that opens a camera for pose
 * detection — ExercisePage used to open a second, independent one of its
 * own; that was removed since it was always hidden behind
 * #mediapipe-canvas anyway. See docs/mediapipe-from-scratch.md §5.1-5.2
 * and §8 for the full history and a line-by-line walkthrough.
 */

import { useEffect, useState } from "react";
import { initMediaPipe, stopMediaPipe } from "./mediapipePlayer";
import { initSquatDetector, stopSquatDetector } from "./squatDetector";
import type { MvCalibratedDetail } from "./squatDetector";
import { initArmGestureDetector, stopArmGestureDetector } from "./armGestureDetector";
interface UseMediaPipeReturn {
  isReady: boolean; // camera + model started successfully (mv:mediapipe-ready fired)
  isCalibrated: boolean; // squat baseline captured (mv:calibrated fired)
  baselineY: number | null;
  hasFailed: boolean; // getUserMedia()/model load rejected — e.g. permission denied
}

export function useMediaPipe({ enabled = false }: { enabled?: boolean } = {}): UseMediaPipeReturn {
  const [isReady, setIsReady] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [baselineY, setBaselineY] = useState<number | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Start camera + load MediaPipe, then attach both detectors
    initMediaPipe()
      .then(() => {
        initSquatDetector();
        initArmGestureDetector();
      })
      .catch((err) => {
        console.warn("[useMediaPipe] Failed to start:", err);
        // Previously only logged — now surfaced through the hook's return
        // value so callers (e.g. ExercisePage's "Camera Detected" check)
        // can actually show an error state instead of hanging forever.
        setHasFailed(true);
      });

    // Camera loaded and ready
    const onReady = () => setIsReady(true);

    // Calibration done. This shows that squat detection is now active
    const onCalibrated = (e: Event) => {
      const detail = (e as CustomEvent<MvCalibratedDetail>).detail;
      setIsCalibrated(true);
      setBaselineY(detail.baselineY);
    };

    window.addEventListener("mv:mediapipe-ready", onReady);
    window.addEventListener("mv:calibrated", onCalibrated);

    // Remove all listeners when component unmounts
    return () => {
      window.removeEventListener("mv:mediapipe-ready", onReady);
      window.removeEventListener("mv:calibrated", onCalibrated);
      stopArmGestureDetector();
      stopSquatDetector();
      stopMediaPipe();
    };
  }, [enabled]);

  return { isReady, isCalibrated, baselineY, hasFailed };
}
