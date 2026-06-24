import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { DinoRunGame, type DifficultyKey, type GameEndResult } from "../../engine/dinoRunEngine";

interface LocationState {
  difficulty: DifficultyKey;
}

function GamePage() {
  const nav = useNavigate();
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<DinoRunGame | null>(null);

  // Read the difficulty that Level.tsx passed through router state.
  // Falls back to 'medium' if someone navigates directly to /game.
  const difficulty = (location.state as LocationState)?.difficulty ?? "medium";

  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;

    const start = () => {
      if (cancelled || !canvasRef.current) return;
      gameRef.current = new DinoRunGame({
        canvas: canvasRef.current,
        difficulty,
        onGameEnd: (result: GameEndResult) => {
          // The engine already shows its own win/lose screen inside the canvas.
          // Use this callback if you want to do anything outside the canvas too —
          // e.g. save the score to your backend, or navigate back after a delay.
          console.log("Game ended:", result);
        },
      });
    };

    // Wait for Press Start 2P to load before booting so canvas text
    // renders in the right font from the very first frame.
    document.fonts.load('16px "Press Start 2P"').finally(start);

    return () => {
      cancelled = true;
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [difficulty]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#1a1a2e" }}>
      <div style={{ border: "3px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", boxShadow: "0 0 40px rgba(100,200,255,0.15)" }}>
        <canvas ref={canvasRef} />
      </div>
      <button
        onClick={() => nav(-1)}
        style={{ marginTop: "16px", fontFamily: '"Press Start 2P", monospace', fontSize: "12px", color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}
      >
        ← Back to difficulty select
      </button>
    </div>
  );
}

export default GamePage;