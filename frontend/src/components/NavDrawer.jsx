import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, BookOpen, Info, Languages } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { useMenu } from './menuContext';

const LINKS = [
  { to: '/', key: 'home', icon: LayoutDashboard, end: true, auth: true },
  { to: '/stat', key: 'stat', icon: BarChart3, auth: true },
  { to: '/howtouse', key: 'howtouse', icon: BookOpen },
  { to: '/about', key: 'about', icon: Info },
];

/** Slide-in navigation drawer. Opens below the header so the header controls stay visible. */
export default function NavDrawer({ user }) {
  const { t, locale, setLocale } = useTranslation();
  const { open, close } = useMenu();
  const links = LINKS.filter((l) => !l.auth || user);
  // The switch shows the language you would switch TO.
  const targetLocale = locale === 'ru' ? 'en' : 'ru';

  return (
    <>
      <div className={`drawer-overlay ${open ? 'open' : ''}`} onClick={close} />
      <aside className={`nav-drawer ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="Main navigation">
        <nav className="drawer-links">
          {links.map(({ to, key, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              id={`nav-link-${key}`}
              onClick={close}
              tabIndex={open ? 0 : -1}
              className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{t(`pages.nav.${key}`)}</span>
            </NavLink>
          ))}
        </nav>
        <button
          className="page-nav-lang"
          id="nav-lang-toggle"
          onClick={() => setLocale(targetLocale)}
          tabIndex={open ? 0 : -1}
          title="Language"
        >
          <Languages size={14} />
          <span>{targetLocale.toUpperCase()}</span>
        </button>
      </aside>
    </>
  );
}
