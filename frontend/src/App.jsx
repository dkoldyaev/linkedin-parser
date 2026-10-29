import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import LoginModal from './components/LoginModal';
import NavDrawer from './components/NavDrawer';
import PageHeader from './components/PageHeader';
import { MenuContext } from './components/menuContext';
import HomePage from './pages/HomePage';
import StatsPage from './pages/StatsPage';
import HowToUsePage from './pages/HowToUsePage';
import AboutPage from './pages/AboutPage';
import { setAnalyticsUser, trackEvent, EVENTS } from './utils/analytics';
import { loadLocalUser, saveLocalUser, clearLocalUser } from './utils/offlineSync';

function Layout({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const menu = useMemo(
    () => ({ open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) }),
    [open]
  );
  // The board ("/") renders its own header with search; other pages use the shared one.
  const showPageHeader = pathname !== '/';

  return (
    <MenuContext.Provider value={menu}>
      <div className="app-shell">
        {showPageHeader && <PageHeader user={user} onLogout={onLogout} />}
        <div className="app-shell-content">
          <Outlet />
        </div>
        <NavDrawer user={user} />
      </div>
    </MenuContext.Provider>
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
        saveLocalUser(userData);
      } else if (res.status === 401 || res.status === 403) {
        clearLocalUser();
        setUser(null);
        setAnalyticsUser(null);
      } else {
        // Non-auth server issue, try local cache
        const cached = loadLocalUser();
        if (cached) {
          setUser(cached);
          setAnalyticsUser(cached);
        } else {
          setUser(null);
          setAnalyticsUser(null);
        }
      }
    } catch (err) {
      console.debug('Auth check offline fallback', err);
      const cached = loadLocalUser();
      if (cached) {
        setUser(cached);
        setAnalyticsUser(cached);
      } else {
        setUser(null);
        setAnalyticsUser(null);
      }
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    trackEvent(EVENTS.LOGOUT);
    clearLocalUser();
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
        saveLocalUser(userData);
        setAnalyticsUser(userData);
        setUser(userData);
      }}
    />
  );

  return (
    <Routes>
      <Route element={<Layout user={user} onLogout={handleLogout} />}>
        <Route path="/" element={user ? <HomePage user={user} onLogout={handleLogout} /> : loginScreen} />
        <Route path="/stat" element={user ? <StatsPage /> : loginScreen} />
        <Route path="/howtouse" element={<HowToUsePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
