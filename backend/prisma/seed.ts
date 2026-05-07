/**
 * Seed script — creates a dev tenant with a hashed API key.
 *
 * Usage:
 *   npx ts-node prisma/seed.ts
 *
 * The raw API key is printed to the console ONCE.
 * Copy it immediately — it cannot be recovered from the database.
 */
import { PrismaClient } from '@prisma/client';
import { generateApiKey } from '../src/auth/api-key.util';

const prisma = new PrismaClient();

async function main() {
  const { raw, hash } = generateApiKey();

  const tenant = await prisma.tenant.upsert({
    where: { apiKeyHash: hash },
    update: {},
    create: {
      name: 'Dev Tenant',
      apiKeyHash: hash,
    },
  });

  console.log('');
  console.log('════════════════════════════════════════════════════════');
  console.log('  🔑  Dev Tenant Created');
  console.log('════════════════════════════════════════════════════════');
  console.log(`  Tenant ID:    ${tenant.id}`);
  console.log(`  Tenant Name:  ${tenant.name}`);
  console.log(`  API Key:      ${raw}`);
  console.log('');
  console.log('  ⚠️  Save this key NOW. It will NOT be shown again.');
  console.log('  ⚠️  The database only stores a SHA-256 hash.');
  console.log('════════════════════════════════════════════════════════');
  console.log('');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
