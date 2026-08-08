import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The package is consumed by two very different toolchains: NestJS, which
 * requires CommonJS, and Next.js, which compiles client components as ES
 * modules. Shipping only CJS makes the bundler treat this package as a script
 * and fail when it injects `import.meta` for Fast Refresh.
 *
 * These marker files tell Node and every bundler how to read each output
 * directory, so `import` and `require` each get the format they expect.
 */
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

await Promise.all([
  writeFile(join(dist, 'cjs', 'package.json'), `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`),
  writeFile(join(dist, 'esm', 'package.json'), `${JSON.stringify({ type: 'module' }, null, 2)}\n`),
]);
