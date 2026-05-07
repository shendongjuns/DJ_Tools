const TOKEN_KEY = 'dj-tools-token';
const REFRESH_TOKEN_KEY = 'dj-tools-refresh-token';
const PROFILE_KEY = 'dj-tools-profile';
const THEME_KEY = 'dj-tools-theme';
const CURSOR_THEME_KEY = 'dj-tools-cursor-theme';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (value: string) => localStorage.setItem(TOKEN_KEY, value),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (value: string) => localStorage.setItem(REFRESH_TOKEN_KEY, value),
  clearRefreshToken: () => localStorage.removeItem(REFRESH_TOKEN_KEY),
  getProfile: () => {
    const value = localStorage.getItem(PROFILE_KEY);
    return value ? JSON.parse(value) : null;
  },
  setProfile: (value: unknown) => localStorage.setItem(PROFILE_KEY, JSON.stringify(value)),
  clearProfile: () => localStorage.removeItem(PROFILE_KEY),
  getTheme: () => localStorage.getItem(THEME_KEY),
  setTheme: (value: string) => localStorage.setItem(THEME_KEY, value),
  getCursorTheme: () => localStorage.getItem(CURSOR_THEME_KEY),
  setCursorTheme: (value: string) => localStorage.setItem(CURSOR_THEME_KEY, value),
};

