const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { enqueueSyncMutation, getPendingSyncBatch, getCachedData, cacheData } = require('./sync-db');
const { startAutoSync } = require('./sync-service');
const { generateHardwareFingerprint } = require('./hardware-fingerprint');
const { checkForUpdates, downloadAndVerifyUpdate, applyUpdateAndRestart } = require('./auto-updater');
const { initClockIntegrity, verifyAndResetClock, getClockStatus } = require('./clock-watchdog');
const { createBackup, listBackups, verifyBackup, restoreBackup, initScheduledBackupWatchdog, getBackupDirectory } = require('./backup-manager');

let mainWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 868,
    minWidth: 1024,
    minHeight: 700,
    title: 'SchoolPro - Enterprise Offline-First School Management',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow = win;
  win.on('closed', () => {
    mainWindow = null;
  });

  // Load Next.js local server or static build
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../web/out/index.html')}`;
  win.loadURL(startUrl);

  // Remove default menu for clean app appearance
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  // 1. Hardware Fingerprint IPC
  ipcMain.handle('get-hardware-info', async () => {
    try {
      return generateHardwareFingerprint();
    } catch (err) {
      console.error('[IPC:get-hardware-info] Failed to generate fingerprint:', err.message);
      return {
        fingerprint: 'HW-FALLBACK-0000-0000',
        rawHash: '0000',
        deviceName: 'Unknown-PC',
        platform: process.platform,
        cpuModel: 'Unknown-CPU',
      };
    }
  });

  // 2. Offline License File Storage IPC
  const getLicenseFilePath = () => path.join(app.getPath('userData'), 'school_entitlement.json');

  ipcMain.handle('save-license-file', async (event, data) => {
    try {
      const filePath = getLicenseFilePath();
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return { success: true };
    } catch (err) {
      console.error('[IPC:save-license-file] Error:', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('load-license-file', async () => {
    try {
      const filePath = getLicenseFilePath();
      if (!fs.existsSync(filePath)) return null;
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error('[IPC:load-license-file] Error:', err.message);
      return null;
    }
  });

  // 3. Offline Two-Way Sync Engine IPC
  ipcMain.handle('enqueue-sync-mutation', async (event, item) => {
    return await enqueueSyncMutation(item);
  });

  ipcMain.handle('get-pending-sync-batch', async (event, limit) => {
    return await getPendingSyncBatch(limit);
  });

  ipcMain.handle('get-cached-data', async (event, key) => {
    return await getCachedData(key);
  });

  ipcMain.handle('set-cached-data', async (event, { key, value }) => {
    return await cacheData(key, value);
  });

  ipcMain.on('start-two-way-sync', (event, config) => {
    startAutoSync(config);
  });

  // Backward compatibility
  ipcMain.on('start-sync-engine', (event, token) => {
    startAutoSync({ schoolId: 'SCH-106184', deviceFingerprint: 'DEFAULT-HW', token });
  });

  // 4. Cryptographic Auto-Update Engine IPC
  ipcMain.handle('check-for-updates', async (event, { currentVersion, schoolId }) => {
    return await checkForUpdates(currentVersion, schoolId);
  });

  ipcMain.handle('download-update', async (event, { manifest, publicKeyPem }) => {
    return await downloadAndVerifyUpdate(manifest, publicKeyPem);
  });

  ipcMain.handle('apply-update', async (event, filePath) => {
    return applyUpdateAndRestart(filePath);
  });

  // 5. Clock-Tampering & Security Watchdog IPC
  initClockIntegrity((lastKnownUtc, currentUtc) => {
    console.warn('[Main] System clock rollback detected! Alerting window...');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('clock-tampered', { lastKnownUtc, currentUtc });
    }
  });

  ipcMain.handle('verify-and-reset-clock', async () => {
    return verifyAndResetClock();
  });

  ipcMain.handle('get-clock-status', async () => {
    return getClockStatus();
  });

  // 6. Backup & Disaster Recovery IPC
  ipcMain.handle('create-local-backup', async (event, options) => {
    return createBackup(options || {});
  });

  ipcMain.handle('list-local-backups', async () => {
    return listBackups();
  });

  ipcMain.handle('verify-backup-archive', async (event, { filePath, password }) => {
    return verifyBackup(filePath, password);
  });

  ipcMain.handle('restore-local-backup', async (event, { filePath, password }) => {
    return restoreBackup(filePath, password);
  });

  ipcMain.handle('get-backup-directory', async () => {
    return getBackupDirectory();
  });

  // Initialize Scheduled 24h Backup Watchdog
  initScheduledBackupWatchdog();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
