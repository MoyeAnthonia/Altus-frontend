/**
 * React hook to connect all detectors to the React UI.
 *
 * This file starts MediapipePlayer and whichever detectors the games need.
 */

import { useEffect, useState } from "react";
import { initMediaPipe, stopMediaPipe } from "./mediapipePlayer";
import { initSquatDetector, stopSquatDetector } from "./squatDetector";
import type { MvCalibratedDetail } from "./squatDetector";
import { initArmGestureDetector, stopArmGestureDetector } from "./armGestureDetector";
interface UseMediaPipeReturn {
  isReady: boolean;
  isCalibrated: boolean;
  baselineY: number | null;
}

export function useMediaPipe({ enabled = false }: { enabled?: boolean } = {}): UseMediaPipeReturn {
  const [isReady, setIsReady] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [baselineY, setBaselineY] = useState<number | null>(null);

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

  return { isReady, isCalibrated, baselineY };
}
