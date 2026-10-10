const fs = require('fs');
const path = require('path');
const assert = require('assert');

const backupManager = require('./backup-manager');

console.log('--- Testing SchoolPro Backup & Disaster Recovery Engine ---');

const testSchoolId = 'SCH-TEST-106184';
const testPassword = 'SecurePassword123!';
const testWebData = {
  students: [
    { id: 'STU-001', name: 'কামাল হোসেন', roll: '1', class: '10', group: 'Science' },
    { id: 'STU-002', name: 'রহিমা আক্তার', roll: '2', class: '10', group: 'Science' }
  ],
  fee_collections: [
    { id: 'FEE-001', studentId: 'STU-001', amount: 1500, date: '2026-10-01' }
  ],
  exam_marks: [
    { id: 'MRK-001', studentId: 'STU-001', subject: 'Physics', marks: 88 }
  ],
  settings: {
    schoolName: 'বরইতলী উচ্চ বিদ্যালয়'
  }
};

// 1. Test Backup Creation with Password Protection
console.log('[Test 1] Creating encrypted backup...');
const createRes = backupManager.createBackup({
  schoolId: testSchoolId,
  password: testPassword,
  webStorageData: testWebData,
  isAutomated: false
});

console.log('Backup Result:', createRes);
assert.strictEqual(createRes.success, true, 'Backup creation should succeed');
assert.ok(fs.existsSync(createRes.filePath), 'Backup file must exist on disk');
assert.strictEqual(createRes.recordCounts.students, 2, 'Should record 2 students');
assert.strictEqual(createRes.recordCounts.feeCollections, 1, 'Should record 1 fee collection');

// 2. Test Listing Backups
console.log('[Test 2] Listing backups in vault...');
const list = backupManager.listBackups();
console.log(`Found ${list.length} backups in vault`);
const found = list.find(b => b.fileName === createRes.fileName);
assert.ok(found, 'Newly created backup should appear in list');
assert.strictEqual(found.isPasswordProtected, true, 'Should be marked as password protected');

// 3. Test Verification (Positive & Negative)
console.log('[Test 3] Verifying backup integrity...');
// Correct password
const verifyValid = backupManager.verifyBackup(createRes.filePath, testPassword);
console.log('Valid Password Verification:', verifyValid.isValid);
assert.strictEqual(verifyValid.isValid, true, 'Integrity check must pass with valid password');
assert.strictEqual(verifyValid.recordCounts.students, 2, 'Student count in payload must match');

// Wrong password
const verifyInvalid = backupManager.verifyBackup(createRes.filePath, 'WrongPass!');
console.log('Invalid Password Verification:', verifyInvalid.isValid, verifyInvalid.error);
assert.strictEqual(verifyInvalid.isValid, false, 'Integrity check must fail with wrong password');

// 4. Test Disaster Recovery Restore
console.log('[Test 4] Testing disaster recovery restore...');
const restoreRes = backupManager.restoreBackup(createRes.filePath, testPassword);
console.log('Restore Result:', restoreRes.success, 'Restored at:', restoreRes.restoredAt);
assert.strictEqual(restoreRes.success, true, 'Restore must succeed');
assert.strictEqual(restoreRes.recordCounts.students, 2, 'Restored student count must match');
assert.strictEqual(restoreRes.recordCounts.feeCollections, 1, 'Restored fee count must match');
assert.strictEqual(restoreRes.restoredPayload.webStorageData.students[0].name, 'কামাল হোসেন');

// Clean up test file
try {
  fs.unlinkSync(createRes.filePath);
} catch (e) {}

console.log('✅ All Backup & Disaster Recovery tests passed successfully!');
process.exit(0);
