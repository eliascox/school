import axios from 'axios';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000';

const SYNC_QUEUE_KEY = '@sms_offline_sync_queue';
const memoryFallback = new Map<string, string>();

export const mobileStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const webStorage = (globalThis as any)?.localStorage;
      if (webStorage && typeof webStorage.getItem === 'function') {
        return webStorage.getItem(key);
      }
    } catch {
      // Fallback to in-memory store
    }
    return memoryFallback.get(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    memoryFallback.set(key, value);
    try {
      const webStorage = (globalThis as any)?.localStorage;
      if (webStorage && typeof webStorage.setItem === 'function') {
        webStorage.setItem(key, value);
      }
    } catch {
      // Ignore storage quota / native unavailable errors
    }
  },
  async removeItem(key: string): Promise<void> {
    memoryFallback.delete(key);
    try {
      const webStorage = (globalThis as any)?.localStorage;
      if (webStorage && typeof webStorage.removeItem === 'function') {
        webStorage.removeItem(key);
      }
    } catch {
      // Ignore storage removal errors
    }
  },
};

export interface OfflineMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload: any;
  createdAt: number;
}

export async function checkOnlineStatus(): Promise<boolean> {
  if (typeof fetch !== 'function') return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    return res.ok || res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function getOfflineQueue(): Promise<OfflineMutation[]> {
  const existingQueueRaw = await mobileStorage.getItem(SYNC_QUEUE_KEY);
  if (!existingQueueRaw) return [];
  try {
    const parsed = JSON.parse(existingQueueRaw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Queue a mutation when offline in React Native / Expo
 */
export async function queueMobileMutation(
  endpoint: string,
  method: OfflineMutation['method'],
  payload: any,
) {
  const newMutation: OfflineMutation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    endpoint,
    method,
    payload,
    createdAt: Date.now(),
  };

  const queue = await getOfflineQueue();
  queue.push(newMutation);

  await mobileStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  return newMutation;
}

/**
 * Sync all queued mutations when central API connection is reachable
 */
export async function syncMobileQueue(authToken?: string | null): Promise<{
  online: boolean;
  synced: number;
  remaining: number;
}> {
  const online = await checkOnlineStatus();
  const queue = await getOfflineQueue();
  if (!online) {
    return { online: false, synced: 0, remaining: queue.length };
  }
  if (queue.length === 0) {
    return { online: true, synced: 0, remaining: 0 };
  }

  let synced = 0;
  const remainingQueue: OfflineMutation[] = [];

  for (const item of queue) {
    try {
      await axios({
        url: `${API_BASE_URL}${item.endpoint}`,
        method: item.method,
        data: item.payload,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      });
      synced += 1;
    } catch {
      remainingQueue.push(item);
    }
  }

  await mobileStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
  return { online: true, synced, remaining: remainingQueue.length };
}
