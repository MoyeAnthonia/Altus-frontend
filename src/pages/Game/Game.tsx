import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  DinoRunGame,
  type DifficultyKey,
  type GameEndResult,
} from "../../engine/DinoRunGameEngine";
import { useMediaPipe } from '../../mediapipe/useMediaPipe';
import GameResultModal from './GameResultModal';

interface LocationState {
  difficulty: DifficultyKey;
}

function GamePage() {
  const location = useLocation();
  const nav = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<DinoRunGame | null>(null);
  const [gameResult, setGameResult] = useState<GameEndResult | null>(null);

  const difficulty = (location.state as LocationState)?.difficulty ?? "medium";

  useMediaPipe();

  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;

    const start = () => {
      if (cancelled || !canvasRef.current) return;
      gameRef.current = new DinoRunGame({
        canvas: canvasRef.current,
        difficulty,
        onGameEnd: (result: GameEndResult) => {
          setGameResult(result);
        },
          onGameStart: () => {
            setGameResult(null);
          },
      });
    };

    document.fonts.load('16px "Press Start 2P"').finally(start);

    return () => {
      cancelled = true;
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [difficulty]);

  const handleRetry = () => {
    setGameResult(null);
    gameRef.current?.destroy();
    gameRef.current = null;
    if (!canvasRef.current) return;
    document.fonts.load('16px "Press Start 2P"').finally(() => {
      if (!canvasRef.current) return;
      gameRef.current = new DinoRunGame({
        canvas: canvasRef.current,
        difficulty,
        onGameEnd: (result: GameEndResult) => setGameResult(result),
      });
    });
  };

  const handleExit = () => {
    setGameResult(null);
    nav('/level');
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ maxWidth: "100%", maxHeight: "100%" }} />
      {gameResult && (
        <GameResultModal
          result={gameResult}
          onRetry={handleRetry}
          onExit={handleExit}
        />
      )}
    </>
  );
}

export default GamePage;
