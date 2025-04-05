// src/components/theme-provider.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// Define the possible theme values
type Theme = "dark" | "light" | "system";

// Define the shape of the context data
type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

// Create the context with an initial undefined value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Define the props for the provider component
type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  // Allow any other props to be passed down (like className, etc.)
  [key: string]: any;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props // Capture any other props passed to ThemeProvider
}: ThemeProviderProps) {
  // Initialize state, trying to read from localStorage first
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const storedTheme = window.localStorage.getItem(storageKey);
      // Check if stored theme is one of the valid theme values
      if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) {
        return storedTheme as Theme;
      }
    } catch (e) {
      // Ignore localStorage errors (e.g., private browsing)
      console.error("Error reading localStorage theme:", e);
    }
    // Fallback to default theme if nothing valid is found
    return defaultTheme;
  });

  // Effect to apply the theme class to the HTML element and save preference
  useEffect(() => {
    const root = window.document.documentElement; // Get the <html> element

    root.classList.remove("light", "dark"); // Clear previous theme classes

    // Determine the actual theme to apply (resolve 'system')
    let systemTheme: Theme = 'light'; // Default to light if detection fails
    try {
        // Check the user's OS preference
        systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch(e) {
        console.error("Cannot determine system theme preference", e);
    }

    const currentTheme = theme === "system" ? systemTheme : theme;

    // Add the current theme class ('dark' or 'light')
    root.classList.add(currentTheme);

    // Try to save the selected theme ('light', 'dark', or 'system') to localStorage
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch (e) {
      console.error("Error saving theme to localStorage:", e);
    }
    // This effect runs whenever the 'theme' state changes
  }, [theme, storageKey]);

  // Effect to listen for OS theme changes IF the current setting is 'system'
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Handler to update the applied class if the OS theme changes
    const handleChange = () => {
      // Only update if the user's preference is set to 'system'
      if (theme === "system") {
        const newSystemTheme = mediaQuery.matches ? "dark" : "light";
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(newSystemTheme);
      }
    };

    // Add the listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup function to remove the listener when the component unmounts or theme changes
    return () => mediaQuery.removeEventListener('change', handleChange);
  // This effect should re-run if the user explicitly changes the theme setting (light/dark/system)
  }, [theme]);

  // The value provided by the context
  const value = {
    theme,
    // Provide the function to update the theme state
    setTheme: (newTheme: Theme) => {
      // Basic validation if needed
      if (["light", "dark", "system"].includes(newTheme)) {
         setThemeState(newTheme);
      } else {
          console.warn(`Invalid theme value provided: ${newTheme}`);
      }
    },
  };

  return (
    // Provide the context value to children, pass down any other props received
    <ThemeContext.Provider value={value} {...props}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to easily consume the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  // Ensure the hook is used within a provider
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};