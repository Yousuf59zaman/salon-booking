// Import bcryptjs for secure password hashing before storing in database
import { hash } from 'bcryptjs';
// Import custom generated Prisma client to interact with database schema
import { PrismaClient } from '../generated/prisma/client';

// Instantiate the Prisma Client database connection wrapper
const prisma = new PrismaClient();
// Set bcrypt cost factor (rounds) for password hashing difficulty
const BCRYPT_COST = 12;
// The placeholder password configured in env.example that MUST be changed for security
const DEFAULT_ADMIN_PASSWORD = 'change-this-password';

/**
 * Validates that crucial environment variables are present and not empty.
 * Throws an error to halt the seed process if validation fails.
 */
const requiredEnv = (name: 'ADMIN_EMAIL' | 'ADMIN_PASSWORD'): string => {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is required before running the Prisma seed.`);
  }

  return value;
};

/**
 * Creates or updates the default administrator account.
 */
const seedAdmin = async (): Promise<void> => {
  // Read and clean the admin credentials from environment variables
  const email = requiredEnv('ADMIN_EMAIL').trim().toLowerCase();
  const password = requiredEnv('ADMIN_PASSWORD');

  // Enforce security check: prevent running the seed with the default placeholder password
  if (password.trim() === DEFAULT_ADMIN_PASSWORD) {
    throw new Error(
      'ADMIN_PASSWORD must be changed from the default placeholder before running the Prisma seed.',
    );
  }

  // Securely hash the password using bcrypt with the defined cost factor
  const passwordHash = await hash(password, BCRYPT_COST);

  // Upsert the admin record: update password if email already exists, otherwise create new
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Seeded admin user: ${email}`);
};

/**
 * Seeds the initial catalog of active salon services.
 */
const seedServices = async (): Promise<void> => {
  // Pre-defined core salon services to populate the MVP database
  const services = [
    { name: 'Standard Haircut', priceBdt: 500, durationMinutes: 30 },
    { name: 'Premium Facial', priceBdt: 1200, durationMinutes: 60 },
    { name: 'Manicure & Pedicure', priceBdt: 800, durationMinutes: 60 },
    { name: 'Hair Spa & Therapy', priceBdt: 1500, durationMinutes: 90 },
  ];

  // Upsert each service by its unique name to prevent duplicate keys on re-seeding
  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {
        description: null,
        priceBdt: service.priceBdt,
        durationMinutes: service.durationMinutes,
        isActive: true,
      },
      create: {
        ...service,
        description: null,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${services.length} services.`);
};

// Orchestrate the execution of all seeding tasks
const main = async (): Promise<void> => {
  await seedAdmin();
  await seedServices();
};

// Execute main seeding sequence and handle lifecycle hooks (errors & termination)
main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Prisma seed failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Ensure database connection is closed properly on process exit
    await prisma.$disconnect();
  });
