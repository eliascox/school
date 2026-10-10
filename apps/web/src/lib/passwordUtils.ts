/**
 * Enterprise Client-Side Password Hashing Utility (PBKDF2 via WebCrypto)
 *
 * Implements SEC-102:
 * - PBKDF2-HMAC-SHA256 with 100,000 iterations & 16-byte random salt.
 * - Format: pbkdf2:100000:<salt_hex>:<hash_hex>
 * - Transparent migration support: verifies legacy plaintext passwords and
 *   flags them for immediate rehashing upon successful authentication.
 */

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto;
  }
  throw new Error('WebCrypto API is not supported in this runtime environment.');
}

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Hash a plain password using PBKDF2-HMAC-SHA256 with a unique random salt
 */
export async function hashPassword(password: string): Promise<string> {
  const cryptoObj = getCrypto();
  const enc = new TextEncoder();
  const salt = cryptoObj.getRandomValues(new Uint8Array(16));
  const iterations = 100000;

  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await cryptoObj.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // 32 bytes
  );

  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(derivedBits);

  return `pbkdf2:${iterations}:${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a stored value (hashed PBKDF2 or legacy plaintext).
 * Returns { valid: boolean, needsRehash: boolean }.
 * If needsRehash is true, the caller should save hashPassword(password) into storage.
 */
export async function verifyPassword(
  inputPassword: string,
  storedValue?: string | null
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!inputPassword || !storedValue) {
    return { valid: false, needsRehash: false };
  }

  // Check if storedValue is PBKDF2 format: pbkdf2:<iterations>:<saltHex>:<hashHex>
  if (storedValue.startsWith('pbkdf2:')) {
    const parts = storedValue.split(':');
    if (parts.length !== 4) {
      return { valid: false, needsRehash: false };
    }

    const iterations = parseInt(parts[1], 10);
    const saltHex = parts[2];
    const expectedHashHex = parts[3];

    if (isNaN(iterations) || !saltHex || !expectedHashHex) {
      return { valid: false, needsRehash: false };
    }

    const cryptoObj = getCrypto();
    const enc = new TextEncoder();
    const salt = hexToBuffer(saltHex);

    const keyMaterial = await cryptoObj.subtle.importKey(
      'raw',
      enc.encode(inputPassword),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await cryptoObj.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const computedHashHex = bufferToHex(derivedBits);
    const valid = timingSafeEqual(computedHashHex, expectedHashHex);

    return { valid, needsRehash: false };
  }

  // Legacy plaintext verification with transparent migration flag
  const isMatch = timingSafeEqual(inputPassword, storedValue);
  return {
    valid: isMatch,
    needsRehash: isMatch, // If it matches legacy plaintext, prompt caller to re-hash immediately
  };
}
