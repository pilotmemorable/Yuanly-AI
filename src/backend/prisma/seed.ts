import prisma from '../src/config/db';
import { bootstrapAdmin, bootstrapDemoAccounts } from '../src/services/bootstrap';
import { ensureDemoCatalog } from '../src/services/demoSeed';

async function main() {
  await bootstrapAdmin();
  await ensureDemoCatalog();
  await bootstrapDemoAccounts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
