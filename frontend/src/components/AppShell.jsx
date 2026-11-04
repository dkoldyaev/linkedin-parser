'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import LoginModal from './LoginModal';
import NavDrawer from './NavDrawer';
import PageHeader from './PageHeader';
import { MenuContext } from './menuContext';
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

          <div className="app-shell-content">
            {authLoading ? (
              <div className="loading-state" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="spinner" size={32} />
              </div>
            ) : !user && !isPublicPage ? (
              <LoginModal isOpen={true} onLoginSuccess={checkAuth} />
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
