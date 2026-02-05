'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('theme') as Theme) || 'system';
    setTheme(saved);
    updateTheme(saved);
  }, []);

  const updateTheme = (newTheme: Theme) => {
    const isDarkMode =
      newTheme === 'dark' ||
      (newTheme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setIsDark(isDarkMode);
  };

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    updateTheme(newTheme);
  };

  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, isDark }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
