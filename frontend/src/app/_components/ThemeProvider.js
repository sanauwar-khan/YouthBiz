"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { toggleStoredTheme } from "../_lib/themePreference";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const toggleTheme = useCallback(() => {
    try {
      toggleStoredTheme(document.documentElement, () => window.localStorage);
    } catch {
      toggleStoredTheme(document.documentElement, () => null);
    }
  }, []);

  const value = useMemo(() => ({ toggleTheme }), [toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider.");
  return context;
}
