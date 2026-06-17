import "./styles/global.css";
import { Routes, Route } from "react-router";
import { Navbar } from "./components/Navbar/Navbar";
import { Home, Features, AudienceSection, SelectWorkoutSection } from "./pages/Home";
import {} from "./pages/Home";
import Dashboard from "./pages/Dashboard/Dashboard";
import LevelSection from "./pages/Level/Level";
import CameraSetupPage from "./pages/Warmup/Warmup";
import GamePage from "./pages/Exercise/Exercise";
import LoginPage from "./pages/Login/Login";

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
        <Route path="/exercise" element={<GamePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </>
  );
}

export default App;
