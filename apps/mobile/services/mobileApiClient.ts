import axios from 'axios';
import {
  checkOnlineStatus,
  mobileStorage,
  queueMobileMutation,
} from './offlineSync';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000';

const TOKEN_STORAGE_KEY = 'sms_mobile_token';

export const mobileApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

mobileApiClient.interceptors.request.use(async (config: any) => {
  const token = await mobileStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

mobileApiClient.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    if (!error.response && error.config) {
      const { config } = error;
      const payload =
        typeof config.data === 'string'
          ? JSON.parse(config.data)
          : config.data || {};
      const method = (config.method || 'GET').toUpperCase();

      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        await queueMobileMutation(config.url || '', method as any, payload);
        return Promise.resolve({
          data: {
            offline: true,
            message: 'অফলাইনে সংরক্ষিত হয়েছে। নেটওয়ার্ক পেলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।',
          },
          status: 202,
          statusText: 'Accepted Offline',
          headers: {},
          config,
        });
      }
    }

    return Promise.reject(error);
  },
);

export async function getStoredAuthToken(): Promise<string | null> {
  return mobileStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function pingCentralApi(): Promise<{
  online: boolean;
  baseUrl: string;
}> {
  const online = await checkOnlineStatus();
  return { online, baseUrl: API_BASE_URL };
}

export async function loginMobileUser(email: string, password: string) {
  const res = await mobileApiClient.post('/auth/login', {
    email,
    password,
  });
  const token = res?.data?.access_token;
  if (token) {
    await mobileStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
  return res.data;
}

export async function fetchMobileDashboardData(): Promise<{
  profile: { name: string; email: string; role: string; schoolName?: string } | null;
  notices: Array<{ id: string; title: string; content?: string; createdAt?: string }>;
  classesCount: number;
  routineCount: number;
  homeworkCount: number;
  financeSummary: { totalCollected?: number; totalPending?: number; summaryText?: string } | null;
}> {
  const [meRes, noticesRes, classesRes, financeRes] = await Promise.allSettled([
    mobileApiClient.get('/auth/me'),
    mobileApiClient.get('/communication/notices'),
    mobileApiClient.get('/academic/classes'),
    mobileApiClient.get('/finance/report'),
  ]);

  const profileData = meRes.status === 'fulfilled' ? meRes.value?.data : null;
  const noticesRaw = noticesRes.status === 'fulfilled' ? noticesRes.value?.data : [];
  const classesRaw = classesRes.status === 'fulfilled' ? classesRes.value?.data : [];
  const financeRaw = financeRes.status === 'fulfilled' ? financeRes.value?.data : null;

  return {
    profile: profileData
      ? {
          name: profileData.name || profileData.email || 'ব্যবহারকারী',
          email: profileData.email || '',
          role: profileData.role || 'MEMBER',
          schoolName: profileData.tenant?.name || profileData.schoolName,
        }
      : null,
    notices: Array.isArray(noticesRaw) ? noticesRaw : [],
    classesCount: Array.isArray(classesRaw) ? classesRaw.length : 0,
    routineCount: Number(financeRaw?.routineCount ?? (Array.isArray(classesRaw) ? classesRaw.length * 6 : 0)),
    homeworkCount: Number(financeRaw?.homeworkCount ?? 0),
    financeSummary: financeRaw || null,
  };
}

export async function logoutMobileUser() {
  await mobileStorage.removeItem(TOKEN_STORAGE_KEY);
}
