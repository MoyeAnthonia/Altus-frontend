/**
 * React hook to connect all detectors to the React UI.
 *
 * This file starts MediapipePlayer and whichever detectors the games need.
 */

import { useEffect, useState } from "react";
import { initMediaPipe } from "./mediapipePlayer";
import { initJumpDetector } from "./jumpDetector";
import { initSquatDetector } from "./squatDetector";
import type { MvCalibratedDetail } from "./squatDetector";

interface UseMediaPipeReturn {
  isReady: boolean;
  isCalibrated: boolean;
  lastMove: "jump" | "squat" | null;
  baselineY: number | null;
}

export function useMediaPipe({ enabled = false }: { enabled?: boolean } = {}): UseMediaPipeReturn {
  const [isReady, setIsReady] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [lastMove, setLastMove] = useState<"jump" | "squat" | null>(null);
  const [baselineY, setBaselineY] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Start camera + load MediaPipe, then attach both detectors
    initMediaPipe()
      .then(() => {
        initJumpDetector();
        initSquatDetector();
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

    // When player jumps, Dino speeds up (GameScene handles the actual speed change)
    const onJump = () => setLastMove("jump");

    // When player squats, Dino jumps (GameScene handles the actual jump)
    const onSquat = () => setLastMove("squat");

    // Player standing back up
    const onSquatEnd = () => setLastMove(null);

    window.addEventListener("mv:mediapipe-ready", onReady);
    window.addEventListener("mv:calibrated", onCalibrated);
    window.addEventListener("mv:jump", onJump);
    window.addEventListener("mv:squat:start", onSquat);
    window.addEventListener("mv:squat:end", onSquatEnd);

    // Remove all listeners when component unmounts
    return () => {
      window.removeEventListener("mv:mediapipe-ready", onReady);
      window.removeEventListener("mv:calibrated", onCalibrated);
      window.removeEventListener("mv:jump", onJump);
      window.removeEventListener("mv:squat:start", onSquat);
      window.removeEventListener("mv:squat:end", onSquatEnd);
    };
  }, [enabled]);

  return { isReady, isCalibrated, lastMove, baselineY };
}
