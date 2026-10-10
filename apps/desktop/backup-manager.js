const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

let app = null;
try {
  const electron = require('electron');
  app = electron.app;
} catch (e) {
  app = {
    getPath: () => path.resolve(process.env.APPDATA || process.cwd(), 'SchoolPro')
  };
}

const MAGIC_BYTES = Buffer.from('SPBK'); // SchoolPro Backup Magic
const MAX_BACKUP_RETENTION = 7; // Keep last 7 backups
const DEFAULT_SECRET = process.env.COMPUTERNAME || 'SCHOOLPRO-DEFAULT-SECURITY-KEY';

function getBackupDirectory() {
  const backupDir = path.join(app.getPath('userData'), 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  return backupDir;
}

function deriveKey(password, salt) {
  const secret = password && password.trim() ? password.trim() : DEFAULT_SECRET;
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
}

/**
 * 1. Create Encrypted & Compressed Backup Archive (.spbackup)
 */
function createBackup({ schoolId = 'SCH-DEFAULT', password = null, webStorageData = {}, isAutomated = false }) {
  try {
    const backupDir = getBackupDirectory();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `SchoolPro_Backup_${schoolId}_${timestamp}${isAutomated ? '_auto' : ''}.spbackup`;
    const targetFilePath = path.join(backupDir, fileName);

    // Read local entitlement if available
    let entitlement = null;
    const entitlementPath = path.join(app.getPath('userData'), 'school_entitlement.json');
    if (fs.existsSync(entitlementPath)) {
      try {
        entitlement = JSON.parse(fs.readFileSync(entitlementPath, 'utf8'));
      } catch (err) {}
    }

    // Read local sync database content if available
    let sqliteData = { sync_queue: [], cached_entities: [], cached_data: [] };
    try {
      const { DatabaseSync } = require('node:sqlite');
      const dbPath = path.resolve(__dirname, 'offline_sync.db');
      if (fs.existsSync(dbPath)) {
        const db = new DatabaseSync(dbPath);
        db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
        sqliteData.sync_queue = db.prepare('SELECT * FROM sync_queue').all() || [];
        sqliteData.cached_entities = db.prepare('SELECT * FROM cached_entities').all() || [];
        sqliteData.cached_data = db.prepare('SELECT * FROM cached_data').all() || [];
      }
    } catch (err) {
      console.warn('[BackupManager] Could not read native sqlite dump:', err.message);
    }

    const recordCounts = {
      students: (webStorageData.students && webStorageData.students.length) || 0,
      feeCollections: (webStorageData.fee_collections && webStorageData.fee_collections.length) || 0,
      examMarks: (webStorageData.exam_marks && webStorageData.exam_marks.length) || 0,
      syncMutations: sqliteData.sync_queue.length || 0,
      cachedEntities: sqliteData.cached_entities.length || 0,
    };

    const payload = {
      schemaVersion: 1,
      schoolId,
      createdAt: new Date().toISOString(),
      isAutomated,
      recordCounts,
      entitlement,
      sqliteData,
      webStorageData,
    };

    // 1. Gzip compression
    const rawBuffer = Buffer.from(JSON.stringify(payload), 'utf8');
    const compressedBuffer = zlib.gzipSync(rawBuffer);
    const payloadSha256 = crypto.createHash('sha256').update(compressedBuffer).digest('hex');

    // 2. Encryption (AES-256-GCM)
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12); // Standard 12-byte IV for GCM
    const key = deriveKey(password, salt);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encryptedBuffer = Buffer.concat([cipher.update(compressedBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // 3. Assemble Header
    const header = {
      version: 1,
      saltHex: salt.toString('hex'),
      ivHex: iv.toString('hex'),
      authTagHex: authTag.toString('hex'),
      payloadSha256,
      createdAt: payload.createdAt,
      schoolId,
      isAutomated,
      recordCounts,
      isPasswordProtected: Boolean(password && password.trim()),
    };

    const headerBuffer = Buffer.from(JSON.stringify(header), 'utf8');
    const headerLenBuffer = Buffer.alloc(4);
    headerLenBuffer.writeUInt32BE(headerBuffer.length, 0);

    // Full archive format: [4 bytes MAGIC] + [4 bytes HEADER_LEN] + [HEADER_JSON] + [ENCRYPTED_DATA]
    const finalArchive = Buffer.concat([MAGIC_BYTES, headerLenBuffer, headerBuffer, encryptedBuffer]);
    fs.writeFileSync(targetFilePath, finalArchive);

    // 4. Prune older backups
    pruneOldBackups(backupDir);

    console.log(`[BackupManager] Backup created successfully: ${fileName} (${(finalArchive.length / 1024).toFixed(1)} KB)`);

    return {
      success: true,
      fileName,
      filePath: targetFilePath,
      sizeBytes: finalArchive.length,
      createdAt: payload.createdAt,
      recordCounts,
      isAutomated,
    };
  } catch (err) {
    console.error('[BackupManager] Failed to create backup:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * 2. Prune old backups exceeding retention limit
 */
function pruneOldBackups(backupDir) {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.spbackup') && !f.includes('pre_restore_safety'))
      .map(f => {
        const fullPath = path.join(backupDir, f);
        return {
          name: f,
          path: fullPath,
          time: fs.statSync(fullPath).mtimeMs,
        };
      })
      .sort((a, b) => b.time - a.time);

    if (files.length > MAX_BACKUP_RETENTION) {
      const toDelete = files.slice(MAX_BACKUP_RETENTION);
      for (const item of toDelete) {
        fs.unlinkSync(item.path);
        console.log(`[BackupManager] Pruned old backup: ${item.name}`);
      }
    }
  } catch (e) {
    console.warn('[BackupManager] Could not prune backups:', e.message);
  }
}

/**
 * 3. List Local Backups
 */
function listBackups() {
  try {
    const backupDir = getBackupDirectory();
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.spbackup'));

    const list = [];
    for (const f of files) {
      const fullPath = path.join(backupDir, f);
      try {
        const fd = fs.openSync(fullPath, 'r');
        const magic = Buffer.alloc(4);
        fs.readSync(fd, magic, 0, 4, 0);

        if (!magic.equals(MAGIC_BYTES)) {
          fs.closeSync(fd);
          continue;
        }

        const lenBuf = Buffer.alloc(4);
        fs.readSync(fd, lenBuf, 0, 4, 4);
        const headerLen = lenBuf.readUInt32BE(0);

        const headerBuf = Buffer.alloc(headerLen);
        fs.readSync(fd, headerBuf, 0, headerLen, 8);
        fs.closeSync(fd);

        const header = JSON.parse(headerBuf.toString('utf8'));
        const stats = fs.statSync(fullPath);

        list.push({
          fileName: f,
          filePath: fullPath,
          sizeBytes: stats.size,
          createdAt: header.createdAt,
          schoolId: header.schoolId,
          isAutomated: header.isAutomated || false,
          recordCounts: header.recordCounts || {},
          isPasswordProtected: header.isPasswordProtected || false,
        });
      } catch (err) {
        console.warn(`[BackupManager] Skipped reading ${f}:`, err.message);
      }
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('[BackupManager] Failed to list backups:', err.message);
    return [];
  }
}

/**
 * 4. Verify Backup Archive Integrity
 */
function verifyBackup(filePath, password = null) {
  try {
    if (!fs.existsSync(filePath)) {
      return { isValid: false, error: 'ব্যাকআপ ফাইলটি খুঁজে পাওয়া যায়নি।' };
    }

    const buffer = fs.readFileSync(filePath);
    if (buffer.length < 8) {
      return { isValid: false, error: 'ব্যাকআপ ফাইলটি ক্ষতিগ্রস্ত।' };
    }

    const magic = buffer.subarray(0, 4);
    if (!magic.equals(MAGIC_BYTES)) {
      return { isValid: false, error: 'ফাইলটি সঠিক SchoolPro ব্যাকআপ ফাইল নয়।' };
    }

    const headerLen = buffer.readUInt32BE(4);
    if (buffer.length < 8 + headerLen) {
      return { isValid: false, error: 'ব্যাকআপ হেডার ক্ষতিগ্রস্ত।' };
    }

    const header = JSON.parse(buffer.subarray(8, 8 + headerLen).toString('utf8'));
    const encryptedData = buffer.subarray(8 + headerLen);

    const salt = Buffer.from(header.saltHex, 'hex');
    const iv = Buffer.from(header.ivHex, 'hex');
    const authTag = Buffer.from(header.authTagHex, 'hex');

    const key = deriveKey(password, salt);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let compressed;
    try {
      compressed = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    } catch (e) {
      return {
        isValid: false,
        error: 'পাসওয়ার্ড ভুল হয়েছে অথবা ব্যাকআপ ফাইলটির অখণ্ডতা (Integrity) নষ্ট হয়েছে।',
      };
    }

    const computedSha = crypto.createHash('sha256').update(compressed).digest('hex');
    if (computedSha !== header.payloadSha256) {
      return { isValid: false, error: 'SHA-256 চেকসাম অমিল! ফাইলটি পরিবর্তিত হয়েছে।' };
    }

    const uncompressed = zlib.gunzipSync(compressed);
    const payload = JSON.parse(uncompressed.toString('utf8'));

    return {
      isValid: true,
      header,
      recordCounts: payload.recordCounts || {},
      payload,
    };
  } catch (err) {
    return {
      isValid: false,
      error: `যাচাইকরণ ব্যর্থ: ${err.message}`,
    };
  }
}

/**
 * 5. Disaster Recovery: Safe One-Click Restore
 */
function restoreBackup(filePath, password = null) {
  try {
    const verification = verifyBackup(filePath, password);
    if (!verification.isValid) {
      return {
        success: false,
        error: verification.error,
      };
    }

    const payload = verification.payload;
    const backupDir = getBackupDirectory();

    // 1. Create Emergency Pre-Restore Safety Snapshot of Current Data
    const safetySnapshotName = `pre_restore_safety_${Date.now()}.spbackup`;
    const safetySnapshotPath = path.join(backupDir, safetySnapshotName);
    try {
      const dbPath = path.resolve(__dirname, 'offline_sync.db');
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, path.join(backupDir, `safety_offline_sync_${Date.now()}.db`));
      }
    } catch (e) {}

    // 2. Restore SQLite tables
    if (payload.sqliteData) {
      try {
        const { DatabaseSync } = require('node:sqlite');
        const dbPath = path.resolve(__dirname, 'offline_sync.db');
        const db = new DatabaseSync(dbPath);

        db.exec('BEGIN TRANSACTION;');

        if (payload.sqliteData.sync_queue && payload.sqliteData.sync_queue.length > 0) {
          const insertQueue = db.prepare(`
            INSERT OR REPLACE INTO sync_queue 
            (id, school_id, entity_type, entity_id, action, payload, version, client_timestamp_utc, idempotency_key, attempts, status, last_error, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const row of payload.sqliteData.sync_queue) {
            insertQueue.run(
              row.id, row.school_id, row.entity_type, row.entity_id, row.action,
              row.payload, row.version, row.client_timestamp_utc, row.idempotency_key,
              row.attempts, row.status, row.last_error, row.created_at
            );
          }
        }

        if (payload.sqliteData.cached_entities && payload.sqliteData.cached_entities.length > 0) {
          const insertCache = db.prepare(`
            INSERT OR REPLACE INTO cached_entities (entity_type, entity_id, data, version, updated_at)
            VALUES (?, ?, ?, ?, ?)
          `);
          for (const row of payload.sqliteData.cached_entities) {
            insertCache.run(row.entity_type, row.entity_id, row.data, row.version, row.updated_at);
          }
        }

        if (payload.sqliteData.cached_data && payload.sqliteData.cached_data.length > 0) {
          const insertKV = db.prepare(`
            INSERT OR REPLACE INTO cached_data (key, value, updated_at)
            VALUES (?, ?, ?)
          `);
          for (const row of payload.sqliteData.cached_data) {
            insertKV.run(row.key, row.value, row.updated_at);
          }
        }

        db.exec('COMMIT;');
        console.log('[BackupManager] Restored SQLite database tables successfully.');
      } catch (err) {
        console.error('[BackupManager] Failed to restore SQLite data:', err.message);
      }
    }

    // 3. Restore Entitlement File
    if (payload.entitlement) {
      try {
        const entitlementPath = path.join(app.getPath('userData'), 'school_entitlement.json');
        fs.writeFileSync(entitlementPath, JSON.stringify(payload.entitlement, null, 2), 'utf8');
      } catch (err) {}
    }

    return {
      success: true,
      restoredPayload: payload,
      recordCounts: payload.recordCounts,
      restoredAt: new Date().toISOString(),
      schoolId: payload.schoolId,
    };
  } catch (err) {
    return {
      success: false,
      error: `রিস্টোর ব্যর্থ: ${err.message}`,
    };
  }
}

/**
 * 6. Automated Backup Watchdog
 */
let scheduledBackupTimer = null;

function initScheduledBackupWatchdog(getWebDataFn = () => ({})) {
  const checkAndRunBackup = () => {
    try {
      const backups = listBackups();
      const lastAutoBackup = backups.find(b => b.isAutomated);
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      if (!lastAutoBackup || (now - new Date(lastAutoBackup.createdAt).getTime()) > ONE_DAY_MS) {
        console.log('[BackupManager] Running scheduled 24h automated backup...');
        const webData = getWebDataFn();
        createBackup({
          schoolId: lastAutoBackup ? lastAutoBackup.schoolId : 'SCH-AUTO',
          isAutomated: true,
          webStorageData: webData,
        });
      }
    } catch (e) {
      console.warn('[BackupManager] Scheduled backup check failed:', e.message);
    }
  };

  // Run on startup after 30 seconds
  setTimeout(checkAndRunBackup, 30000);

  // Check every 4 hours
  scheduledBackupTimer = setInterval(checkAndRunBackup, 4 * 60 * 60 * 1000);
  if (scheduledBackupTimer.unref) {
    scheduledBackupTimer.unref();
  }
}

module.exports = {
  createBackup,
  listBackups,
  verifyBackup,
  restoreBackup,
  initScheduledBackupWatchdog,
  getBackupDirectory,
};
