const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  getHardwareFingerprint: () => ipcRenderer.invoke('get-hardware-info'),
  saveLicenseFile: (data) => ipcRenderer.invoke('save-license-file', data),
  loadLicenseFile: () => ipcRenderer.invoke('load-license-file'),

  // Two-Way Sync Engine Bridge
  enqueueSyncMutation: (item) => ipcRenderer.invoke('enqueue-sync-mutation', item),
  getPendingSyncBatch: (limit) => ipcRenderer.invoke('get-pending-sync-batch', limit),
  startTwoWaySync: (config) => ipcRenderer.send('start-two-way-sync', config),

  // Cryptographic Auto-Update Bridge
  checkForUpdates: (config) => ipcRenderer.invoke('check-for-updates', config),
  downloadUpdate: (config) => ipcRenderer.invoke('download-update', config),
  applyUpdate: (filePath) => ipcRenderer.invoke('apply-update', filePath),

  // Clock-Tampering & Security Watchdog Bridge
  verifyAndResetClock: () => ipcRenderer.invoke('verify-and-reset-clock'),
  getClockStatus: () => ipcRenderer.invoke('get-clock-status'),
  onClockTampered: (callback) => {
    const handler = (_event, val) => callback(val);
    ipcRenderer.on('clock-tampered', handler);
    return () => ipcRenderer.removeListener('clock-tampered', handler);
  },

  // Backup & Disaster Recovery Bridge
  createLocalBackup: (options) => ipcRenderer.invoke('create-local-backup', options),
  listLocalBackups: () => ipcRenderer.invoke('list-local-backups'),
  verifyBackupArchive: (filePath, password) => ipcRenderer.invoke('verify-backup-archive', { filePath, password }),
  restoreLocalBackup: (filePath, password) => ipcRenderer.invoke('restore-local-backup', { filePath, password }),
  getBackupDirectory: () => ipcRenderer.invoke('get-backup-directory'),

  // Local Key-Value Storage
  getCachedData: (key) => ipcRenderer.invoke('get-cached-data', key),
  setCachedData: (key, value) => ipcRenderer.invoke('set-cached-data', { key, value }),

  // Legacy fallback
  queueOfflineAction: (endpoint, method, payload) => ipcRenderer.invoke('enqueue-sync-mutation', {
    schoolId: 'SCH-106184',
    entityType: 'general',
    entityId: `${endpoint}-${Date.now()}`,
    action: method,
    payload
  }),
  startSyncEngine: (token) => ipcRenderer.send('start-sync-engine', token),
});
