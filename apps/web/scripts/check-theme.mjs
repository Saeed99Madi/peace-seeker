#!/usr/bin/env node
/**
 * Guards against the class of bug that made the site unreadable in dark mode.
 *
 * Two readers — one on Windows, one on an iPhone — saw pale text on a pale
 * ground because their devices were in dark mode. Two separate causes, both
 * invisible in code review and both invisible in light mode:
 *
 *   1. A component painted its own background with a literal colour, so the
 *      text followed the scheme and the background did not.
 *   2. `theme.palette.x` inside styleOverrides. With cssVariables enabled MUI
 *      resolves that at build time to the *default scheme's* literal value and
 *      bakes it into the stylesheet. `(theme.vars ?? theme).palette.x` emits
 *      var(--mui-palette-x), which follows the scheme.
 *
 * Neither rule can see a contrast ratio. They only ensure a colour is chosen in
 * a place where both schemes are declared together.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');

/** Files allowed to hold literal colours: the palettes are defined there. */
const PALETTE_FILES = ['src/theme/tokens.ts', 'src/theme/palette.ts', 'src/components/layout/locale-badge.ts'];

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.ts') || full.endsWith('.tsx') ? [full] : [];
  });

const errors = [];

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  const source = readFileSync(file, 'utf8');

  source.split('\n').forEach((line, i) => {
    const at = `${rel}:${i + 1}`;
    if (line.trim().startsWith('*') || line.trim().startsWith('//')) return;

    // 1. theme.palette inside a styleOverrides callback freezes one scheme.
    if (/\$\{theme\.palette\./.test(line)) {
      errors.push(`${at}  theme.palette.* freezes the light value — use (theme.vars ?? theme).palette.*`);
    }

    // 2. A literal colour behind text, outside the files that define palettes.
    if (PALETTE_FILES.includes(rel)) return;
    const bg = line.match(/(background|backgroundColor|backgroundImage)\s*:\s*(['"`])(.*?)\2/);
    if (bg && /#[0-9a-fA-F]{3,8}\b|\brgba?\(/.test(bg[3]) && !bg[3].includes('var(')) {
      errors.push(`${at}  literal colour as a background — declare both schemes in theme/palette.ts and use a var()`);
    }
  });
}

if (errors.length) {
  console.error(`\n  ${errors.length} colour-scheme problem(s):\n`);
  for (const e of errors) console.error(`    ${e}`);
  console.error('\n  A colour that exists in only one scheme is unreadable in the other.\n');
  process.exit(1);
}

console.log('  check-theme: every colour follows the scheme');
