'use client';

import * as React from 'react';
import { useServerInsertedHTML } from 'next/navigation';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  themes: string[];
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'theme',
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = false,
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey) as Theme;
      const active = saved || defaultTheme;
      if (active === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return active as 'light' | 'dark';
    }
    return 'dark';
  });

  // Handle system preference changes
  React.useEffect(() => {
    if (theme !== 'system') {
      setResolvedTheme(theme as 'light' | 'dark');
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    setResolvedTheme(media.matches ? 'dark' : 'light');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  // Apply theme to DOM
  React.useEffect(() => {
    const root = document.documentElement;
    const activeTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    let cleanupTransition: (() => void) | undefined;
    if (disableTransitionOnChange) {
      const css = document.createElement('style');
      css.appendChild(document.createTextNode('*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'));
      document.head.appendChild(css);
      cleanupTransition = () => {
        window.getComputedStyle(document.body);
        setTimeout(() => {
          document.head.removeChild(css);
        }, 1);
      };
    }

    if (attribute === 'class') {
      root.classList.remove('light', 'dark');
      root.classList.add(activeTheme);
    } else {
      root.setAttribute(attribute, activeTheme);
    }

    root.style.colorScheme = activeTheme;

    if (cleanupTransition) {
      cleanupTransition();
    }
  }, [theme, attribute, disableTransitionOnChange]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (e) {}
  }, [storageKey]);

  // Inject script during SSR to prevent flash of unstyled content
  useServerInsertedHTML(() => {
    const script = `(function() {
      try {
        var key = '${storageKey}';
        var def = '${defaultTheme}';
        var theme = localStorage.getItem(key) || def;
        var active = theme;
        if (theme === 'system') {
          active = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        var root = document.documentElement;
        var attr = '${attribute}';
        if (attr === 'class') {
          root.classList.remove('light', 'dark');
          root.classList.add(active);
        } else {
          root.setAttribute(attr, active);
        }
        root.style.colorScheme = active;
      } catch (e) {}
    })()`;

    return (
      <script
        id="theme-initializer"
        dangerouslySetInnerHTML={{ __html: script }}
      />
    );
  });

  const value = React.useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
    themes: ['light', 'dark', 'system'],
  }), [theme, resolvedTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

