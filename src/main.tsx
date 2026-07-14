import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./styles/global.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ExercisesProvider } from "./context/ExercisesContext.tsx";
import { ProfileProvider } from "./context/ProfileContext.tsx";
import { SelectedGameProvider } from "./context/SelectedGameContext.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <ExercisesProvider>
            <ProfileProvider>
              <SelectedGameProvider>
                <App />
              </SelectedGameProvider>
            </ProfileProvider>
          </ExercisesProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
