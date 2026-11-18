import React from 'react';
import { Menu, Plus, X } from 'lucide-react';
import { Button, Icon, Spinner } from '../../atoms';
import { cn } from '../../utils';
import { HeaderBrand, type HeaderBrandProps } from './HeaderBrand';
import { HeaderUserMenu, type HeaderUser, type HeaderUserProps } from './HeaderUserMenu';
import { HeaderActions, type HeaderActionsProps } from './HeaderActions';
import styles from './Header.module.css';

export type { HeaderUser, HeaderBrandProps, HeaderUserProps, HeaderActionsProps };

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
function HeaderBase({
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

  return (
    <header
      className={cn(styles.header, isSearchFocused && styles.searchFocused, className)}
      {...rest}
    >
      {brand !== undefined ? (
        brand
      ) : (
        <HeaderBrand
          title={title}
          subtitle={subtitle}
          brandIcon={brandIcon}
        />
      )}

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

        <HeaderActions
          onRefresh={onRefresh}
          refreshLabel={refreshLabel}
          showThemeToggle={showThemeToggle}
          theme={theme}
          onThemeToggle={onThemeToggle}
          onSettingsClick={onSettingsClick}
          settingsLabel={settingsLabel}
        />

        {userSlot !== undefined ? (
          userSlot
        ) : user !== undefined ? (
          <HeaderUserMenu
            user={user}
            loginLabel={loginLabel}
            logoutLabel={logoutLabel}
            onLogin={onLogin}
            onLogout={onLogout}
          />
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

export const Header = Object.assign(HeaderBase, {
  Brand: HeaderBrand,
  UserMenu: HeaderUserMenu,
  Actions: HeaderActions,
});

export { HeaderBrand, HeaderUserMenu, HeaderActions };
