'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import LoginModal from './LoginModal';
import NavDrawer from './NavDrawer';
import PageHeader from './PageHeader';
import { MenuContext } from './menuContext';
import { useGridScroll } from '../utils/useGridScroll';
import { setAnalyticsUser, trackEvent, EVENTS } from '../utils/analytics';

export const AuthContext = createContext({
  user: null,
  authLoading: true,
  checkAuth: () => {},
  handleLogout: () => {},
  setUser: () => {}
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const snapScroll = useGridScroll();

  // 32px Grid snapping and centering for modals (from visual_redesign_design_system)
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

  const menu = useMemo(
    () => ({ open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) }),
    [open]
  );

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
    router.push('/');
  };

  const showPageHeader = pathname !== '/';

  // Public paths that do not force login
  const isPublicPage = pathname === '/howtouse' || pathname === '/about';

  return (
    <AuthContext.Provider value={{ user, authLoading, checkAuth, handleLogout, setUser }}>
      <MenuContext.Provider value={menu}>
        <div className="app-shell">
          {showPageHeader && (
            <PageHeader
              user={user}
              onLogout={handleLogout}
              onUserUpdated={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
            />
          )}

          <div className="app-shell-content" onScroll={snapScroll}>
            {authLoading ? (
              // Preserve SSR HTML by rendering children while auth check finishes
              children
            ) : !user && !isPublicPage ? (
              <LoginModal onLoginSuccess={checkAuth} />
            ) : (
              children
            )}
          </div>

          <NavDrawer user={user} />
        </div>
      </MenuContext.Provider>
    </AuthContext.Provider>
  );
}
