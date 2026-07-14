import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme, className }) => {
  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-lg transition-colors ${
        theme === 'dark' 
          ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600' 
          : 'bg-slate-200 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
      } ${className}`}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
