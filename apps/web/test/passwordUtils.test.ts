import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/passwordUtils';

describe('passwordUtils (SEC-102 PBKDF2 Password Hashing)', () => {
  it('hashes password with PBKDF2 salt and iterations format', async () => {
    const raw = 'admin123';
    const hash = await hashPassword(raw);

    expect(hash.startsWith('pbkdf2:100000:')).toBe(true);
    const parts = hash.split(':');
    expect(parts.length).toBe(4);
    expect(parts[2].length).toBe(32); // 16 bytes salt = 32 hex chars
    expect(parts[3].length).toBe(64); // 32 bytes derived key = 64 hex chars
  });

  it('verifies correct password against generated hash', async () => {
    const raw = 'SecretPassword!123';
    const hash = await hashPassword(raw);

    const result = await verifyPassword(raw, hash);
    expect(result.valid).toBe(true);
    expect(result.needsRehash).toBe(false);
  });

  it('rejects incorrect password against hash', async () => {
    const hash = await hashPassword('correctPassword');

    const result = await verifyPassword('wrongPassword', hash);
    expect(result.valid).toBe(false);
    expect(result.needsRehash).toBe(false);
  });

  it('verifies legacy plaintext password and flags for transparent rehash migration', async () => {
    const legacyPlain = '123456';
    const result = await verifyPassword('123456', legacyPlain);

    expect(result.valid).toBe(true);
    expect(result.needsRehash).toBe(true);
  });

  it('rejects incorrect attempt against legacy plaintext password', async () => {
    const legacyPlain = 'admin123';
    const result = await verifyPassword('wrongPass', legacyPlain);

    expect(result.valid).toBe(false);
    expect(result.needsRehash).toBe(false);
  });
});
