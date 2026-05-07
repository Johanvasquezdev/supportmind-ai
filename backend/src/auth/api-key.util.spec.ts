import { generateApiKey, hashApiKey, verifyApiKeyHash } from './api-key.util';

describe('api-key.util', () => {
  // ─── generateApiKey ──────────────────────────────────────────────────────

  describe('generateApiKey', () => {
    it('should return raw and hash', () => {
      const { raw, hash } = generateApiKey();

      expect(raw).toBeDefined();
      expect(hash).toBeDefined();
      expect(typeof raw).toBe('string');
      expect(typeof hash).toBe('string');
    });

    it('should prefix raw key with smk_live_', () => {
      const { raw } = generateApiKey();
      expect(raw.startsWith('smk_live_')).toBe(true);
    });

    it('should generate a 64-char hex hash (SHA-256)', () => {
      const { hash } = generateApiKey();
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique keys on each call', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();

      expect(key1.raw).not.toBe(key2.raw);
      expect(key1.hash).not.toBe(key2.hash);
    });

    it('hash should match hashApiKey(raw)', () => {
      const { raw, hash } = generateApiKey();
      expect(hashApiKey(raw)).toBe(hash);
    });
  });

  // ─── hashApiKey ──────────────────────────────────────────────────────────

  describe('hashApiKey', () => {
    it('should be deterministic — same input always produces same output', () => {
      const key = 'smk_live_test1234567890abcdef';
      expect(hashApiKey(key)).toBe(hashApiKey(key));
    });

    it('should produce different hashes for different inputs', () => {
      expect(hashApiKey('key-a')).not.toBe(hashApiKey('key-b'));
    });

    it('should return a 64-char lowercase hex string', () => {
      const hash = hashApiKey('any-input');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // ─── verifyApiKeyHash ────────────────────────────────────────────────────

  describe('verifyApiKeyHash', () => {
    it('should return true for a matching key and hash', () => {
      const { raw, hash } = generateApiKey();
      expect(verifyApiKeyHash(raw, hash)).toBe(true);
    });

    it('should return false for a non-matching key', () => {
      const { hash } = generateApiKey();
      expect(verifyApiKeyHash('wrong-key-entirely', hash)).toBe(false);
    });

    it('should return false for a tampered hash', () => {
      const { raw } = generateApiKey();
      const tamperedHash = 'a'.repeat(64);
      expect(verifyApiKeyHash(raw, tamperedHash)).toBe(false);
    });

    it('should return false when hash lengths differ', () => {
      const { raw } = generateApiKey();
      expect(verifyApiKeyHash(raw, 'short')).toBe(false);
    });
  });
});
