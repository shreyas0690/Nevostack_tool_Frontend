import { useTheme as useNextTheme } from 'next-themes';
import { saasAuthService } from '@/services/saasAuthService';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useSaaSUserTheme() {
  const { theme: globalTheme, setTheme: setGlobalTheme, systemTheme } = useNextTheme();
  const [userTheme, setUserTheme] = useState<Theme>('system');

  // Get SaaS user-specific theme from localStorage
  const getSaaSUserThemeKey = (userId: string) => `saas_theme_${userId}`;

  // Load SaaS user's theme preference when user changes
  useEffect(() => {
    const currentSaaSUser = saasAuthService.getSaaSUser();
    if (currentSaaSUser?.id) {
      const userThemeKey = getSaaSUserThemeKey(currentSaaSUser.id);
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
  }, [setGlobalTheme]);

  // Save theme preference when it changes
  const setTheme = (newTheme: Theme) => {
    const currentSaaSUser = saasAuthService.getSaaSUser();
    if (currentSaaSUser?.id) {
      const userThemeKey = getSaaSUserThemeKey(currentSaaSUser.id);
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









