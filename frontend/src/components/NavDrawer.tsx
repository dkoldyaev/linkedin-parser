import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Info,
  Languages,
  FileText,
  Key,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { useMenu } from './menuContext';
import { useGridScroll } from '../utils/useGridScroll';
import { trackEvent, EVENTS } from '../utils/analytics';
import type { User } from '../types/models';
import { settingsService } from '../services/settingsService';

interface NavLinkItem {
  to: string;
  key: string;
  icon: LucideIcon;
  end?: boolean;
  auth?: boolean;
}

const LINKS: NavLinkItem[] = [
  { to: '/', key: 'home', icon: LayoutDashboard, end: true, auth: true },
  { to: '/cv', key: 'cv', icon: FileText, auth: true },
  { to: '/stat', key: 'stat', icon: BarChart3, auth: true },
  { to: '/apikeys', key: 'apikeys', icon: Key, auth: true },
  { to: '/howtouse', key: 'howtouse', icon: BookOpen },
  { to: '/about', key: 'about', icon: Info },
];

export interface NavDrawerProps {
  user?: User | null;
}

function isLinkVisibleForUser(link: NavLinkItem, user?: User | null): boolean {
  return !link.auth || Boolean(user);
}

function resolveNavLabel(key: string, t: (path: string) => string): string {
  const path = `pages.nav.${key}`;
  const translated = t(path);
  return translated !== path ? translated : key;
}

function useDrawerGridTail(drawerRef: React.RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const align = () => {
      const drawer = drawerRef.current;
      if (!drawer) return;
      const raw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid'));
      const grid = Number.isNaN(raw) || raw <= 0 ? 32 : raw;
      drawer.style.setProperty('--drawer-grid-tail', `${window.innerWidth % grid}px`);
    };
    align();
    window.addEventListener('resize', align);
    return () => window.removeEventListener('resize', align);
  }, [drawerRef]);
}

function useEscapeClose(open: boolean, close: () => void): void {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);
}

async function persistLocaleOnServer(targetLocale: string, hasUser: boolean): Promise<void> {
  if (!hasUser) return;
  try {
    await settingsService.saveSettings({ locale: targetLocale });
  } catch (err) {
    console.error('Failed to save language setting', err);
  }
}

/** Slide-in navigation drawer. Opens below the header so the header controls stay visible. */
export default function NavDrawer({ user }: NavDrawerProps): React.ReactElement {
  const { t, locale, setLocale } = useTranslation();
  const { open, close } = useMenu();
  const { pathname } = useLocation();
  const drawerRef = useRef<HTMLElement | null>(null);
  const snapScroll = useGridScroll();

  useDrawerGridTail(drawerRef);
  useEscapeClose(open, close);

  const links = LINKS.filter((l) => isLinkVisibleForUser(l, user));
  const targetLocale = locale === 'ru' ? 'en' : 'ru';
  const itemTabIndex = open ? 0 : -1;

  const handleLanguageToggle = async () => {
    setLocale(targetLocale);
    trackEvent(EVENTS.LANGUAGE_CHANGE, { locale: targetLocale });
    await persistLocaleOnServer(targetLocale, Boolean(user));
  };

  return (
    <>
      <div className={`drawer-overlay ${open ? 'open' : ''}`} onClick={close} />
      <aside
        ref={drawerRef}
        className={`nav-drawer ${open ? 'open' : ''}`}
        aria-hidden={!open}
        aria-label="Main navigation"
      >
        <div className="drawer-header-meta">
          <span className="drawer-tag">Navigation</span>
        </div>
        <nav className="drawer-links" onScroll={snapScroll}>
          {links.map(({ to, key, end, icon: IconComponent }, idx) => {
            const isBoardPath = pathname === '/' || pathname.startsWith('/vacancies/');
            const isActive = end ? isBoardPath : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                id={`nav-link-${key}`}
                onClick={close}
                tabIndex={itemTabIndex}
                className={`drawer-link ${isActive ? 'active' : ''}`}
              >
                <span className="drawer-index">{String(idx + 1).padStart(2, '0')}</span>
                <IconComponent className="drawer-link-icon" size={18} aria-hidden />
                <span className="drawer-link-text">{resolveNavLabel(key, t)}</span>
                <span className="drawer-link-arrow">→</span>
              </Link>
            );
          })}
        </nav>
        <div className="drawer-footer">
          <div className="drawer-sys-status">
            <span className="sys-status-dot" />
            <span className="sys-status-label">Workspace</span>
          </div>
          <button
            type="button"
            className="page-nav-lang"
            id="nav-lang-toggle"
            onClick={handleLanguageToggle}
            tabIndex={itemTabIndex}
            title="Language"
          >
            <Languages size={14} />
            <span>{targetLocale.toUpperCase()}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
