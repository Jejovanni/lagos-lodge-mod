// src/lib/crypto.ts
// Cryptographic utilities — server-side only

import { createHash } from 'crypto';

/**
 * Hash a raw license key using SHA-256.
 * We never store raw keys in the DB — only their hash.
 */
export function hashLicenseKey(rawKey: string): string {
  return createHash('sha256').update(rawKey.trim().toLowerCase()).digest('hex');
}

/**
 * Hash an IP address for fraud-detection storage.
 * We salt with a secret so IPs can't be reverse-looked-up.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'default-salt-change-me';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}
