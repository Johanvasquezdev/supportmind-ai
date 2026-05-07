import { createHash, randomBytes } from 'crypto';

// ─── Key format ──────────────────────────────────────────────────────────────
// Generated keys follow the pattern:  smk_live_<32 hex chars>
// Examples:
//   smk_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
//
// The prefix makes keys recognisable in logs and config files without
// revealing the secret portion (similar to Stripe's sk_live_ / sk_test_).

const KEY_PREFIX = 'smk_live_';
const KEY_RANDOM_BYTES = 32; // 256 bits of entropy

// ─── Hashing ─────────────────────────────────────────────────────────────────
// We use SHA-256 instead of bcrypt because API keys are already high-entropy
// random strings. Bcrypt's intentional slowness protects weak passwords
// from brute-force attacks — but with 256 bits of randomness, brute force
// is computationally impossible regardless of hash speed.
//
// SHA-256 advantages for API keys:
//   • Deterministic → we can hash the incoming key and do a direct indexed
//     lookup (WHERE apiKeyHash = ?) instead of loading every row to compare.
//   • Fast → no per-request performance penalty.
//   • Irreversible → if the database leaks, original keys can't be recovered.

/**
 * Generates a cryptographically random API key.
 *
 * Returns `{ raw, hash }`:
 *   - `raw`  → the full key to show the user **once** (never stored)
 *   - `hash` → the SHA-256 hex digest to persist in the database
 */
export function generateApiKey(): { raw: string; hash: string } {
  const randomPart = randomBytes(KEY_RANDOM_BYTES).toString('hex');
  const raw = `${KEY_PREFIX}${randomPart}`;
  const hash = hashApiKey(raw);
  return { raw, hash };
}

/**
 * SHA-256 hashes an API key for storage or comparison.
 *
 * Always returns a 64-character lowercase hex string.
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Constant-time comparison to prevent timing attacks.
 *
 * Even though we do indexed lookups (not iteration), this is
 * defense-in-depth: if the guard ever needs to compare two hashes
 * directly, this prevents an attacker from measuring response times
 * to determine how many characters of the hash match.
 */
export function verifyApiKeyHash(rawKey: string, storedHash: string): boolean {
  const incomingHash = hashApiKey(rawKey);

  if (incomingHash.length !== storedHash.length) {
    return false;
  }

  // timingSafeEqual requires equal-length buffers
  const a = Buffer.from(incomingHash, 'hex');
  const b = Buffer.from(storedHash, 'hex');

  // Use a manual constant-time comparison since crypto.timingSafeEqual
  // throws on length mismatch (which we've already handled above)
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}
