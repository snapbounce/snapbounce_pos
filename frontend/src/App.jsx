import { useState, useEffect } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import POSInterface from './components/POSInterface'
import AdminInterface from './components/AdminInterface'
import DailyReports from './components/DailyReports'
import './App.css'

function App() {
  return (
    <>
      <nav className="nav">
        <div className="nav-content">
          <Link to="/" className="nav-brand">SnapBounce POS</Link>
          <div className="nav-links">
            <Link to="/" className="nav-link active">POS</Link>
            <Link to="/admin" className="nav-link">Admin</Link>
            <Link to="/reports" className="nav-link">Daily Reports</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <Routes>
          <Route path="/" element={<POSInterface />} />
          <Route path="/admin" element={<AdminInterface />} />
          <Route path="/reports" element={<DailyReports />} />
        </Routes>
      </div>
    </>
  )
}

export default App
