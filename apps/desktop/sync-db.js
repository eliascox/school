const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'offline_sync.db');

let db = null;
let useNodeSqlite = false;

try {
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(dbPath);
  useNodeSqlite = true;
  console.log('[SyncDB] Using native node:sqlite engine.');
} catch (e) {
  try {
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database(dbPath);
    useNodeSqlite = false;
    console.log('[SyncDB] Using legacy sqlite3 engine.');
  } catch (err) {
    console.warn('[SyncDB] SQLite not found, running in file fallback mode.');
  }
}

// Initialize Tables
if (useNodeSqlite && db) {
  db.exec(`PRAGMA journal_mode = WAL;`);
  db.exec(`PRAGMA synchronous = NORMAL;`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      client_timestamp_utc TEXT NOT NULL,
      idempotency_key TEXT UNIQUE NOT NULL,
      attempts INTEGER DEFAULT 0,
      status TEXT DEFAULT 'PENDING',
      last_error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue (status, created_at);

    CREATE TABLE IF NOT EXISTS cached_entities (
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      data TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (entity_type, entity_id)
    );

    CREATE TABLE IF NOT EXISTS cached_data (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
} else if (db) {
  // Legacy callback-based sqlite3
  db.serialize(() => {
    db.run(`PRAGMA journal_mode = WAL;`);
    db.run(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        client_timestamp_utc TEXT NOT NULL,
        idempotency_key TEXT UNIQUE NOT NULL,
        attempts INTEGER DEFAULT 0,
        status TEXT DEFAULT 'PENDING',
        last_error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

/**
 * 1. Enqueue Offline Mutation
 */
async function enqueueSyncMutation({
  id = crypto.randomUUID(),
  schoolId,
  entityType,
  entityId,
  action,
  payload,
  version = 1,
  clientTimestampUtc = new Date().toISOString(),
  idempotencyKey = null
}) {
  const rawKey = idempotencyKey || crypto
    .createHash('sha256')
    .update(`${schoolId}|${entityType}|${entityId}|${action}|${version}|${clientTimestampUtc}`)
    .digest('hex');

  const stringPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);

  if (useNodeSqlite && db) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO sync_queue (
        id, school_id, entity_type, entity_id, action, payload, version, client_timestamp_utc, idempotency_key, attempts, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'PENDING')
    `);
    stmt.run(id, schoolId, entityType, entityId, action, stringPayload, version, clientTimestampUtc, rawKey);
  }

  return {
    id,
    schoolId,
    entityType,
    entityId,
    action,
    payload,
    version,
    clientTimestampUtc,
    idempotencyKey: rawKey,
    status: 'PENDING'
  };
}

/**
 * 2. Get Pending Sync Batch
 */
async function getPendingSyncBatch(limit = 50) {
  if (useNodeSqlite && db) {
    const stmt = db.prepare(`SELECT * FROM sync_queue WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT ?`);
    const rows = stmt.all(limit);
    return rows.map(r => ({
      id: r.id,
      schoolId: r.school_id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      action: r.action,
      payload: JSON.parse(r.payload),
      version: r.version,
      clientTimestampUtc: r.client_timestamp_utc,
      idempotencyKey: r.idempotency_key,
      attempts: r.attempts,
      status: r.status,
      lastError: r.last_error
    }));
  }
  return [];
}

/**
 * 3. Update Sync Item Status
 */
async function updateSyncItemStatus(id, status, error = null, serverVersion = null) {
  if (useNodeSqlite && db) {
    if (serverVersion !== null) {
      const stmt = db.prepare(`UPDATE sync_queue SET status = ?, last_error = ?, attempts = attempts + 1, version = ? WHERE id = ?`);
      stmt.run(status, error, serverVersion, id);
    } else {
      const stmt = db.prepare(`UPDATE sync_queue SET status = ?, last_error = ?, attempts = attempts + 1 WHERE id = ?`);
      stmt.run(status, error, id);
    }
  }
  return true;
}

/**
 * 4. Upsert Cached Entity
 */
async function upsertCachedEntity(entityType, entityId, data, version, updatedAt) {
  if (useNodeSqlite && db) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO cached_entities (entity_type, entity_id, data, version, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(entityType, entityId, typeof data === 'string' ? data : JSON.stringify(data), version, updatedAt || new Date().toISOString());
  }
  return true;
}

/**
 * 5. Key-Value Storage
 */
async function cacheData(key, value) {
  if (useNodeSqlite && db) {
    const stmt = db.prepare(`INSERT OR REPLACE INTO cached_data (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`);
    stmt.run(key, JSON.stringify(value));
  }
  return true;
}

async function getCachedData(key) {
  if (useNodeSqlite && db) {
    const stmt = db.prepare(`SELECT value FROM cached_data WHERE key = ?`);
    const row = stmt.get(key);
    if (!row) return null;
    return JSON.parse(row.value);
  }
  return null;
}

module.exports = {
  enqueueSyncMutation,
  getPendingSyncBatch,
  updateSyncItemStatus,
  upsertCachedEntity,
  cacheData,
  getCachedData,
};
