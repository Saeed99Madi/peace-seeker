import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Fails the build when a page would ship without correct hreflang.
 *
 * This exists because of a real mistake: hreflang was declared once in the
 * layout, which does not know which page it is wrapping, so every page told
 * crawlers its translations lived at the locale root — /en/voices claiming its
 * Arabic version was /ar. Mismatched reciprocal hreflang makes Google discard
 * the annotations entirely, so it was worse than declaring none.
 *
 * I-1/§3.4 is the reason this matters more here than on a normal site: four
 * languages with no primary among them only works if a crawler can see that
 * they are four versions of one page.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALE_DIR = join(ROOT, 'src', 'app', '[locale]');

function pages(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return pages(full);
    return entry === 'page.tsx' ? [full] : [];
  });
}

const problems = [];

for (const file of pages(LOCALE_DIR)) {
  const source = readFileSync(file, 'utf8');
  const where = relative(ROOT, file);
  // The catch-all only calls notFound(); it renders no indexable content.
  if (where.includes(`[...rest]${sep}`)) continue;

  if (!source.includes('generateMetadata')) {
    problems.push(`${where} — no generateMetadata, so it ships with no canonical and no hreflang`);
    continue;
  }
  if (!source.includes('pageMetadata(')) {
    problems.push(`${where} — has generateMetadata but does not use pageMetadata(), so hreflang will be missing or wrong`);
    continue;
  }
  // The declared path must match where the file actually lives, or the page
  // points its own translations at another page.
  const expected = relative(LOCALE_DIR, dirname(file)).split(sep).filter(Boolean).join('/');
  const declared = /pageMetadata\(\s*locale as Locale,\s*'([^']*)'/.exec(source)?.[1];
  if (declared === undefined) {
    problems.push(`${where} — could not read the path passed to pageMetadata()`);
  } else if (declared.replace(/^\//, '') !== expected) {
    problems.push(`${where} — declares path "${declared}" but lives at "/${expected}"`);
  }
}

if (problems.length) {
  console.error(`\n✗ SEO metadata is wrong:\n${problems.map((p) => `  ${p}`).join('\n')}\n`);
  process.exit(1);
}

console.log(`✓ seo: ${pages(LOCALE_DIR).length} pages, each with a canonical and hreflang matching its own path`);
