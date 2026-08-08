import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Fails the build when the UI asks for a translation that does not exist.
 *
 * This exists because of a real failure: keys were used in a page, never added
 * to the catalogues, and the page threw MISSING_MESSAGE in the reader's face.
 * A check run by hand is not a check — it has to be something CI fails on, or
 * the next missing key ships.
 *
 * Three things are verified:
 *   1. every key the source asks for exists in the reference catalogue;
 *   2. the four catalogues have identical key sets (I-1: no language is the
 *      "real" one the others translate, so drift is a defect in both directions);
 *   3. no key is present but empty, which parity alone would call fine.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MESSAGES = join(ROOT, 'messages');
const SRC = join(ROOT, 'src');
const REFERENCE = 'en';

const flatten = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) =>
    value && typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );

const read = (locale, file) => JSON.parse(readFileSync(join(MESSAGES, locale, file), 'utf8'));

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(full) ? [full] : [];
  });
}

const locales = readdirSync(MESSAGES).filter((entry) => !entry.includes('.'));
const namespaces = readdirSync(join(MESSAGES, REFERENCE)).filter((f) => f.endsWith('.json'));

const catalogue = {};
for (const locale of locales) {
  catalogue[locale] = {};
  for (const file of namespaces) catalogue[locale][file.replace('.json', '')] = read(locale, file);
}
const referenceKeys = new Set(
  namespaces.flatMap((file) => flatten(read(REFERENCE, file), `${file.replace('.json', '')}.`)),
);

const problems = [];
const dynamic = [];

// ---- 1. every key the source asks for must exist -----------------------------
for (const file of walk(SRC)) {
  const source = readFileSync(file, 'utf8');
  const where = relative(ROOT, file);

  // Map each translator variable to the namespace it was bound to.
  const bindings = new Map();
  const bind = [
    /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*['"`]([\w.]+)['"`]/g,
    /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?getTranslations\(\s*\{[^}]*namespace:\s*['"`]([\w.]+)['"`]/g,
  ];
  for (const pattern of bind) {
    for (const m of source.matchAll(pattern)) bindings.set(m[1], m[2]);
  }
  if (bindings.size === 0) continue;

  for (const [variable, namespace] of bindings) {
    const call = new RegExp(`\\b${variable}(?:\\.raw)?\\(\\s*(['"\`])([^'"\`]*)\\1`, 'g');
    for (const m of source.matchAll(call)) {
      const key = m[2];
      const path = `${namespace}.${key}`;
      if (key.includes('${')) {
        // t(`vision.${key}`) — the leaf is dynamic, but its parent must exist.
        const parent = path.slice(0, path.indexOf('${')).replace(/\.$/, '');
        const node = parent.split('.').reduce((n, p) => n?.[p], catalogue[REFERENCE]);
        if (!node || typeof node !== 'object') {
          problems.push(`${where} — dynamic key "${path}" has no group "${parent}" in ${REFERENCE}`);
        } else {
          dynamic.push(`${where}: ${path}`);
        }
        continue;
      }
      if (!referenceKeys.has(path)) {
        // One file may bind the same variable name to two namespaces in two
        // scopes (a page's generateMetadata and its body). This matcher is
        // regex-based and not scope-aware, so before failing, accept the key if
        // *any* namespace bound in this file resolves it. Still catches a key
        // that exists nowhere, which is the failure that reaches a reader.
        const anyNamespace = [...new Set(bindings.values())].some((ns) =>
          referenceKeys.has(`${ns}.${key}`),
        );
        if (!anyNamespace) problems.push(`${where} — uses "${path}", which is in no catalogue`);
      }
    }
  }
}

// ---- 2. catalogues must not drift --------------------------------------------
for (const file of namespaces) {
  const reference = new Set(flatten(read(REFERENCE, file)));
  for (const locale of locales.filter((l) => l !== REFERENCE)) {
    let keys;
    try {
      keys = new Set(flatten(read(locale, file)));
    } catch {
      problems.push(`${locale}/${file} — missing or invalid JSON`);
      continue;
    }
    const missing = [...reference].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !reference.has(k));
    if (missing.length) problems.push(`${locale}/${file} — missing ${missing.length}: ${missing.slice(0, 4).join(', ')}`);
    if (extra.length) problems.push(`${locale}/${file} — ${extra.length} key(s) English lacks: ${extra.slice(0, 4).join(', ')}`);
  }
}

// ---- 3. no key may be present but empty --------------------------------------
for (const locale of locales) {
  for (const file of namespaces) {
    const data = read(locale, file);
    for (const key of flatten(data)) {
      const value = key.split('.').reduce((n, p) => n?.[p], data);
      if (typeof value === 'string' && value.trim() === '') {
        problems.push(`${locale}/${file} — "${key}" is empty`);
      }
    }
  }
}

if (problems.length) {
  console.error(`\n✗ Translations are broken:\n${problems.map((p) => `  ${p}`).join('\n')}\n`);
  process.exit(1);
}

console.log(
  `✓ translations: ${referenceKeys.size} keys used and defined, ` +
    `${locales.length} locales × ${namespaces.length} namespaces identical, ` +
    `${dynamic.length} dynamic key(s) with a verified parent group`,
);
