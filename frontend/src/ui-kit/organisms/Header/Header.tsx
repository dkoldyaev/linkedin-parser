import React from 'react';
import {
  Download,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { cn } from '../../utils';
import styles from './Header.module.css';

export interface HeaderUser {
  readonly name?: string;
  readonly email?: string;
  readonly picture?: string;
  readonly isAnonymous?: boolean;
}

export interface HeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  readonly title?: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly brandIcon?: React.ReactNode;
  readonly brand?: React.ReactNode;
  readonly search?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly queueCount?: number;
  readonly queueLabel?: string;
  readonly onQueueClick?: () => void;
  readonly onAddVacancies?: () => void;
  readonly addVacanciesLabel?: string;
  readonly onRefresh?: () => void;
  readonly showThemeToggle?: boolean;
  readonly theme?: 'dark' | 'light';
  readonly onThemeToggle?: () => void;
  readonly onDownloadExtension?: () => void;
  readonly onSettingsClick?: () => void;
  readonly user?: HeaderUser;
  readonly onLogin?: () => void;
  readonly onLogout?: () => void;
  readonly menuOpen?: boolean;
  readonly onMenuToggle?: () => void;
}

/**
 * Header organism faithfully reproducing the live application top bar (.app-header).
 * Displays the technical blueprint square mark, brand title & subtitle, centered search bar,
 * queue pill, batch import, refresh, theme toggle, extension download, settings, user profile badge, and burger menu.
 */
export function Header({
  title = 'CV.ALTER',
  subtitle = 'PARSER & TRACKER',
  brandIcon,
  brand,
  search,
  actions,
  queueCount,
  queueLabel,
  onQueueClick,
  onAddVacancies,
  addVacanciesLabel = 'ДОБАВИТЬ ВАКАНСИИ',
  onRefresh,
  showThemeToggle = false,
  theme = 'dark',
  onThemeToggle,
  onDownloadExtension,
  onSettingsClick,
  user,
  onLogin,
  onLogout,
  menuOpen = false,
  onMenuToggle,
  className,
  children,
  ...rest
}: HeaderProps): React.ReactElement {
  const resolvedQueueLabel =
    queueLabel !== undefined
      ? queueLabel
      : queueCount !== undefined
        ? `${queueCount} В ОЧЕРЕДИ`
        : undefined;

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : 'U';

  const defaultBrand = (
    <div className={styles.brand}>
      <div className={styles.brandIcon}>
        {brandIcon !== undefined ? (
          brandIcon
        ) : (
          <span className={styles.blueprintMark} aria-hidden="true" />
        )}
      </div>
      <div className={styles.brandText}>
        <h1 className={styles.brandTitle}>{title}</h1>
        {subtitle !== undefined && (
          <p className={styles.brandSubtitle}>{subtitle}</p>
        )}
      </div>
    </div>
  );

  return (
    <header className={cn(styles.header, className)} {...rest}>
      {brand !== undefined ? brand : defaultBrand}

      {search !== undefined && (
        <div className={styles.headerCenter}>{search}</div>
      )}

      <div className={styles.headerActions}>
        {actions}

        {queueCount !== undefined && queueCount > 0 && (
          <button
            type="button"
            onClick={onQueueClick}
            className={styles.queuePill}
            title={resolvedQueueLabel}
          >
            <Loader2 size={13} className={styles.spin} />
            <span>{resolvedQueueLabel}</span>
          </button>
        )}

        {onAddVacancies !== undefined && (
          <button
            type="button"
            onClick={onAddVacancies}
            className={styles.addBtn}
          >
            <Plus size={16} />
            <span>{addVacanciesLabel}</span>
          </button>
        )}

        {onRefresh !== undefined && (
          <button
            type="button"
            onClick={onRefresh}
            className={styles.btnIcon}
            title="Обновить вакансии"
            aria-label="Обновить вакансии"
          >
            <RefreshCw size={17} />
          </button>
        )}

        {showThemeToggle && (
          <button
            type="button"
            onClick={onThemeToggle}
            className={styles.btnIcon}
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        )}

        {onDownloadExtension !== undefined && (
          <button
            type="button"
            onClick={onDownloadExtension}
            className={styles.btnIcon}
            title="Скачать расширение (ZIP)"
            aria-label="Скачать расширение (ZIP)"
          >
            <Download size={17} />
          </button>
        )}

        {onSettingsClick !== undefined && (
          <button
            type="button"
            onClick={onSettingsClick}
            className={styles.btnIcon}
            title="Настройки"
            aria-label="Настройки"
          >
            <Settings size={17} />
          </button>
        )}

        {user !== undefined && (
          user.isAnonymous ? (
            <button
              type="button"
              onClick={onLogin}
              className={styles.guestLoginBtn}
              title="Войти в аккаунт"
            >
              <LogIn size={15} />
              <span>Войти</span>
            </button>
          ) : (
            <div className={styles.userProfileBadge}>
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name ?? 'User avatar'}
                  className={styles.userAvatar}
                />
              ) : (
                <div className={styles.userAvatarPlaceholder}>
                  {userInitial}
                </div>
              )}
              <span className={styles.userName} title={user.email ?? user.name}>
                {user.name ?? user.email}
              </span>
              {onLogout !== undefined && (
                <button
                  type="button"
                  onClick={onLogout}
                  className={styles.btnLogout}
                  title="Выйти"
                  aria-label="Выйти"
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          )
        )}

        {onMenuToggle !== undefined && (
          <button
            type="button"
            id="menu-toggle"
            onClick={onMenuToggle}
            className={cn(styles.btnIcon, styles.burger, menuOpen && styles.burgerOpen)}
            aria-expanded={menuOpen}
            aria-label="Меню"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}

        {children}
      </div>
    </header>
  );
}
