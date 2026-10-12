import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, BookOpen, Info, Languages } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

const LINKS = [
  { to: '/', key: 'home', icon: LayoutDashboard, end: true, auth: true },
  { to: '/stat', key: 'stat', icon: BarChart3, auth: true },
  { to: '/howtouse', key: 'howtouse', icon: BookOpen },
  { to: '/about', key: 'about', icon: Info },
];

export default function NavBar({ user }) {
  const { t, locale, setLocale } = useTranslation();
  const links = LINKS.filter((l) => !l.auth || user);

  return (
    <nav className="page-nav" aria-label="Main navigation">
      <div className="page-nav-links">
        {links.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            id={`nav-link-${key}`}
            className={({ isActive }) => `page-nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={15} />
            <span>{t(`pages.nav.${key}`)}</span>
          </NavLink>
        ))}
      </div>
      <button
        className="page-nav-lang"
        id="nav-lang-toggle"
        onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
        title="Language"
      >
        <Languages size={14} />
        <span>{locale.toUpperCase()}</span>
      </button>
    </nav>
  );
}
