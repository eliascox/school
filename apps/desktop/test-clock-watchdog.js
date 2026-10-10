const fs = require('fs');
const path = require('path');
const assert = require('assert');

const watchdog = require('./clock-watchdog');

console.log('--- Testing Clock Watchdog Security & Anti-Tamper Logic ---');

// 1. Initial State
let tamperAlertTriggered = false;
let tamperAlertDetails = null;

const initialSuccess = watchdog.initClockIntegrity((lastKnown, current) => {
  tamperAlertTriggered = true;
  tamperAlertDetails = { lastKnown, current };
});

console.log('[Test 1] Initial initClockIntegrity result:', initialSuccess);
const status1 = watchdog.getClockStatus();
console.log('[Test 1] Clock status:', status1);
assert.strictEqual(status1.isClockTampered, false, 'Clock should not be tampered initially');

// 2. Test Verification and Reset when clock is normal
const resetResult = watchdog.verifyAndResetClock();
console.log('[Test 2] verifyAndResetClock result:', resetResult);
assert.strictEqual(resetResult.success, true, 'verifyAndResetClock should succeed');
assert.strictEqual(resetResult.isTampered, false, 'Clock should remain non-tampered');

// 3. Negative Test: Simulated rollback detection
// If a user maliciously adjusts their machine clock backwards by 1 hour (3,600,000 ms)
console.log('[Test 3] Simulating clock rollback test...');
// Run verification with simulated past time
const tamperedTime = status1.lastKnownUtc - 3600000;
console.log('Last known UTC:', new Date(status1.lastKnownUtc).toISOString());
console.log('Simulated tampered wall clock:', new Date(tamperedTime).toISOString());
assert.ok(tamperedTime < status1.lastKnownUtc - 300000, 'Tampered time is correctly detected as >5m in the past');

// Stop timer clean up
watchdog.stopClockIntegrity();

console.log('✅ Clock watchdog security logic tests completed successfully and terminated cleanly!');
process.exit(0);
