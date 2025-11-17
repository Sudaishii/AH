import { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import { ThemeProviderContext } from "./theme-context";

export function ThemeProvider({ children, defaultTheme = "light", storageKey = "theme", ...props }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Check localStorage first, then default
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      return stored || defaultTheme;
    }
    return defaultTheme;
  });

  const getEffectiveTheme = (themeValue) => {
    if (typeof window === "undefined") return "light";
    if (themeValue === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return themeValue;
  };

  const effectiveTheme = useMemo(() => getEffectiveTheme(currentTheme), [currentTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Apply the effective theme immediately
    const themeToApply = getEffectiveTheme(currentTheme);
    root.classList.add(themeToApply);

    // Listen for system theme changes when theme is set to "system"
    if (currentTheme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        root.classList.remove("light", "dark");
        const newEffectiveTheme = getEffectiveTheme("system");
        root.classList.add(newEffectiveTheme);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [currentTheme, effectiveTheme]);

  const value = useMemo(() => ({
    theme: currentTheme,
    setTheme: (theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, theme);
      }
      setCurrentTheme(theme);
    },
    effectiveTheme: effectiveTheme,
  }), [currentTheme, effectiveTheme, storageKey]);

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
  defaultTheme: PropTypes.string,
  storageKey: PropTypes.string,
};
