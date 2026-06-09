import "./styles/global.css";
import { Navbar } from "./components/Navbar/Navbar";
import { Home, Features, AudienceSection, SelectWorkoutSection } from "./pages/Home";
import {} from "./pages/Home";
function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <Navbar />
      <Home />
      <Features />
      <AudienceSection />
      <SelectWorkoutSection />
      {/* <Footer /> */}
    </>
  );
}

export default App;
