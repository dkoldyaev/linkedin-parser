'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const current = document.documentElement.dataset.theme || 'dark';
      setTheme(current);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = next;
    }
    try {
      localStorage.setItem('workspace-theme', next);
    } catch {
      /* The theme still works for this session. */
    }
    setTheme(next);
  };

  const label = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
  return (
    <button
      type="button"
      className="btn btn-secondary btn-icon theme-toggle"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
    >
      {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
