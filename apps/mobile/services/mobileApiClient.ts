import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queueMobileMutation } from './offlineSync';

const API_BASE_URL = 'http://10.0.2.2:3000'; // Standard Android emulator localhost

export const mobileApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

mobileApiClient.interceptors.request.use(async (config: any) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

mobileApiClient.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    // If Network Error (Mobile Offline)
    if (!error.response && error.config) {
      const { config } = error;
      console.warn('[MobileOffline] Device is offline. Queueing mutation for background sync...');

      const payload = config.data ? JSON.parse(config.data) : {};
      const method = config.method.toUpperCase();

      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        await queueMobileMutation(config.url, method, payload);

        return Promise.resolve({
          data: {
            offline: true,
            message: 'Queued locally in SQLite/AsyncStorage. Syncing when online.',
          },
          status: 202,
          statusText: 'Accepted Offline',
          headers: {},
          config,
        });
      }
    }

    return Promise.reject(error);
  }
);
