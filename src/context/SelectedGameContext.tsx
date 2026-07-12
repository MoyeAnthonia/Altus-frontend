import { useMemo, useState, type ReactNode } from "react";
import { SelectedGameContext } from "./SelectedGameContextBase";

export function SelectedGameProvider({ children }: { children: ReactNode }) {
  const [gameId, setGameIdState] = useState<string | null>(() =>
    sessionStorage.getItem("al_game_id"),
  );

  const setGameId = (id: string) => {
    setGameIdState(id);
    sessionStorage.setItem("al_game_id", id);
  };

  const value = useMemo(() => ({ gameId, setGameId }), [gameId]);

  return <SelectedGameContext.Provider value={value}>{children}</SelectedGameContext.Provider>;
}
