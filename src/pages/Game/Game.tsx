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

interface LocationState {
  difficulty: DifficultyKey;
}

function GamePage() {
  const location = useLocation();
  const nav = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<DinoRunGame | null>(null);
  const [gameResult, setGameResult] = useState<GameEndResult | null>(null);
  const [isIdle, setIsIdle] = useState(false);

  const difficulty = (location.state as LocationState)?.difficulty ?? "medium";
  const diffConfig = DIFFICULTIES[difficulty];

  useMediaPipe();

  // Memoized so its identity only changes when `difficulty` does.
  // State setters (setIsIdle, setGameResult) are guaranteed stable by React,
  // so they don't need to be listed as dependencies.
  const bootGame = useCallback(
    (canvas: HTMLCanvasElement) => {
      gameRef.current = new DinoRunGame({
        canvas,
        difficulty,
        onGameIdle: () => {
          setIsIdle(true);
          setGameResult(null);
        },
        onGameStart: () => setIsIdle(false),
        onGameEnd: (result: GameEndResult) => {
          setGameResult(result);
        },
      });
    },
    [difficulty],
  );

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
