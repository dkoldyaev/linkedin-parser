import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import LoginModal from './components/LoginModal';
import NavDrawer from './components/NavDrawer';
import PageHeader from './components/PageHeader';
import { MenuContext } from './components/menuContext';
import { useGridScroll } from './utils/useGridScroll';
import HomePage from './pages/HomePage';
import StatsPage from './pages/StatsPage';
import HowToUsePage from './pages/HowToUsePage';
import AboutPage from './pages/AboutPage';
import CVManagementPage from './pages/CVManagementPage';
import ApiKeysPage from './pages/ApiKeysPage';
import UserManagementPage from './pages/UserManagementPage';
import AdminPage from './pages/AdminPage';
import LandingPage from './pages/LandingPage';
import { setAnalyticsUser, trackEvent, EVENTS } from './utils/analytics';

function Layout({ user, onLogout, onUserUpdated }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const snapScroll = useGridScroll();
  const menu = useMemo(
    () => ({ open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) }),
    [open]
  );
  // The board ("/") renders its own header with search; other pages use the shared one.
  const showPageHeader = pathname !== '/';

  return (
    <MenuContext.Provider value={menu}>
      <div className="app-shell">
        {showPageHeader && <PageHeader user={user} onLogout={onLogout} onUserUpdated={onUserUpdated} />}
        <div className="app-shell-content" onScroll={snapScroll}>
          <Outlet />
        </div>
        {user && <NavDrawer user={user} />}
      </div>
    </MenuContext.Provider>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const observed = new Set();
    const align = (modal, remeasure = false) => {
      if (!modal.isConnected) return;
      const grid = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid')) || 32;
      if (remeasure) {
        modal.style.width = '';
        modal.style.height = '';
      }
      const maxHeight = Math.max(grid, Math.floor(Math.min(window.innerHeight * .9, window.innerHeight - 40) / grid) * grid);
      modal.style.setProperty('--modal-grid-max-height', `${maxHeight}px`);
      const width = modal.offsetWidth;
      const gridWidth = Math.floor(width / grid) * grid;
      if (gridWidth >= grid) modal.style.width = `${gridWidth}px`;
      const height = modal.offsetHeight;
      modal.style.height = `${Math.min(maxHeight, Math.ceil(height / grid) * grid)}px`;
      const offset = (viewport, size) => {
        const centered = (viewport - size) / 2;
        const lastGridLine = Math.max(0, Math.floor((viewport - size) / grid) * grid);
        return Math.min(lastGridLine, Math.max(0, Math.round(centered / grid) * grid)) - centered;
      };
      modal.style.setProperty('--modal-grid-x', `${offset(window.innerWidth, modal.offsetWidth)}px`);
      modal.style.setProperty('--modal-grid-y', `${offset(window.innerHeight, modal.offsetHeight)}px`);
    };
    const resizeObserver = new ResizeObserver(entries => entries.forEach(({ target }) => align(target)));
    const sync = () => {
      observed.forEach(modal => {
        if (!modal.isConnected) { resizeObserver.unobserve(modal); observed.delete(modal); }
      });
      document.querySelectorAll('.modal-overlay > .modal-content').forEach(modal => {
        if (!observed.has(modal)) { observed.add(modal); resizeObserver.observe(modal); }
        align(modal, true);
      });
    };
    const mutations = new MutationObserver(sync);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', sync);
    sync();
    return () => { mutations.disconnect(); resizeObserver.disconnect(); window.removeEventListener('resize', sync); };
  }, []);

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
        <Loader2 size={40} className="spin" style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
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
      <Route element={<Layout user={user} onLogout={handleLogout} onUserUpdated={setUser} />}>
        <Route path="/" element={user ? <HomePage user={user} onLogout={handleLogout} onUserUpdated={setUser} /> : <LandingPage onLoginSuccess={setUser} />} />
        <Route path="/cv" element={user ? <CVManagementPage key={user.id} user={user} /> : loginScreen} />
        <Route path="/stat" element={user ? <StatsPage /> : loginScreen} />
        <Route path="/apikeys" element={user ? <ApiKeysPage user={user} /> : loginScreen} />
        <Route path="/users" element={user ? <UserManagementPage user={user} /> : loginScreen} />
        <Route path="/admin" element={user ? <AdminPage user={user} /> : loginScreen} />
        <Route path="/howtouse" element={<HowToUsePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
