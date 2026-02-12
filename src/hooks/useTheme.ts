import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "theme";
export type Theme = "light" | "dark";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return "dark";
}

function setStoredTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Manages theme state with localStorage persistence.
 * Sets data-theme attribute on html element.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setStoredTheme(next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return { theme, setTheme, toggleTheme };
}
