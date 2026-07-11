import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark';
export type UIdensity = 'comfortable' | 'compact' | 'technical';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme_mode');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [density, setDensity] = useState<UIdensity>(() => {
    const saved = localStorage.getItem('ui_density');
    if (saved === 'comfortable' || saved === 'compact' || saved === 'technical') return saved;
    return 'comfortable';
  });

  // Apply dark mode class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme_mode', theme);
  }, [theme]);

  // Apply density variable to root element
  useEffect(() => {
    const root = document.documentElement;
    let scale = '1';
    if (density === 'compact') {
      scale = '0.85';
    } else if (density === 'technical') {
      scale = '0.75';
    }
    root.style.setProperty('--density-scale', scale);
    localStorage.setItem('ui_density', density);
  }, [density]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    density,
    setDensity,
  };
};
