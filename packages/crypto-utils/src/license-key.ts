import * as crypto from 'crypto';

/**
 * Generate a Cryptographically Secure Human-Readable License Key
 * Example: SMS-A8F2-99B1-4D3C-77E1
 */
export function generateLicenseKey(prefix: string = 'SMS'): string {
  const bytes = crypto.randomBytes(8);
  const hex = bytes.toString('hex').toUpperCase(); // 16 chars
  
  // Split into 4 chunks of 4 characters: XXXX-XXXX-XXXX-XXXX
  const chunks = hex.match(/.{1,4}/g) || [];
  return `${prefix}-${chunks.join('-')}`;
}

/**
 * Generate a Cryptographic Anti-Replay Nonce
 */
export function generateNonce(length: number = 16): string {
  return crypto.randomBytes(length).toString('hex');
}
