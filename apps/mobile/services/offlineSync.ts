import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

const SYNC_QUEUE_KEY = '@sms_offline_sync_queue';
const API_BASE_URL = 'http://10.0.2.2:3000'; // Standard Android Emulator localhost IP

export interface OfflineMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload: any;
  createdAt: number;
}

/**
 * Queue a mutation when offline in React Native
 */
export async function queueMobileMutation(endpoint: string, method: OfflineMutation['method'], payload: any) {
  const newMutation: OfflineMutation = {
    id: Date.now().toString(),
    endpoint,
    method,
    payload,
    createdAt: Date.now(),
  };

  const existingQueueRaw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  const queue: OfflineMutation[] = existingQueueRaw ? JSON.parse(existingQueueRaw) : [];
  queue.push(newMutation);

  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  console.log('[MobileSync] Mutation queued for offline sync:', newMutation);
  return newMutation;
}

/**
 * Sync all queued mutations when internet connection is restored
 */
export async function syncMobileQueue(authToken: string) {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    console.log('[MobileSync] Still offline, skipping sync run.');
    return;
  }

  const existingQueueRaw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
  if (!existingQueueRaw) return;

  const queue: OfflineMutation[] = JSON.parse(existingQueueRaw);
  if (queue.length === 0) return;

  console.log(`[MobileSync] Syncing ${queue.length} pending mutation(s)...`);
  const remainingQueue: OfflineMutation[] = [];

  for (const item of queue) {
    try {
      await axios({
        url: `${API_BASE_URL}${item.endpoint}`,
        method: item.method,
        data: item.payload,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log(`[MobileSync] Successfully synced mutation ID: ${item.id}`);
    } catch (err: any) {
      console.error(`[MobileSync] Failed to sync mutation ID: ${item.id}`, err.message);
      remainingQueue.push(item); // Keep in queue to retry next time
    }
  }

  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
}
