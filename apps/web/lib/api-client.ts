import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token if present
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response Interceptor: Offline Fallback & Sync Queueing
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If network error (offline) and running inside Electron Desktop App
    if (!error.response && typeof window !== 'undefined' && (window as any).electron) {
      const { config } = error;
      console.warn('[OfflineClient] Intercepted failed request. Queueing for offline sync...');

      try {
        // Send request details to Electron IPC main process
        const result = await (window as any).electron.ipcRenderer.invoke('queue-offline-action', {
          endpoint: config.url,
          method: config.method.toUpperCase(),
          payload: config.data ? JSON.parse(config.data) : {},
        });

        return Promise.resolve({
          data: {
            offline: true,
            message: 'Action queued offline. Will sync when reconnected.',
            queueId: result.id,
          },
          status: 202,
          statusText: 'Accepted Offline',
          headers: {},
          config,
        });
      } catch (ipcErr) {
        return Promise.reject(ipcErr);
      }
    }

    return Promise.reject(error);
  }
);
