import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button, Icon } from '@blueprint/ui-kit';

export default function ThemeToggle() {
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
  const label = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
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
