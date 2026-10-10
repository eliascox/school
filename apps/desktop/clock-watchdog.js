const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let app = null;

try {
  const electron = require('electron');
  app = electron.app;
} catch (e) {
  app = {
    getPath: () => path.resolve(process.env.APPDATA || process.cwd(), 'SchoolPro')
  };
}

const ROLLBACK_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes (300,000 ms)
const INTEGRITY_FILE_NAME = 'security_integrity.dat';
const MACHINE_SECRET = crypto.createHash('sha256').update(process.env.COMPUTERNAME || 'SCHOOLPRO-DEFAULT-MACHINE').digest('hex');

let lastKnownUtc = Date.now();
let lastMonotonicUptime = process.uptime();
let isClockTampered = false;
let checkTimer = null;

function getIntegrityFilePath() {
  const userDir = app.getPath('userData');
  fs.mkdirSync(userDir, { recursive: true });
  return path.join(userDir, INTEGRITY_FILE_NAME);
}

function calculateSeal(timestamp, tampered) {
  return crypto.createHmac('sha256', MACHINE_SECRET)
    .update(`${timestamp}|${tampered ? '1' : '0'}`)
    .digest('hex');
}

/**
 * 1. Initialize and Load Clock Integrity Checkpoint
 */
function initClockIntegrity(onTamperDetected = null) {
  const filePath = getIntegrityFilePath();
  const now = Date.now();
  lastMonotonicUptime = process.uptime();

  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      const expectedSeal = calculateSeal(data.lastKnownUtc, data.isClockTampered);

      if (data.seal === expectedSeal) {
        lastKnownUtc = data.lastKnownUtc;
        isClockTampered = data.isClockTampered || false;

        // Check if system clock jumped backwards by more than 5 minutes
        if (now < lastKnownUtc - ROLLBACK_TOLERANCE_MS) {
          console.error('[ClockWatchdog] CRITICAL: System clock rollback detected! Last recorded:', new Date(lastKnownUtc).toISOString(), 'Current time:', new Date(now).toISOString());
          isClockTampered = true;
          saveIntegrityState();
          if (onTamperDetected) onTamperDetected(lastKnownUtc, now);
          return false;
        }
      } else {
        console.warn('[ClockWatchdog] Warning: Integrity seal mismatch in checkpoint file. Enforcing audit.');
      }
    } catch (e) {
      console.warn('[ClockWatchdog] Could not parse integrity file:', e.message);
    }
  }

  // Advance clock forward if now is greater
  if (now > lastKnownUtc) {
    lastKnownUtc = now;
  }
  saveIntegrityState();

  // Start periodic 10-second watchdog loop
  if (!checkTimer) {
    checkTimer = setInterval(() => {
      runClockVerification(onTamperDetected);
    }, 10000);
    if (checkTimer.unref) {
      checkTimer.unref();
    }
  }

  return !isClockTampered;
}

/**
 * 2. Periodic Monotonic Watchdog Check
 */
function runClockVerification(onTamperDetected = null) {
  const currentWallClock = Date.now();
  const currentUptime = process.uptime();
  const wallClockDelta = currentWallClock - lastKnownUtc;
  const uptimeDelta = (currentUptime - lastMonotonicUptime) * 1000;

  lastMonotonicUptime = currentUptime;

  // Rollback Detection:
  // Case A: Wall clock went backwards by more than 5 minutes
  // Case B: Wall clock went backwards while uptime advanced forward by > 5 seconds
  if (wallClockDelta < -ROLLBACK_TOLERANCE_MS || (wallClockDelta < -10000 && uptimeDelta > 5000)) {
    console.error('[ClockWatchdog] Clock rollback detected during active runtime! Wall delta:', wallClockDelta, 'Uptime delta:', uptimeDelta);
    isClockTampered = true;
    saveIntegrityState();
    if (onTamperDetected) onTamperDetected(lastKnownUtc, currentWallClock);
    return false;
  }

  // If clock moves forward normally, advance checkpoint
  if (currentWallClock > lastKnownUtc) {
    lastKnownUtc = currentWallClock;
    saveIntegrityState();
  }

  return !isClockTampered;
}

function saveIntegrityState() {
  try {
    const filePath = getIntegrityFilePath();
    const payload = {
      lastKnownUtc,
      isClockTampered,
      lastVerifiedAt: new Date().toISOString(),
      seal: calculateSeal(lastKnownUtc, isClockTampered)
    };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.error('[ClockWatchdog] Failed to save integrity state:', err.message);
  }
}

/**
 * 3. Verify and Reset Clock (User fixed Windows system time)
 */
function verifyAndResetClock() {
  const now = Date.now();
  if (now < lastKnownUtc - ROLLBACK_TOLERANCE_MS) {
    return {
      success: false,
      isTampered: true,
      message: 'উইন্ডোজ পিসির ঘড়ি এখনও সংরক্ষিত সময়ের চেয়ে পেছনে রয়েছে। অনুগ্রহ করে ঘড়ির সময় সঠিক করুন।'
    };
  }

  // Clock is valid, clear tampering flag
  isClockTampered = false;
  lastKnownUtc = now;
  saveIntegrityState();
  console.log('[ClockWatchdog] Clock integrity successfully restored and re-sealed.');

  return {
    success: true,
    isTampered: false,
    message: 'ঘড়ির নিরাপত্তা যাচাই সফল হয়েছে।'
  };
}

function getClockStatus() {
  return {
    isClockTampered,
    lastKnownUtc,
    currentUtc: Date.now()
  };
}

function stopClockIntegrity() {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
}

module.exports = {
  initClockIntegrity,
  runClockVerification,
  verifyAndResetClock,
  getClockStatus,
  stopClockIntegrity
};
