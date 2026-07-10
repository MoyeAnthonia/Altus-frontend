import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  DinoRunGame,
  DIFFICULTIES,
  type DifficultyKey,
  type GameEndResult,
} from "../../engine/DinoRunGameEngine";
import { useMediaPipe } from "../../mediapipe/useMediaPipe";
import GameResultModal from "./GameResultModal";
import GameIdleModal from "./GameIdleModal";
import { useAuth } from "../../context/useAuth";
import { saveWorkoutSession } from "../../api/workoutSessions";
interface LocationState {
  difficulty: DifficultyKey;
  exerciseDifficultyId?: string;
}

function GamePage() {
  const { token } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const repCountRef = useRef(0);
  const gameRef = useRef<DinoRunGame | null>(null);
  const [gameResult, setGameResult] = useState<GameEndResult | null>(null);
  const [isIdle, setIsIdle] = useState(false);

  const { difficulty, exerciseDifficultyId } = (location.state as LocationState) ?? {};
  const activeDifficulty = difficulty ?? "medium";
  const diffConfig = DIFFICULTIES[activeDifficulty];

  useMediaPipe();

  const bootGame = (canvas: HTMLCanvasElement) => {
    gameRef.current = new DinoRunGame({
      canvas,
      difficulty: activeDifficulty,
      onGameIdle: () => {
        setIsIdle(true);
        setGameResult(null);
      },
      onGameStart: () => setIsIdle(false),
      onGameEnd: (result: GameEndResult) => {
        setGameResult(result);

        if (token && exerciseDifficultyId) {
          saveWorkoutSession(token, {
            exercise_difficulty_id: exerciseDifficultyId,
            reps_completed: repCountRef.current,
            duration_seconds: Math.round(result.secs),
          }).catch((err) => console.error("Failed to save workout session:", err));
        }
      },
      onExitRequested: handleExit,
    });
  };

  useEffect(() => {
    const onSquat = () => {
      repCountRef.current += 1;
    };
    window.addEventListener("mv:squat:start", onSquat);
    return () => window.removeEventListener("mv:squat:start", onSquat);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;

    document.fonts.load('16px "Press Start 2P"').finally(() => {
      if (cancelled || !canvasRef.current) return;
      bootGame(canvasRef.current);
    });

    return () => {
      cancelled = true;
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [bootGame]);

  const handleRetry = () => {
    repCountRef.current = 0;
    setGameResult(null);
    gameRef.current?.destroy();
    gameRef.current = null;
    if (!canvasRef.current) return;
    document.fonts.load('16px "Press Start 2P"').finally(() => {
      if (!canvasRef.current) return;
      bootGame(canvasRef.current);
    });
  };

  const handleExit = () => {
    setGameResult(null);
    nav("/level");
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ maxWidth: "100%", maxHeight: "100%" }} />

      {isIdle && !gameResult && (
        <GameIdleModal difficulty={diffConfig.label} repGoal={diffConfig.repGoal} />
      )}

      {gameResult && (
        <GameResultModal result={gameResult} onRetry={handleRetry} onExit={handleExit} />
      )}
    </>
  );
}

export default GamePage;
