import { 
  generateEd25519KeyPair, 
  signEntitlementPayload, 
  verifyEntitlementToken, 
  generateDeviceFingerprint, 
  generateLicenseKey 
} from './index';
import { EntitlementPayload } from '@sms/shared-types';

console.log('--- Testing Cryptographic & Entitlement Architecture ---');

// 1. Generate Ed25519 Keypair
const { publicKeyPem, privateKeyPem } = generateEd25519KeyPair();
console.log('✓ Ed25519 Keypair generated successfully.');

// 2. Prepare Sample Entitlement Payload
const samplePayload: EntitlementPayload = {
  schoolId: 'c4b8b64e-0000-4000-8000-000000000001',
  schoolCode: 'SCH-106184',
  schoolName: 'বরইতলী উচ্চ বিদ্যালয়',
  status: 'APPROVED',
  licenseKey: generateLicenseKey('SCH'),
  planType: 'STANDARD',
  validFromEpochMs: Date.now(),
  validUntilEpochMs: Date.now() + 365 * 24 * 60 * 60 * 1000,
  gracePeriodDays: 7,
  maxDevices: 2,
  maxStudents: 1500,
  issuedAtEpochMs: Date.now(),
  nonce: 'test-nonce-1234'
};

// 3. Server Signs Payload
const signedToken = signEntitlementPayload(samplePayload, privateKeyPem);
console.log('✓ Server signed entitlement payload. Signature length:', signedToken.signature.length);

// 4. Desktop Client Verifies Signature with Public Key
const verificationResult = verifyEntitlementToken(signedToken, publicKeyPem);
if (verificationResult.isValid) {
  console.log('✓ Positive Verification Passed: Ed25519 signature is 100% authentic.');
} else {
  console.error('✗ Verification failed:', verificationResult.error);
  process.exit(1);
}

// 5. Tampering Test: Tamper with School Status to test rejection
const tamperedToken = {
  ...signedToken,
  payload: {
    ...signedToken.payload,
    status: 'DEACTIVATED' as any
  }
};
const tamperedResult = verifyEntitlementToken(tamperedToken, publicKeyPem);
if (!tamperedResult.isValid) {
  console.log('✓ Negative Tampering Test Passed: Tampered payload was correctly REJECTED!');
} else {
  console.error('✗ Security flaw: Tampered token was accepted!');
  process.exit(1);
}

// 6. Test Hardware Fingerprint
const fingerprint = generateDeviceFingerprint({
  motherboardUuid: 'MB-UUID-998811',
  cpuId: 'Intel-Core-i7-12700',
  systemDiskSerial: 'SAMSUNG-SSD-980-PRO',
  primaryMacAddress: '00:1A:2B:3C:4D:5E',
  osPlatform: 'win32'
});
console.log('✓ Hardware Fingerprint SHA-256 generated:', fingerprint);

console.log('All Cryptographic Validation Tests PASSED with 100% success! 🎉');
