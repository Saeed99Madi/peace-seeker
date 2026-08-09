import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/**
 * Build-time image pipeline.
 *
 * §7 sets the constraints this exists to satisfy: a landing page under 300 KB,
 * a first paint under two seconds on 3G, and usable on a low-end Android. That
 * rules out shipping source JPEGs and it rules out an on-demand image service
 * (which would also break the static-CDN requirement). So every size and format
 * is produced here, once, and served as a plain file.
 *
 * Run with `npm run photos:build` after adding or replacing a source image.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WIDTHS = [480, 768, 1200, 1800];

/** Each photo earns its place by carrying one line of the charter. */
const PHOTOS = [
  { name: 'olive', aspect: 3 / 2, meaning: 'The olive of the mark; peace as a living thing.' },
  { name: 'earth', aspect: 16 / 9, meaning: '"The whole world is one country."' },
  { name: 'reach', aspect: 3 / 2, meaning: 'Two parties reaching; neither reaching further.' },
  { name: 'offer', aspect: 3 / 2, meaning: 'Open hands: what each party is willing to give.' },
  // The charter's three, in duotone. They are read behind the words rather
  // than beside them, and a full-colour photograph under text is a photograph
  // fighting the text.
  { name: 'horizon', aspect: 4 / 5, duotone: true, meaning: 'A level horizon: the one line with nothing above anything.' },
  { name: 'path', aspect: 4 / 5, duotone: true, meaning: 'A path anyone may walk. No gate and no one at it.' },
  { name: 'reflection', aspect: 4 / 5, duotone: true, meaning: 'Still water: whatever one side has, the other has exactly.' },

  // One photograph for each statement of the vision (§2), all duotone, all
  // pre-cropped to 4:5 in photos-src so the pipeline only has to scale.
  { name: 'vision-creation', aspect: 4 / 5, duotone: true, meaning: 'The Pillars of Creation: matter becoming stars.' },
  { name: 'vision-nerveCell', aspect: 4 / 5, duotone: true, meaning: 'Purkinje neurons, the branching the statement is about.' },
  { name: 'vision-purpose', aspect: 4 / 5, duotone: true, meaning: 'Scaffolding: the universe still being built.' },
  { name: 'vision-religionAndScience', aspect: 4 / 5, duotone: true, meaning: 'A nautilus: one object that is both wonder and mathematics.' },
  { name: 'vision-humanity', aspect: 4 / 5, duotone: true, meaning: 'A murmuration: thousands of equals moving as one body.' },
  { name: 'vision-oneCountry', aspect: 4 / 5, duotone: true, meaning: 'Earthrise: not one border is visible from there.' },
  { name: 'vision-shortLife', aspect: 4 / 5, duotone: true, meaning: 'A dandelion clock, one breath from gone.' },
];

/**
 * Duotone, mapping the whole tonal range onto two brand colours.
 *
 * A stock photograph in full colour always looks like a stock photograph
 * dropped into a page. Collapsed onto the olive-to-cream ramp it stops being a
 * picture of a place and becomes part of the same drawing as everything else —
 * and text can sit on it, which is the whole point of these three.
 *
 * linear() is a per-channel affine map, so shadow + grey x (highlight - shadow)
 * is exactly one pass: no LUT, no compositing, no second decode.
 */
const SHADOW = [0x24, 0x2c, 0x1f];   // just under olive950
const HIGHLIGHT = [0xf7, 0xef, 0xdc]; // sand50 warmed towards gold200

const duotone = async (pipeline) => {
  // Two passes, because greyscale() collapses the image to one band and sharp
  // will not expand bands inside linear(). Re-decoding the grey as PNG is the
  // cheapest way to get three channels back, and this runs at build time only.
  const grey = await pipeline.greyscale().normalise().png().toBuffer();
  return sharp(grey)
    .toColourspace('srgb')
    .linear(
      HIGHLIGHT.map((hi, i) => (hi - SHADOW[i]) / 255),
      SHADOW,
    );
};

/**
 * One treatment across every photo, so a page of them reads as one set rather
 * than as four stock pictures: saturation pulled back, warmth lifted a little
 * towards the olive and gold of the palette.
 */
const cohere = (pipeline) => pipeline.modulate({ saturation: 0.86, brightness: 1.02 }).gamma(1.02);

async function build() {
  const outDir = join(ROOT, 'public', 'photos');
  await mkdir(outDir, { recursive: true });
  const manifest = {};

  for (const photo of PHOTOS) {
    const source = await readFile(join(ROOT, 'photos-src', `${photo.name}.jpg`));
    const meta = await sharp(source).metadata();
    const sources = { avif: [], webp: [] };

    for (const width of WIDTHS) {
      if (width > (meta.width ?? 0)) continue;
      const scaled = sharp(source).resize({ width, withoutEnlargement: true });
      const resized = photo.duotone ? await duotone(scaled) : cohere(scaled);

      const avif = await resized.clone().avif({ quality: 52, effort: 6 }).toBuffer();
      const webp = await resized.clone().webp({ quality: 72 }).toBuffer();
      await writeFile(join(outDir, `${photo.name}-${width}.avif`), avif);
      await writeFile(join(outDir, `${photo.name}-${width}.webp`), webp);

      sources.avif.push({ width, bytes: avif.byteLength });
      sources.webp.push({ width, bytes: webp.byteLength });
    }

    // A 20px blur, inlined, so the layout never jumps and something is on
    // screen immediately on a slow connection.
    const small = sharp(source).resize({ width: 20 });
    const blur = await (photo.duotone ? await duotone(small) : cohere(small))
      .webp({ quality: 40 })
      .toBuffer();

    manifest[photo.name] = {
      aspect: photo.aspect,
      meaning: photo.meaning,
      widths: sources.avif.map((entry) => entry.width),
      blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
    };

    const largest = sources.avif.at(-1);
    console.log(`  ${photo.name.padEnd(6)} ${sources.avif.length} sizes, largest AVIF ${Math.round((largest?.bytes ?? 0) / 1024)} KB`);
  }

  const file =
    `// Generated by scripts/optimize-photos.mjs — do not edit by hand.\n` +
    `// Run \`npm run photos:build\` after changing anything in photos-src/.\n\n` +
    `export interface PhotoAsset {\n  aspect: number;\n  meaning: string;\n  widths: number[];\n  blurDataUrl: string;\n}\n\n` +
    `export const PHOTOS = ${JSON.stringify(manifest, null, 2)} as const satisfies Record<string, PhotoAsset>;\n\n` +
    `export type PhotoName = keyof typeof PHOTOS;\n`;

  await writeFile(join(ROOT, 'src', 'lib', 'photos.generated.ts'), file);
  console.log('  manifest written to src/lib/photos.generated.ts');
}

await build();
