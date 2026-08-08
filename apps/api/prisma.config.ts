import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * The schema is a folder, not a single file, so that no model file exceeds the
 * project's 200-line ceiling.
 */
export default defineConfig({
  schema: './prisma/schema',
  migrations: {
    // Explicit: with a schema *folder*, Prisma does not infer the sibling
    // migrations directory, and a silent "no migrations found" would deploy an
    // empty database rather than fail.
    path: './prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
});
