
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home/Home'
import Chatbot from './pages/Chatbot/Chatbot'; 

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chatbot />} />
      </Routes>
    </Router>
  )
}

export default App
