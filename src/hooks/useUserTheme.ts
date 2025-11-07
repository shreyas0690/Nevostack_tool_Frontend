import { useTheme as useNextTheme } from 'next-themes';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useUserTheme() {
  const { theme: globalTheme, setTheme: setGlobalTheme, systemTheme } = useNextTheme();
  const { currentUser } = useAuth();
  const [userTheme, setUserTheme] = useState<Theme>('system');

  // Get user-specific theme from localStorage
  const getUserThemeKey = (userId: string) => `theme_${userId}`;
  
  // Load user's theme preference when user changes
  useEffect(() => {
    if (currentUser?.id) {
      const userThemeKey = getUserThemeKey(currentUser.id);
      const savedTheme = localStorage.getItem(userThemeKey) as Theme;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setUserTheme(savedTheme);
        setGlobalTheme(savedTheme);
      } else {
        // If no saved theme, use system default
        setUserTheme('system');
        setGlobalTheme('system');
      }
    }
  }, [currentUser?.id, setGlobalTheme]);

  // Save theme preference when it changes
  const setTheme = (newTheme: Theme) => {
    if (currentUser?.id) {
      const userThemeKey = getUserThemeKey(currentUser.id);
      localStorage.setItem(userThemeKey, newTheme);
      setUserTheme(newTheme);
      setGlobalTheme(newTheme);
    }
  };

  // Get the actual resolved theme (light/dark)
  const getResolvedTheme = (): 'light' | 'dark' => {
    if (userTheme === 'system') {
      return systemTheme === 'dark' ? 'dark' : 'light';
    }
    return userTheme;
  };

  return {
    theme: userTheme,
    setTheme,
    resolvedTheme: getResolvedTheme(),
    systemTheme
  };
}




