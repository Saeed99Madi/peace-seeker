#!/usr/bin/env node
/**
 * A page's heading and its body must share a left edge.
 *
 * PageHeading renders its own Container, and the body of the page renders
 * another. When the two disagree the title hangs to one side of the text it
 * introduces — on the charter it sat about 110px left of every paragraph
 * beneath it, and the same mismatch was quietly present on eight other pages.
 *
 * It is invisible in code review because the two widths are written a dozen
 * lines apart, and invisible at narrow viewports because both containers are
 * then full-bleed. It only appears on a wide screen.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PAGES = join(ROOT, 'src', 'app');

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : name === 'page.tsx' ? [full] : [];
  });

const errors = [];

for (const file of walk(PAGES)) {
  const source = readFileSync(file, 'utf8');
  if (!source.includes('<PageHeading')) continue;

  const body = source.match(/<Container\s+maxWidth="(sm|md|lg)"/);
  if (!body) continue;

  const heading = source.match(/<PageHeading\b[^>]*?maxWidth="(sm|md|lg)"/s);
  // PageHeading defaults to lg, so an omitted prop is a declaration of 'lg'.
  const headingWidth = heading ? heading[1] : 'lg';

  if (headingWidth !== body[1]) {
    errors.push(
      `${relative(ROOT, file)}  heading is ${headingWidth}, body is ${body[1]} — ` +
        `the title will not line up with its own text`,
    );
  }
}

if (errors.length) {
  console.error(`\n  ${errors.length} page(s) whose heading and body disagree:\n`);
  for (const e of errors) console.error(`    ${e}`);
  console.error('');
  process.exit(1);
}

console.log('  check-layout: every page heading lines up with its body');
