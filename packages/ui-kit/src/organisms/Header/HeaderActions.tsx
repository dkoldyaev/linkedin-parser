import { Button, Icon } from '../../atoms';
import { Moon, RefreshCw, Settings, Sun } from 'lucide-react';
import React from 'react';
import styles from './Header.module.css';

export interface HeaderActionsProps {
  readonly onRefresh?: () => void;
  readonly refreshLabel?: string;
  readonly showThemeToggle?: boolean;
  readonly theme?: 'dark' | 'light';
  readonly onThemeToggle?: () => void;
  readonly onSettingsClick?: () => void;
  readonly settingsLabel?: string;
  readonly children?: React.ReactNode;
}

export function HeaderActions({
  onRefresh,
  refreshLabel = 'Refresh',
  showThemeToggle = false,
  theme = 'dark',
  onThemeToggle,
  onSettingsClick,
  settingsLabel = 'Settings',
  children,
}: HeaderActionsProps): React.ReactElement {
  return (
    <>
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

      {children}
    </>
  );
}
