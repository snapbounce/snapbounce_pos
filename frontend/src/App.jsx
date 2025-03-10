import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import POSInterface from './components/POSInterface';
import AdminInterface from './components/AdminInterface';
import PinDialog from './components/PinDialog';
import './App.css';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleAdminClick = () => {
    setShowPinDialog(true);
  };

  const handlePinVerified = () => {
    setShowPinDialog(false);
    setShowAdmin(true);
    navigate('/admin');
  };

  const handlePinCancel = () => {
    setShowPinDialog(false);
    navigate('/');
  };

  const handleBackToPOS = () => {
    setShowAdmin(false);
    navigate('/');
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="app-wrapper">
      <nav className="nav">
        <div className="nav-content">
          <div className="nav-brand-container">
            <Link to="/" className="nav-brand">
              SnapBounce POS
            </Link>
            <button 
              className="mobile-menu-button"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                {isMobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>

          <div className={`nav-links ${isMobileMenuOpen ? 'show' : ''}`}>
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              POS
            </Link>
            <button 
              className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
              onClick={handleAdminClick}
            >
              Admin
            </button>
          </div>
        </div>
      </nav>

      {showPinDialog && (
        <PinDialog
          onVerify={handlePinVerified}
          onCancel={handlePinCancel}
        />
      )}

      <main className="container">
        <Routes>
          <Route path="/" element={<POSInterface />} />
          <Route 
            path="/admin" 
            element={
              showAdmin ? (
                <AdminInterface onBackToPOS={handleBackToPOS} />
              ) : (
                <div className="unauthorized">
                  <h2>Unauthorized Access</h2>
                  <p>Please use the Admin button to access this page.</p>
                  <button onClick={() => navigate('/')}>Back to POS</button>
                </div>
              )
            } 
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
