import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  availableThemes: Theme[];
  applyTheme: (themeConfig: Record<string, string>) => void;
}

interface Theme {
  id: string;
  name: string;
  cssVariables: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultThemes: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    cssVariables: {
      '--primary-color': '#2563eb',
      '--background-color': '#ffffff',
      '--surface-color': '#f8fafc',
      '--text-primary': '#0f172a',
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    cssVariables: {
      '--primary-color': '#3b82f6',
      '--background-color': '#111827',
      '--surface-color': '#1f2937',
      '--text-primary': '#f9fafb',
    }
  },
  {
    id: 'blue',
    name: 'Blue Ocean',
    cssVariables: {
      '--primary-color': '#0ea5e9',
      '--background-color': '#f0f9ff',
      '--surface-color': '#e0f2fe',
      '--text-primary': '#0c4a6e',
    }
  },
  {
    id: 'green',
    name: 'Forest Green',
    cssVariables: {
      '--primary-color': '#059669',
      '--background-color': '#f0fdf4',
      '--surface-color': '#dcfce7',
      '--text-primary': '#14532d',
    }
  }
];

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<string>('light');
  const [availableThemes] = useState<Theme[]>(defaultThemes);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('webmail-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    // Find and apply theme variables
    const currentTheme = availableThemes.find(t => t.id === theme);
    if (currentTheme) {
      applyTheme(currentTheme.cssVariables);
    }
    
    // Save to localStorage
    localStorage.setItem('webmail-theme', theme);
  }, [theme, availableThemes]);

  const applyTheme = (themeConfig: Record<string, string>) => {
    const root = document.documentElement;
    Object.entries(themeConfig).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    availableThemes,
    applyTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};