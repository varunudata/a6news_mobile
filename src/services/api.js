import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const rawBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:10000';
export const BACKEND_URL = rawBackendUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
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

export default api;
