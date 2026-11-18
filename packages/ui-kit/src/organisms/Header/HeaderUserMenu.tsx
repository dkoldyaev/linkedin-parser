import React from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { Button, Icon, Text } from '../../atoms';
import styles from './Header.module.css';

export interface HeaderUser {
  readonly name?: string;
  readonly email?: string;
  readonly picture?: string;
  readonly isAnonymous?: boolean;
}

export interface HeaderUserProps {
  readonly user: HeaderUser;
  readonly loginLabel?: string;
  readonly logoutLabel?: string;
  readonly onLogin?: () => void;
  readonly onLogout?: () => void;
  readonly className?: string;
}

export function HeaderUserMenu({
  user,
  loginLabel = 'Sign in',
  logoutLabel = 'Sign out',
  onLogin,
  onLogout,
  className,
}: HeaderUserProps): React.ReactElement {
  if (user.isAnonymous) {
    return (
      <Button
        variant="secondary"
        size="m"
        onClick={onLogin}
        title={loginLabel}
        className={className}
        startIcon={<Icon icon={LogIn} size="sm" />}
      >
        <span className={styles.guestLoginText}>{loginLabel}</span>
      </Button>
    );
  }

  const userInitial = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.email
      ? user.email.charAt(0).toUpperCase()
      : 'U';

  return (
    <div className={className ?? styles.userProfileBadge}>
      {user.picture ? (
        <img
          src={user.picture}
          alt={user.name ?? 'User avatar'}
          className={styles.userAvatar}
        />
      ) : (
        <div className={styles.userAvatarPlaceholder}>{userInitial}</div>
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
  );
}

