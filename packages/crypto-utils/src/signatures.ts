import * as crypto from 'crypto';
import { EntitlementPayload, SignedEntitlementToken } from '@sms/shared-types';

/**
 * Generate a new Ed25519 Key Pair for signing licenses and updates
 * (Used on the Central Online Server)
 */
export function generateEd25519KeyPair(): { publicKeyPem: string; privateKeyPem: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKeyPem: publicKey, privateKeyPem: privateKey };
}

/**
 * Sign an Entitlement Payload using Server Private Key
 * (Central Server execution only)
 */
export function signEntitlementPayload(
  payload: EntitlementPayload,
  privateKeyPem: string,
  keyId: string = 'key-v1'
): SignedEntitlementToken {
  const serialized = JSON.stringify(payload);
  const signatureBuffer = crypto.sign(null, Buffer.from(serialized, 'utf8'), privateKeyPem);
  return {
    payload,
    signature: signatureBuffer.toString('base64'),
    keyId
  };
}

/**
 * Verify an Entitlement Token using Server Public Key
 * (Desktop Client offline execution)
 */
export function verifyEntitlementToken(
  token: SignedEntitlementToken,
  publicKeyPem: string
): { isValid: boolean; error?: string } {
  try {
    if (!token || !token.payload || !token.signature) {
      return { isValid: false, error: 'Malformed entitlement token' };
    }

    const serialized = JSON.stringify(token.payload);
    const signatureBuffer = Buffer.from(token.signature, 'base64');
    
    const isValid = crypto.verify(
      null,
      Buffer.from(serialized, 'utf8'),
      publicKeyPem,
      signatureBuffer
    );

    if (!isValid) {
      return { isValid: false, error: 'Cryptographic signature mismatch' };
    }

    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: `Verification exception: ${err.message}` };
  }
}

/**
 * Verify package SHA-256 and digital signature for Auto-Update
 */
export function verifyUpdatePackage(
  packageBuffer: Buffer,
  expectedSha256: string,
  expectedSignatureBase64: string,
  publicKeyPem: string
): { isValid: boolean; error?: string } {
  try {
    // 1. Verify SHA-256
    const actualHash = crypto.createHash('sha256').update(packageBuffer).digest('hex');
    if (actualHash.toLowerCase() !== expectedSha256.toLowerCase()) {
      return { isValid: false, error: 'SHA-256 checksum mismatch' };
    }

    // 2. Verify Digital Signature of the hash
    const signatureBuffer = Buffer.from(expectedSignatureBase64, 'base64');
    const isSignatureValid = crypto.verify(
      null,
      Buffer.from(actualHash, 'utf8'),
      publicKeyPem,
      signatureBuffer
    );

    if (!isSignatureValid) {
      return { isValid: false, error: 'Digital signature invalid' };
    }

    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: `Package verification error: ${err.message}` };
  }
}

/**
 * Sign an update package SHA-256 hash using Server Private Key
 * (Central Server execution only)
 */
export function signUpdatePackageHash(sha256Hex: string, privateKeyPem: string): string {
  const signatureBuffer = crypto.sign(null, Buffer.from(sha256Hex.toLowerCase(), 'utf8'), privateKeyPem);
  return signatureBuffer.toString('base64');
}
