import { useState } from 'react'
import './App.css'
import './styles/global.css'
import { Navbar } from './components/Navbar/Navbar'
import {Home} from './pages/Home'
import Footer from './components/Footer'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Navbar/>
    <Home/>
      <section id="center">
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <div className="ticks"></div>
      <section id="spacer"></section>
      {/* <Footer/> */}
    </>
  )
}

export default App
