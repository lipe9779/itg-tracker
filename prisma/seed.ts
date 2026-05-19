import { PrismaClient } from '../src/generated/client/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { CARRIER_REGISTRY } from '../src/lib/services/carrierRegistry';

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding carriers...');

  for (const carrier of CARRIER_REGISTRY) {
    await prisma.carrier.upsert({
      where: { carrier_name: carrier.carrierName },
      update: {
        carrier_code: carrier.carrierCode,
        scac_code: carrier.scacCode,
        tracking_url: carrier.trackingUrl,
        api_available: carrier.apiAvailable,
        api_documentation_url: carrier.apiDocumentationUrl ?? null,
        parser_strategy: carrier.parserStrategy,
        notes: carrier.notes,
      },
      create: {
        carrier_name: carrier.carrierName,
        carrier_code: carrier.carrierCode,
        scac_code: carrier.scacCode,
        tracking_url: carrier.trackingUrl,
        api_available: carrier.apiAvailable,
        api_documentation_url: carrier.apiDocumentationUrl ?? null,
        parser_strategy: carrier.parserStrategy,
        notes: carrier.notes,
      },
    });
    console.log(`  ✓ ${carrier.carrierName}`);
  }

  console.log(`\nSeeded ${CARRIER_REGISTRY.length} carriers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
