import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getThemePreset, resolveAntdTheme, themePresets } from '../theme';
import { storage } from '../utils/storage';

interface ThemeContextValue {
  themeId: string;
  setThemeId: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState(storage.getTheme() ?? 'cartoon');

  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
    storage.setTheme(themeId);
  }, [themeId]);

  const value = useMemo(
    () => ({
      themeId,
      setThemeId: setThemeIdState,
    }),
    [themeId],
  );

  const preset = getThemePreset(themeId);

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          ...resolveAntdTheme(themeId),
          cssVar: true,
          hashed: false,
          algorithm: preset.appearance === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext 必须在 ThemeProvider 中使用');
  }
  return context;
}

export { themePresets };

