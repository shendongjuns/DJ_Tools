import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, userApi } from '../api/services';
import type { AuthResponse, UserProfile } from '../types';
import { storage } from '../utils/storage';

interface AuthContextValue {
  profile: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  setSession: (response: AuthResponse) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(storage.getProfile());
  const [token, setToken] = useState<string | null>(storage.getToken());
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(storage.getRefreshToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await userApi.me();
        setProfile(me);
        storage.setProfile(me);
      } catch {
        storage.clearToken();
        storage.clearRefreshToken();
        storage.clearProfile();
        setToken(null);
        setRefreshTokenValue(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    void bootstrap();
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      token,
      refreshToken: refreshTokenValue,
      loading,
      setSession: (response) => {
        setToken(response.accessToken);
        setRefreshTokenValue(response.refreshToken);
        setProfile(response.profile);
        storage.setToken(response.accessToken);
        storage.setRefreshToken(response.refreshToken);
        storage.setProfile(response.profile);
      },
      logout: async () => {
        const currentRefreshToken = storage.getRefreshToken();
        if (currentRefreshToken) {
          try {
            await authApi.logout({ refreshToken: currentRefreshToken });
          } catch {
            // 退出登录时即使服务端失败，也要清理本地状态。
          }
        }
        storage.clearToken();
        storage.clearRefreshToken();
        storage.clearProfile();
        setToken(null);
        setRefreshTokenValue(null);
        setProfile(null);
      },
      refreshProfile: async () => {
        const me = await userApi.me();
        setProfile(me);
        storage.setProfile(me);
      },
    }),
    [loading, profile, refreshTokenValue, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 中使用');
  }
  return context;
}

