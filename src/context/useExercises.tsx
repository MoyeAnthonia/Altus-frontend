import { useContext } from "react";
import { ExercisesContext } from "./ExercisesContext";

export function useExercises() {
  const context = useContext(ExercisesContext);

  if (!context) {
    throw new Error("useExercises must be used inside <ExercisesProvider>");
  }
  return context;
}
