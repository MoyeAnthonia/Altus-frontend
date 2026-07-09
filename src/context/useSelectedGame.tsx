import { useContext } from "react";
import { SelectedGameContext } from "./SelectedGameContext";

export function useSelectedGame() {
  const context = useContext(SelectedGameContext);

  if (!context) {
    throw new Error("useSelectedGame must be used inside <SelectedGameProvider>");
  }
  return context;
}
