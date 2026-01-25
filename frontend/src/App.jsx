import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Search from './pages/Search'
import CodeOfConduct from './pages/CodeOfConduct'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/code-of-conduct" element={<CodeOfConduct />} />
      </Routes>
    </Router>
  )
}

export default App
