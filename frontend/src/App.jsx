import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import LoginModal from './components/LoginModal';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import StatsPage from './pages/StatsPage';
import HowToUsePage from './pages/HowToUsePage';
import AboutPage from './pages/AboutPage';
import { setAnalyticsUser, trackEvent, EVENTS } from './utils/analytics';

function Layout({ user }) {
  return (
    <div className="app-shell">
      <NavBar user={user} />
      <div className="app-shell-content">
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      setAuthLoading(true);
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setAnalyticsUser(userData);
      } else {
        setUser(null);
        setAnalyticsUser(null);
      }
    } catch (err) {
      console.debug('Auth check error', err);
      setUser(null);
      setAnalyticsUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    trackEvent(EVENTS.LOGOUT);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed', err);
    }
    setUser(null);
    setAnalyticsUser(null);
  };

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <Loader2 size={40} className="spin" style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const loginScreen = (
    <LoginModal
      onLoginSuccess={(userData) => {
        setAnalyticsUser(userData);
        setUser(userData);
      }}
    />
  );

  return (
    <Routes>
      <Route element={<Layout user={user} />}>
        <Route path="/" element={user ? <HomePage user={user} onLogout={handleLogout} /> : loginScreen} />
        <Route path="/stat" element={user ? <StatsPage /> : loginScreen} />
        <Route path="/howtouse" element={<HowToUsePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
