const { 
  getPendingSyncBatch, 
  updateSyncItemStatus, 
  upsertCachedEntity 
} = require('./sync-db');
const axios = require('axios');
const crypto = require('crypto');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

let isSyncRunning = false;
let retryBackoffMs = 5000;
const MAX_BACKOFF_MS = 60000;

/**
 * 1. Push Pending Local Mutations to Central Server
 */
async function pushPendingMutations(schoolId, deviceFingerprint, token) {
  const pendingItems = await getPendingSyncBatch(50);
  if (pendingItems.length === 0) return 0;

  console.log(`[SyncEngine] Pushing batch of ${pendingItems.length} mutation(s) for School ${schoolId}...`);

  const batchId = crypto.randomUUID();
  const payload = {
    schoolId,
    deviceFingerprint,
    batchId,
    items: pendingItems
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/sync/push`, payload, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    const { results } = response.data;
    for (const res of results) {
      if (res.success) {
        await updateSyncItemStatus(res.queueId, 'COMPLETED', null, res.serverVersion);
      } else {
        await updateSyncItemStatus(res.queueId, 'FAILED', res.error || 'Server rejected');
      }
    }

    console.log(`[SyncEngine] Successfully processed push batch ${batchId}.`);
    // Reset backoff on success
    retryBackoffMs = 5000;
    return results.length;
  } catch (err) {
    console.warn(`[SyncEngine] Push batch failed (network/server offline):`, err.message);
    // Mark attempts increment
    for (const item of pendingItems) {
      await updateSyncItemStatus(item.id, 'PENDING', err.message);
    }
    // Exponential backoff
    retryBackoffMs = Math.min(MAX_BACKOFF_MS, retryBackoffMs * 2);
    throw err;
  }
}

/**
 * 2. Pull Remote Changes from Central Server to Local SQLite
 */
async function pullServerChanges(schoolId, deviceFingerprint, token, sinceTimestamp) {
  try {
    const payload = {
      schoolId,
      deviceFingerprint,
      sinceServerTimestampUtc: sinceTimestamp
    };

    const response = await axios.post(`${API_BASE_URL}/api/v1/sync/pull`, payload, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    const { changes, serverTimeUtc } = response.data;
    if (changes && changes.length > 0) {
      console.log(`[SyncEngine] Pulled ${changes.length} remote update(s) from central server.`);
      for (const change of changes) {
        await upsertCachedEntity(
          change.entityType,
          change.entityId,
          change.data,
          change.version,
          change.updatedAt
        );
      }
    }

    return serverTimeUtc;
  } catch (err) {
    console.warn(`[SyncEngine] Pull changes skipped (offline):`, err.message);
    return sinceTimestamp;
  }
}

/**
 * 3. Start Two-Way Auto-Sync Loop
 */
let lastSyncServerTime = null;

function startAutoSync({ schoolId, deviceFingerprint, token = '' }, intervalMs = 15000) {
  console.log(`[SyncEngine] Initializing background two-way sync loop for ${schoolId}...`);

  const runSyncCycle = async () => {
    if (isSyncRunning) return;
    isSyncRunning = true;

    try {
      // Step A: Push local changes
      await pushPendingMutations(schoolId, deviceFingerprint, token);

      // Step B: Pull remote changes
      lastSyncServerTime = await pullServerChanges(schoolId, deviceFingerprint, token, lastSyncServerTime);
    } catch (err) {
      // Handled in individual push/pull functions
    } finally {
      isSyncRunning = false;
    }
  };

  // Run initial cycle
  runSyncCycle();

  // Schedule recurring cycle with dynamic backoff
  const timer = setInterval(runSyncCycle, Math.max(intervalMs, retryBackoffMs));
  return () => clearInterval(timer);
}

module.exports = {
  pushPendingMutations,
  pullServerChanges,
  startAutoSync
};
