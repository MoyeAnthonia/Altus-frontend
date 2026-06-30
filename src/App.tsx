import "./styles/global.css";
import { Routes, Route } from "react-router";
import Navbar from "./components/Navbar/Navbar";
import { Home, Features, AudienceSection, SelectWorkoutSection } from "./pages/Home";
import {} from "./pages/Home";
import Dashboard from "./pages/Dashboard/Dashboard";
import LevelSection from "./pages/Level/Level";
import CameraSetupPage from "./pages/Warmup/Warmup";
import GamePage from "./pages/Game/Game";
import LoginPage from "./pages/Login/Login";
import WorkoutSection from "./components/WorkoutSection/WorkoutSection";
import Footer from "./components/Footer/Footer";
import ExercisePage from "./pages/Exercise/Exercise";

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Home />
              <Features />
              <AudienceSection />
              <SelectWorkoutSection />
            </>
          }
        />
        <Route path="/profile" element={<Dashboard />} />
        <Route path="/level" element={<LevelSection />} />
        <Route path="/warmup" element={<CameraSetupPage />} />
        <Route path="/games" element={<GamePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/workout" element={<WorkoutSection />} />
        <Route path="/exercise" element={<ExercisePage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
