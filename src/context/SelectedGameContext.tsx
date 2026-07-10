import { createContext, useMemo, useState, type ReactNode } from "react";

type SelectedGameContextType = {
  gameId: string | null;
  setGameId: (gameId: string) => void;
};

export const SelectedGameContext = createContext<SelectedGameContextType | null>(null);

export function SelectedGameProvider({ children }: { children: ReactNode }) {
  const [gameId, setGameId] = useState<string | null>(null);

  const value = useMemo(() => ({ gameId, setGameId }), [gameId]);

  return <SelectedGameContext.Provider value={value}>{children}</SelectedGameContext.Provider>;
}
