/**
 * Shared resolution for the optional NestJS Central Authority API endpoint.
 * Default Central API port is 4000 (Next.js web frontend runs on 3000).
 */

export const getConfiguredCentralApiUrl = (): string => {
  const envUrl =
    process.env.NEXT_PUBLIC_CENTRAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    '';
  if (envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem('sms_central_api_url');
      if (saved && saved.trim()) {
        return saved.trim().replace(/\/+$/, '');
      }
    } catch {
      // Ignore storage access errors in restricted browser contexts
    }
  }
  return '';
};

export const getCentralApiBaseUrl = (): string =>
  getConfiguredCentralApiUrl() || 'http://localhost:4000';
