import React from 'react';
import {
  Download,
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
import { Button, Icon, Spinner, Text } from '../../atoms';
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
  readonly searchFocused?: boolean;
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
  searchFocused = false,
  className,
  children,
  ...rest
}: HeaderProps): React.ReactElement {
  const [internalSearchFocused, setInternalSearchFocused] = React.useState(false);
  const isSearchFocused = searchFocused || internalSearchFocused;

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
        <Text as="h1" variant="mono-label" className={styles.brandTitle}>{title}</Text>
        {subtitle !== undefined && (
          <Text as="p" variant="caption" tone="muted" className={styles.brandSubtitle}>
            {subtitle}
          </Text>
        )}
      </div>
    </div>
  );

  return (
    <header
      className={cn(styles.header, isSearchFocused && styles.searchFocused, className)}
      {...rest}
    >
      {brand !== undefined ? brand : defaultBrand}

      {search !== undefined && (
        <div
          className={styles.headerCenter}
          onFocus={() => setInternalSearchFocused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setInternalSearchFocused(false);
            }
          }}
        >
          {search}
        </div>
      )}

      <div className={styles.headerActions}>
        {actions}

        {queueCount !== undefined && queueCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onQueueClick}
            className={styles.queuePill}
            title={resolvedQueueLabel}
            startIcon={<Spinner size="sm" />}
          >
            <span className={styles.queuePillText}>{resolvedQueueLabel}</span>
          </Button>
        )}

        {onAddVacancies !== undefined && (
          <Button
            variant="primary"
            size="sm"
            onClick={onAddVacancies}
            className={styles.addBtn}
            startIcon={<Icon icon={Plus} size="sm" />}
          >
            <span className={styles.addBtnText}>{addVacanciesLabel}</span>
          </Button>
        )}

        {onRefresh !== undefined && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className={styles.btnIcon}
            title="Обновить вакансии"
            aria-label="Обновить вакансии"
          >
            <Icon icon={RefreshCw} size="sm" />
          </Button>
        )}

        {showThemeToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            className={styles.btnIcon}
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            <Icon icon={theme === 'dark' ? Sun : Moon} size="sm" />
          </Button>
        )}

        {onDownloadExtension !== undefined && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDownloadExtension}
            className={cn(styles.btnIcon, styles.downloadBtn)}
            title="Скачать расширение (ZIP)"
            aria-label="Скачать расширение (ZIP)"
          >
            <Icon icon={Download} size="sm" />
          </Button>
        )}

        {onSettingsClick !== undefined && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className={cn(styles.btnIcon, styles.settingsBtn)}
            title="Настройки"
            aria-label="Настройки"
          >
            <Icon icon={Settings} size="sm" />
          </Button>
        )}

        {user !== undefined && (
          user.isAnonymous ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={onLogin}
              className={styles.guestLoginBtn}
              title="Войти в аккаунт"
              startIcon={<Icon icon={LogIn} size="sm" />}
            >
              <span className={styles.guestLoginText}>Войти</span>
            </Button>
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
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onLogout}
                  className={styles.btnLogout}
                  title="Выйти"
                  aria-label="Выйти"
                >
                  <Icon icon={LogOut} size="xs" />
                </Button>
              )}
            </div>
          )
        )}

        {onMenuToggle !== undefined && (
          <Button
            variant="ghost"
            size="icon"
            id="menu-toggle"
            onClick={onMenuToggle}
            className={cn(styles.btnIcon, styles.burger, menuOpen && styles.burgerOpen)}
            aria-expanded={menuOpen}
            aria-label="Меню"
          >
            <Icon icon={menuOpen ? X : Menu} size="md" />
          </Button>
        )}

        {children}
      </div>
    </header>
  );
}
