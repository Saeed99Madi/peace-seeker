# Photograph credits and licensing

All four photographs come from **Unsplash** and are used under the
[Unsplash License](https://unsplash.com/license), which grants a free,
irrevocable, worldwide licence to use the images commercially, with no
permission required. Attribution is not required; it is appreciated, and the
Foundation may wish to add photographer names before launch (see below).

| File | Source | Used for |
|---|---|---|
| `olive.jpg` | `images.unsplash.com/photo-1591122523233-22037c1dec9f` | The Founding Vision section |
| `earth.jpg` | `images.unsplash.com/photo-1663427929917-333d88949f7a` | "The whole world is one country" band |
| `reach.jpg` | `images.unsplash.com/photo-1695049761557-cb56d348c297` | The Path / symmetry section |
| `offer.jpg` | `images.unsplash.com/photo-1447619297994-b829cc1ab44a` | Membership closing band |

## The charter's three (duotone)

These are separate from the four above: they are used only on `/charter`, they
are never shown in full colour, and they were chosen so that words could be set
on them. All three are **CC0 / public domain**, so no attribution is required —
it is recorded here because knowing where a picture came from is part of being
able to replace it.

| File | Source | Licence | Credit | Used for |
|---|---|---|---|---|
| `horizon.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Calm-sea-haleiwa_(Unsplash).jpg) | CC0 | Jeremy Bishop | "Peace" — a level horizon |
| `path.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?curid=61777935) | CC0 | Alice Donovan Rouse | "Membership" — a path anyone may walk |
| `reflection.jpg` | [WordPress Photos](https://wordpress.org/photos/photo/2516a11cf5/) | CC0 | Bibek KC | "How this becomes a platform" — symmetry |

All three were found through the [Openverse](https://openverse.org) and
Wikimedia Commons APIs filtered to CC0 and public-domain only.

**Duotone.** They are mapped onto the olive-to-cream ramp at build time
(`duotone()` in `scripts/optimize-photos.mjs`) rather than shown as they were
shot. A full-colour stock photograph always looks like a full-colour stock
photograph dropped into a page; collapsed onto two brand colours it becomes
part of the same drawing as the mark and the type, and text can be set on it.
It also costs a fraction of the bytes: the horizon is 12 KB at its largest AVIF
against 113 KB for the full-colour olive.

**To add photographer credit:** request an Unsplash API key and call
`GET /photos/:id` for each image, or open the photo page on unsplash.com and
copy the name. Add it to the caption slot in `Photo.tsx`.

## How these were chosen

§3.1 constrains photography more than it constrains anything else. A photograph
of people carries a face, a dress, a landscape and a language, and any of those
can be read as one side of a conflict — which is why the hero has no photograph
at all and why none of these four shows an identifiable person, place, building,
flag or religious symbol.

What is left still says everything the charter needs:

- **olive** — the olive of the mark; peace as a living thing rather than a sign.
- **earth** — no borders are visible from orbit, which is the argument
  *"the whole world is one country"* is making.
- **reach** — two people reaching toward one another, neither reaching further.
  Hands only: no faces, no clothing, no place.
- **offer** — open hands, for what each party is willing to give (D-1).

If the Foundation replaces any of these, apply the same test: **could a member on
either side of a live conflict see this picture as belonging to the other side?**
If yes, it fails, however beautiful it is.

## Replacing or adding a photograph

1. Put a high-resolution JPEG in `apps/web/photos-src/`.
2. Add it to the `PHOTOS` list in `apps/web/scripts/optimize-photos.mjs`, with
   the line of the charter it carries.
3. Run `npm run photos:build --workspace @peace/web`.
4. Add alt text for **all four languages** in `messages/<locale>/home.json`.

The pipeline emits AVIF and WebP at four widths plus an inline blur placeholder,
and writes `src/lib/photos.generated.ts`. Source files are kept in the
repository so the set can be regenerated at new sizes without re-sourcing.
