import { writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
const S = [0x24, 0x2c, 0x1f], H = [0xf7, 0xef, 0xdc];
const a = H.map((x, i) => (x - S[i]) / 255);
const duo = async (p) => sharp(await p.greyscale().normalise().png().toBuffer()).toColourspace('srgb').linear(a, S);
const UA = { 'User-Agent': 'peace-seekers/1.0 (https://peace-seekers.com)' };
const api = 'https://commons.wikimedia.org/w/api.php';
const search = async (q) => {
  const u = `${api}?action=query&generator=search&gsrsearch=${encodeURIComponent('filetype:bitmap ' + q)}&gsrlimit=10&gsrnamespace=6&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1600&format=json`;
  const r = await fetch(u, { headers: UA }); if (!r.ok) return [];
  return Object.values((await r.json())?.query?.pages ?? {});
};
const GROUPS = {
  nerveCell: ['Cajal neuron drawing', 'Ramon y Cajal Purkinje drawing', 'Golgi stain neuron histology'],
  science:   ['Haeckel Nautilus Kunstformen', 'nautilus shell section public domain', 'Haeckel spiral plate'],
  humanity:  ['flock of birds public domain', 'Haeckel plate many organisms', 'flock starlings sky'],
  shortLife: ['Taraxacum seed head public domain', 'dandelion pappus', 'blowball'],
  purpose:   ['scaffolding construction historic', 'cathedral scaffolding', 'steel framework building historic'],
};
const out = {};
for (const [key, qs] of Object.entries(GROUPS)) {
  const cands = [];
  for (const q of qs) for (const p of await search(q)) {
    const ii = p.imageinfo?.[0]; if (!ii || (ii.width ?? 0) < 1200) continue;
    const lic = (ii.extmetadata?.LicenseShortName?.value ?? '').replace(/<[^>]*>/g, '');
    if (!/^(CC0|Public domain|PD)/i.test(lic.trim())) continue;   // strictly no BY / BY-SA
    if (cands.some((c) => c.title === p.title)) continue;
    cands.push({ title: p.title, url: ii.thumburl ?? ii.url, w: ii.width, h: ii.height, lic,
      author: (ii.extmetadata?.Artist?.value ?? '').replace(/<[^>]*>/g, '').trim().slice(0, 60), page: ii.descriptionurl });
  }
  out[key] = cands.slice(0, 6);
  console.log(`  ${key}: ${cands.length} strict-PD candidates`);
  const tiles = []; const W = 180, HT = 225;
  await mkdir(`/tmp/v7/pd-${key}`, { recursive: true });
  for (const [i, c] of out[key].entries()) {
    try {
      const r = await fetch(c.url, { headers: UA }); if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      await writeFile(`/tmp/v7/pd-${key}/${i}.jpg`, buf);
      const img = await (await duo(sharp(buf).resize(W, HT, { fit: 'cover' }))).png().toBuffer();
      const label = Buffer.from(`<svg width="${W}" height="18"><rect width="${W}" height="18" fill="#000" opacity="0.7"/><text x="4" y="13" font-size="11" fill="#fff" font-family="sans-serif">${key} ${i}</text></svg>`);
      tiles.push({ input: await sharp(img).composite([{ input: label, top: HT - 18, left: 0 }]).toBuffer(), top: 0, left: tiles.length * W });
    } catch {}
  }
  if (tiles.length) await sharp({ create: { width: tiles.length * W, height: HT, channels: 3, background: '#111' } })
    .composite(tiles).jpeg({ quality: 88 }).toFile(`/tmp/v7/pdsheet-${key}.jpg`);
}
await writeFile('/tmp/v7/pd.json', JSON.stringify(out, null, 1));
const sheets = Object.keys(GROUPS).map((k) => `/tmp/v7/pdsheet-${k}.jpg`);
const metas = [];
for (const s of sheets) { try { metas.push({ s, m: await sharp(s).metadata() }); } catch {} }
const Wt = Math.max(...metas.map((x) => x.m.width));
let top = 0; const tt = [];
for (const x of metas) { tt.push({ input: await sharp(x.s).toBuffer(), top, left: 0 }); top += x.m.height + 5; }
await sharp({ create: { width: Wt, height: top, channels: 3, background: '#FAF8F3' } }).composite(tt).jpeg({ quality: 86 }).toFile('/tmp/v7/pd-all.jpg');
console.log('  merged');
