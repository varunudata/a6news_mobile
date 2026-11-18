import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { isTokenExpired } from '@/utils/auth';

const TOKEN_STORAGE_KEY = 'token';
const ROLE_STORAGE_KEY = 'role';

export const AuthContext = createContext({
  token: null,
  role: null,
  loadingAuth: true,
  login: async () => {},
  logout: async () => {},
  checkSession: async () => null,
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const checkSession = useCallback(async () => {
    setLoadingAuth(true);
    try {
      const [savedToken, savedRole] = await Promise.all([
        AsyncStorage.getItem(TOKEN_STORAGE_KEY),
        AsyncStorage.getItem(ROLE_STORAGE_KEY),
      ]);

      if (!savedToken || isTokenExpired(savedToken) || !savedRole) {
        await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, ROLE_STORAGE_KEY]);
        setToken(null);
        setRole(null);
        return null;
      }

      setToken(savedToken);
      setRole(savedRole);
      return { token: savedToken, role: savedRole };
    } catch {
      setToken(null);
      setRole(null);
      return null;
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const login = useCallback(async (newToken, newRole) => {
    if (!newToken || isTokenExpired(newToken) || newRole !== 'admin') {
      await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, ROLE_STORAGE_KEY]);
      setToken(null);
      setRole(null);
      return false;
    }

    await AsyncStorage.multiSet([
      [TOKEN_STORAGE_KEY, newToken],
      [ROLE_STORAGE_KEY, newRole],
    ]);
    setToken(newToken);
    setRole(newRole);
    return true;
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, ROLE_STORAGE_KEY]);
    } finally {
      setToken(null);
      setRole(null);
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        loadingAuth,
        login,
        logout,
        checkSession,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
