import React from 'react';
import {
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
  readonly navigation?: React.ReactNode;
  readonly search?: React.ReactNode;
  readonly statusSlot?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly userSlot?: React.ReactNode;
  readonly queueCount?: number;
  readonly queueLabel?: string;
  readonly onQueueClick?: () => void;
  readonly onPrimaryAction?: () => void;
  readonly primaryActionLabel?: string;
  readonly onRefresh?: () => void;
  readonly refreshLabel?: string;
  readonly showThemeToggle?: boolean;
  readonly theme?: 'dark' | 'light';
  readonly onThemeToggle?: () => void;
  readonly onSettingsClick?: () => void;
  readonly settingsLabel?: string;
  readonly user?: HeaderUser;
  readonly loginLabel?: string;
  readonly logoutLabel?: string;
  readonly onLogin?: () => void;
  readonly onLogout?: () => void;
  readonly menuOpen?: boolean;
  readonly onMenuToggle?: () => void;
  readonly searchFocused?: boolean;
}

/**
 * Universal Header organism on the 32px Blueprint grid.
 * Displays brand mark, title & subtitle, optional navigation, centered search slot,
 * status/queue indicator, action controls, theme switcher, and user profile slot.
 */
export function Header({
  title = 'BLUEPRINT.UI',
  subtitle = 'DESIGN SYSTEM',
  brandIcon,
  brand,
  navigation,
  search,
  statusSlot,
  actions,
  userSlot,
  queueCount,
  queueLabel,
  onQueueClick,
  onPrimaryAction,
  primaryActionLabel = 'CREATE NEW',
  onRefresh,
  refreshLabel = 'Refresh',
  showThemeToggle = false,
  theme = 'dark',
  onThemeToggle,
  onSettingsClick,
  settingsLabel = 'Settings',
  user,
  loginLabel = 'Sign in',
  logoutLabel = 'Sign out',
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
        ? `${queueCount} IN QUEUE`
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
        <Text as="h1" variant="mono-label" className={styles.brandTitle}>
          {title}
        </Text>
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

      {navigation !== undefined && (
        <nav className={styles.navigation} aria-label="Primary navigation">
          {navigation}
        </nav>
      )}

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
        {statusSlot}
        {actions}

        {queueCount !== undefined && queueCount > 0 && (
          <Button
            variant="secondary"
            size="m"
            onClick={onQueueClick}
            className={styles.queuePill}
            title={resolvedQueueLabel}
            startIcon={<Spinner size="sm" />}
          >
            <span className={styles.queuePillText}>{resolvedQueueLabel}</span>
          </Button>
        )}

        {onPrimaryAction !== undefined && (
          <Button
            variant="primary"
            size="m"
            onClick={onPrimaryAction}
            className={styles.addBtn}
            startIcon={<Icon icon={Plus} size="sm" />}
          >
            <span className={styles.addBtnText}>{primaryActionLabel}</span>
          </Button>
        )}

        {onRefresh !== undefined && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            title={refreshLabel}
            aria-label={refreshLabel}
          >
            <Icon icon={RefreshCw} size="sm" />
          </Button>
        )}

        {showThemeToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <Icon icon={theme === 'dark' ? Sun : Moon} size="sm" />
          </Button>
        )}

        {onSettingsClick !== undefined && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className={styles.settingsBtn}
            title={settingsLabel}
            aria-label={settingsLabel}
          >
            <Icon icon={Settings} size="sm" />
          </Button>
        )}

        {userSlot !== undefined ? (
          userSlot
        ) : user !== undefined ? (
          user.isAnonymous ? (
            <Button
              variant="secondary"
              size="m"
              onClick={onLogin}
              title={loginLabel}
              startIcon={<Icon icon={LogIn} size="sm" />}
            >
              <span className={styles.guestLoginText}>{loginLabel}</span>
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
              <Text as="span" variant="mono" className={styles.userName} title={user.email ?? user.name}>
                {user.name ?? user.email}
              </Text>
              {onLogout !== undefined && (
                <Button
                  variant="ghost"
                  size="icon"
                  tone="danger"
                  onClick={onLogout}
                  title={logoutLabel}
                  aria-label={logoutLabel}
                >
                  <Icon icon={LogOut} size="xs" />
                </Button>
              )}
            </div>
          )
        ) : null}

        {onMenuToggle !== undefined && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className={cn(styles.burger, menuOpen && styles.burgerOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            <Icon icon={menuOpen ? X : Menu} size="md" />
          </Button>
        )}

        {children}
      </div>
    </header>
  );
}
