import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { isTokenExpired } from '@/utils/auth';

const rawBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:10000';
export const BACKEND_URL = rawBackendUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

let unauthorizedHandler = null;

/**
 * Registers a callback invoked when an expired JWT or 401 response clears the session.
 */
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = typeof fn === 'function' ? fn : null;
}

async function clearStoredSession() {
  try {
    if (typeof AsyncStorage?.multiRemove === 'function') {
      await AsyncStorage.multiRemove(['token', 'role']);
    } else {
      await Promise.all([
        AsyncStorage?.removeItem?.('token'),
        AsyncStorage?.removeItem?.('role'),
      ]);
    }
  } catch {
    // Ignore storage cleanup errors
  }
}

function looksLikeJwt(token) {
  return typeof token === 'string' && token.split('.').length === 3;
}

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors?.request?.use?.(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        if (looksLikeJwt(token) && isTokenExpired(token)) {
          await clearStoredSession();
          unauthorizedHandler?.();
          return config;
        }
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Proceed without Authorization header if storage read fails
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors?.response?.use?.(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');
    if (status === 401 && !requestUrl.includes('/api/auth/login')) {
      await clearStoredSession();
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export default api;
