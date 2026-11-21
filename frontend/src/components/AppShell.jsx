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
import { PageLayout } from '@blueprint/ui-kit';

export const AuthContext = createContext({
  user: null,
  authLoading: false,
  checkAuth: () => {},
  handleLogout: () => {},
  setUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AppShell({ children, initialUser }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(initialUser !== undefined ? initialUser : null);
  const [authLoading, setAuthLoading] = useState(initialUser === undefined);
  const pathname = usePathname() || '/';
  const router = useRouter();
  const snapScroll = useGridScroll();

  useEffect(() => {
    const observed = new Set();
    const align = (modal, remeasure) => {
      if (!modal.isConnected) return;
      const grid = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid')) || 32;
      if (remeasure) {
        modal.style.width = '';
        modal.style.height = '';
      }
      const maxHeight = Math.max(grid, Math.floor(Math.min(window.innerHeight * 0.9, window.innerHeight - 40) / grid) * grid);
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
    const resizeObserver = new ResizeObserver((entries) => entries.forEach(({ target }) => align(target, false)));
    const sync = () => {
      observed.forEach((modal) => {
        if (!modal.isConnected) {
          resizeObserver.unobserve(modal);
          observed.delete(modal);
        }
      });
      document.querySelectorAll('.modal-overlay > .modal-content').forEach((modal) => {
        if (!observed.has(modal)) {
          observed.add(modal);
          resizeObserver.observe(modal);
        }
        align(modal, true);
      });
    };
    const mutations = new MutationObserver(sync);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', sync);
    sync();
    return () => {
      mutations.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setAuthLoading(true);
      const res = await fetch('/api/v2/auth/me');
      if (res && res.ok) {
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
    if (initialUser !== undefined) {
      setUser(initialUser);
      setAnalyticsUser(initialUser);
      setAuthLoading(false);
    } else {
      checkAuth();
    }
  }, [initialUser, checkAuth]);

  const handleLogout = useCallback(async () => {
    trackEvent(EVENTS.LOGOUT);
    try {
      await fetch('/api/v2/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed', err);
    }
    await checkAuth();
    router.refresh();
  }, [checkAuth, router]);

  const menu = useMemo(
    () => ({ open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) }),
    [open]
  );

  const isBoardRoute = (pathname === '/' || pathname.startsWith('/vacancies/')) && Boolean(user);
  const landingRoute = pathname === '/howtouse' || pathname === '/landing';
  const isPublicRoute = landingRoute || pathname === '/about';
  const showPageHeader = !isBoardRoute;

  return (
    <AuthContext.Provider value={{ user, authLoading, checkAuth, handleLogout, setUser }}>
      <MenuContext.Provider value={menu}>
        <PageLayout header={<PageHeader user={user} onLogout={handleLogout} onUserUpdated={setUser} />}>
          <div
            className={`app-shell-content${landingRoute ? ' is-landing' : ''}`}
            onScroll={user || pathname === '/' || landingRoute ? snapScroll : undefined}
          >
            {authLoading ? (
              <div className="auth-loading-screen">
                <Loader2 size={40} className="spin" style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : !user && !isPublicRoute ? (
              <LoginModal
                onLoginSuccess={(userData) => {
                  setAnalyticsUser(userData);
                  setUser(userData);
                  router.refresh();
                }}
              />
            ) : (
              children
            )}
          </div>
          <NavDrawer user={user} />
        </PageLayout>
      </MenuContext.Provider>
    </AuthContext.Provider>
  );
}
