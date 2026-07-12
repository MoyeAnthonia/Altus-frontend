import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./styles/global.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ExercisesProvider } from "./context/ExercisesContext.tsx";
import { ProfileProvider } from "./context/ProfileContext.tsx";
import { SelectedGameProvider } from "./context/SelectedGameContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ExercisesProvider>
          <ProfileProvider>
            <SelectedGameProvider>
              <App />
            </SelectedGameProvider>
          </ProfileProvider>
        </ExercisesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
