import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./styles/global.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ExercisesProvider } from "./context/ExercisesContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ExercisesProvider>
          <App />
        </ExercisesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
