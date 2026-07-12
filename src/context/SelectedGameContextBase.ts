import { createContext } from "react";

export type SelectedGameContextType = {
  gameId: string | null;
  setGameId: (gameId: string) => void;
};

export const SelectedGameContext = createContext<SelectedGameContextType | null>(null);
