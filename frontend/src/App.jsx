import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Search from './pages/Search'
export default function App() {
  return <BrowserRouter><Routes><Route path="/" element={<Search />} /><Route path="/search" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>
}
