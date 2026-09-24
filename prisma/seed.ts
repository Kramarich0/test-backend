// run: pnpm db:seed
import { hash } from 'bcryptjs';
import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client.js';

config();

const prisma = new PrismaClient();

const hashPassword = async (password: string) => await hash(password, 12);

async function main() {
  console.info('[Seed] Starting populating db...');

  const rootEmail = 'root@kkm.local';
  const rootPassword = 'RootAdmin123!';

  const existingRoot = await prisma.admin.findFirst({
    where: { role: 'ROOT' },
  });

  if (!existingRoot) {
    const rootPasswordHash = await hashPassword(rootPassword);

    const root = await prisma.admin.create({
      data: {
        email: rootEmail,
        name: 'Chief Root Admin',
        password: rootPasswordHash,
        role: 'ROOT',
      },
    });

    console.info(`[Seed] Single ROOT has been created: ${root.email} (password: ${rootPassword})`);
  } else {
    console.info(`[Seed] ROOT already exists: ${existingRoot.email}`);
  }

  const managerEmail = 'manager@kkm.local';
  const managerPassword = 'ManagerPass123!';

  const existingManager = await prisma.admin.findUnique({
    where: { email: managerEmail },
  });

  if (!existingManager) {
    const managerPasswordHash = await hashPassword(managerPassword);

    await prisma.admin.create({
      data: {
        email: managerEmail,
        name: 'Alex Manager',
        password: managerPasswordHash,
        role: 'MANAGER',
      },
    });

    console.info(`[Seed] test MANAGER created: ${managerEmail} (password: ${managerPassword})`);
  }

  const ownersCount = await prisma.shopOwner.count();

  if (ownersCount === 0) {
    const shopPassword = 'ShopPass123!';

    const shopPasswordHash = await hashPassword(shopPassword);

    const owner = await prisma.shopOwner.create({
      data: {
        name: 'IE Ivanov Ivan Ivanovich',
        contacts: '+7 (999) 123-45-67, ivan@example.com',
        shops: {
          create: [
            {
              name: 'Location No.1 "Sport-Bar Center"',
              requisites: 'Tax ID 777777777777, Registration No. 123456788765432',
              address: 'Moscow, Tverskaya Str., 31',
              login: 'shop_ivan',
              password: shopPasswordHash,
              terminals: {
                create: [
                  {
                    macAddress: '00:1B:44:11:3A:B7',
                    status: 'ACTIVE',
                  },
                ],
              },
              requests: {
                create: [
                  {
                    macAddress: 'AA:BB:CC:DD:EE:01',
                    status: 'PENDING',
                    comment: 'Request for terminal at Entrance No.2',
                  },
                  {
                    macAddress: 'AA:BB:CC:DD:EE:02',
                    status: 'PENDING',
                    comment: 'Request for terminal at Entrance No.3 (To test REJECTED)',
                  },
                  {
                    macAddress: 'AA:BB:CC:DD:EE:03',
                    status: 'REJECTED',
                    comment: 'Request for terminal at Entrance No.4 (To test reply on REJECTED)',
                  },
                  {
                    macAddress: 'AA:BB:CC:DD:EE:04',
                    status: 'APPROVED',
                    comment: 'Request for terminal at Entrance No.5 (To test reply on APPROVED)',
                  },
                ],
              },
            },
          ],
        },
      },
    });

    console.info(
      `[Seed] Shop owner, store, and terminal request successfully created: ${owner.name}`,
    );
  }

  console.info('\n[Seed] Database successfully initialized!');
  console.info('[Seed] Login credentials for the reviewer:');

  console.info(`ROOT: email: "${rootEmail}" password: "${rootPassword}"`);
  console.info(`MANAGER: email: "${managerEmail}" password: "${managerPassword}"\n`);
}

try {
  await main();
} catch (error) {
  console.error('[Seed] Error during seeding:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
