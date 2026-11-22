'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import LoginModal from './LoginModal';
import NavDrawer from './NavDrawer';
import { MenuContext } from './menuContext';
import { useGridScroll } from '../utils/useGridScroll';
import { setAnalyticsUser, trackEvent, EVENTS } from '../utils/analytics';
import type { User } from '../types/models';
import { authService } from '../services/authService';

export interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  checkAuth: () => Promise<void>;
  handleLogout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  authLoading: false,
  checkAuth: async () => {},
  handleLogout: async () => {},
  setUser: () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export interface AppShellProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

function computeCenteredGridOffset(viewport: number, size: number, grid: number): number {
  const centered = (viewport - size) / 2;
  const lastGridLine = Math.max(0, Math.floor((viewport - size) / grid) * grid);
  return Math.min(lastGridLine, Math.max(0, Math.round(centered / grid) * grid)) - centered;
}

function alignModalElement(modal: HTMLElement, remeasure: boolean): void {
  if (!modal.isConnected) return;
  const rawGrid = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid'));
  const grid = Number.isNaN(rawGrid) || rawGrid <= 0 ? 32 : rawGrid;
  if (remeasure) {
    modal.style.width = '';
    modal.style.height = '';
  }
  const maxHeight = Math.max(
    grid,
    Math.floor(Math.min(window.innerHeight * 0.9, window.innerHeight - 40) / grid) * grid
  );
  modal.style.setProperty('--modal-grid-max-height', `${maxHeight}px`);
  const gridWidth = Math.floor(modal.offsetWidth / grid) * grid;
  if (gridWidth >= grid) {
    modal.style.width = `${gridWidth}px`;
  }
  modal.style.height = `${Math.min(maxHeight, Math.ceil(modal.offsetHeight / grid) * grid)}px`;
  modal.style.setProperty(
    '--modal-grid-x',
    `${computeCenteredGridOffset(window.innerWidth, modal.offsetWidth, grid)}px`
  );
  modal.style.setProperty(
    '--modal-grid-y',
    `${computeCenteredGridOffset(window.innerHeight, modal.offsetHeight, grid)}px`
  );
}

function useModalGridAlignment(): void {
  useEffect(() => {
    const observed = new Set<HTMLElement>();
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(({ target }) => {
        if (target instanceof HTMLElement) {
          alignModalElement(target, false);
        }
      });
    });

    const sync = () => {
      observed.forEach((modal) => {
        if (!modal.isConnected) {
          resizeObserver.unobserve(modal);
          observed.delete(modal);
        }
      });
      document.querySelectorAll<HTMLElement>('.modal-overlay > .modal-content').forEach((modal) => {
        if (!observed.has(modal)) {
          observed.add(modal);
          resizeObserver.observe(modal);
        }
        alignModalElement(modal, true);
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
}

function useAuthState(initialUser?: User | null) {
  const [user, setUser] = useState<User | null>(initialUser !== undefined ? initialUser : null);
  const [authLoading, setAuthLoading] = useState<boolean>(initialUser === undefined);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      setAuthLoading(true);
      const userData = await authService.getMe();
      if (userData) {
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
      setAnalyticsUser(initialUser);
    } else {
      void checkAuth();
    }
  }, [initialUser, checkAuth]);

  const handleLogout = useCallback(async () => {
    trackEvent(EVENTS.LOGOUT);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout failed', err);
    }
    await checkAuth();
    router.refresh();
  }, [checkAuth, router]);

  return { user, setUser, authLoading, checkAuth, handleLogout, router };
}

const SHELL_CONTENT_STYLE: React.CSSProperties = {
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const SPINNER_STYLE: React.CSSProperties = {
  color: '#2563eb',
  animation: 'spin 1s linear infinite',
};

function isLandingPathname(pathname: string): boolean {
  return pathname === '/howtouse' || pathname === '/landing';
}

function isPublicPathname(pathname: string): boolean {
  return isLandingPathname(pathname) || pathname === '/about';
}

function resolveShellRouteFlags(pathname: string, user: User | null, authLoading: boolean) {
  const landingRoute = isLandingPathname(pathname);
  const requiresLoginModal = !authLoading && !user && !isPublicPathname(pathname);
  const shouldSnapScroll = Boolean(user) || pathname === '/' || landingRoute;
  const contentClassName = `app-shell-content${landingRoute ? ' is-landing' : ''}`;
  return { requiresLoginModal, shouldSnapScroll, contentClassName };
}



export function AppShell({ children, initialUser }: AppShellProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || '/';
  const snapScroll = useGridScroll();
  const { user, setUser, authLoading, checkAuth, handleLogout, router } = useAuthState(initialUser);

  useModalGridAlignment();

  const menu = useMemo(
    () => ({ open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) }),
    [open]
  );

  const authValue = useMemo(
    () => ({ user, authLoading, checkAuth, handleLogout, setUser }),
    [user, authLoading, checkAuth, handleLogout, setUser]
  );

  const { requiresLoginModal, shouldSnapScroll, contentClassName } = resolveShellRouteFlags(
    pathname,
    user,
    authLoading
  );

  const handleLoginSuccess = (userData: User) => {
    setAnalyticsUser(userData);
    setUser(userData);
    router.refresh();
  };

  let bodyContent = children;
  if (authLoading) {
    bodyContent = (
      <div className="auth-loading-screen">
        <Loader2 size={40} className="spin" style={SPINNER_STYLE} />
      </div>
    );
  } else if (requiresLoginModal) {
    bodyContent = <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AuthContext.Provider value={authValue}>
      <MenuContext.Provider value={menu}>
        <div style={{ height: '100vh', overflow: 'hidden' }}>
          <div
            className={contentClassName}
            style={SHELL_CONTENT_STYLE}
            onScroll={shouldSnapScroll ? snapScroll : undefined}
          >
            {bodyContent}
          </div>
          <NavDrawer user={user} />
        </div>
      </MenuContext.Provider>
    </AuthContext.Provider>
  );
}
