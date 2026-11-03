import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('workspace-theme', next); } catch { /* The theme still works for this session. */ }
    setTheme(next);
  };
  const label = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
  return <button type="button" className="btn btn-secondary btn-icon theme-toggle" onClick={toggleTheme} title={label} aria-label={label}>{theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}</button>;
}
