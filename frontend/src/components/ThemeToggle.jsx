import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button, Icon } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

export default function ThemeToggle() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('workspace-theme', next);
    } catch {
      /* The theme still works for this session. */
    }
    setTheme(next);
  };
  const label = theme === 'dark' ? t('common.switch_to_light') : t('common.switch_to_dark');
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-md"
      className="theme-toggle"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
    >
      <Icon icon={theme === 'dark' ? Sun : Moon} size="sm" aria-hidden="true" />
    </Button>
  );
}
