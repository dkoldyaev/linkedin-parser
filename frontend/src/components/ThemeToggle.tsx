import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button, Icon } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

function readInitialTheme(): 'dark' | 'light' {
  if (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light') {
    return 'light';
  }
  return 'dark';
}

function persistWorkspaceTheme(next: 'dark' | 'light'): void {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem('workspace-theme', next);
  } catch {
    /* The theme still works for this session. */
  }
}

export default function ThemeToggle(): React.ReactElement {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'dark' | 'light'>(readInitialTheme);

  const toggleTheme = () => {
    const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
    persistWorkspaceTheme(next);
    setTheme(next);
  };

  const label = theme === 'dark' ? t('common.switch_to_light') : t('common.switch_to_dark');
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="theme-toggle"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
    >
      <Icon icon={theme === 'dark' ? Sun : Moon} size="sm" aria-hidden />
    </Button>
  );
}
