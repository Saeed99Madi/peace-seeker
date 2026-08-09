# Peace Seekers — Peace Everywhere

> **Peace — its meaning and its foundation is the lifting of injustice.**
> Submission to peace: no oppressor and no oppressed.
>
> **السلام — معناه وأساسه رفع الظلم. الاستسلام للسلام: لا ظالم ولا مظلوم.**

A web platform where any human being can register their voice for peace, join a
community, and — with a neutral facilitator — work through a problem with
another person so that neither ends up feeling stronger, and neither ends up
feeling wronged.

This repository implements the requirements specification. Where the
specification states a constraint, the code states it too: the constraint is
written in one place, enforced there, and referenced in the comment above it.

---

## What is here

| Workspace | What it is |
|---|---|
| `packages/shared` | Charter-derived constants, enums and Zod schemas. The single source of every limit, so the UI and the API can never disagree. |
| `apps/api` | NestJS + Prisma + PostgreSQL. All business rules and every safety guarantee. |
| `apps/web` | Next.js App Router + MUI. Four languages, full RTL, static public pages. |

**Languages:** English, العربية, Français, Español — with complete right-to-left
layout, per-locale typography, and no language treated as the original.

---

## Running it

```bash
# 1. dependencies
npm install

# 2. Postgres, Redis and an S3-compatible bucket
npm run infra:up

# 3. database
cp apps/api/.env.example apps/api/.env     # a dev .env is already committed
npm run db:migrate --workspace @peace/api
npm run db:seed    --workspace @peace/api

# 4. both apps
npm run dev        # api on :4000, web on :3000
```

| Command | Effect |
|---|---|
| `npm run build` | Builds shared, API and web |
| `npm test` | Runs the API test suite |
| `npm run typecheck` | Typechecks every workspace |
| `npm run infra:down` | Stops the local containers |

---

## How the charter is enforced in code

The design principles in §3 are binding constraints, not aspirations. Each one
has a specific place where it is made true:

### §3.1 Symmetry

- **One global counter, and no way to build another.** `VoiceCounter` is a
  single-row table with a `CHECK (id = 1)` constraint, and there is no
  `(group, count)` table anywhere in the schema. `CountryPresence` records only
  *that* a country is represented, never how many voices came from it — so
  "countries represented" is a breadth measure that cannot be turned into a
  comparison. `GET /api/voices/count` accepts no parameters. A withdrawal never
  removes a country from that table, because deciding whether to remove it would
  mean counting the voices remaining from that country — the very query this
  design exists to prevent. The figure is therefore "countries heard from", and
  it only grows.
  → `apps/api/src/modules/voice/voice-counter.service.ts`
- **No identity fields, enforced at runtime.** `ProhibitedFieldsGuard` runs on
  every request and rejects any payload containing `religion`, `ethnicity`,
  `nationality`, `conflictSide`, `latitude` and the rest — nested, in arrays, in
  query strings, case-insensitively. In a correct build it never fires; it
  exists for the build that is not correct.
  → `apps/api/src/common/guards/prohibited-fields.guard.ts`
- **Identical treatment of two parties.** Every rule about statements lives in
  one service written without reference to which party is asking: same word
  limit, same window, one statement each, and the other side's words released
  only when both have spoken *and* a facilitator has read them.
  → `apps/api/src/modules/path/symmetry.service.ts`
- **No fixed party order.** `CaseParty.sideToken` is random per case, and the
  display order is reshuffled per viewer per session.
  → `apps/api/src/common/utils/shuffle.util.ts`
- **No ranking anywhere.** There is no score, vote, like or follower column in
  the schema. Every listing orders by `createdAt`.

### §3.3 Safety

- **No location finer than a country.** One country field, one country control,
  no city field anywhere to grow one beside.
- **Metadata stripped on ingest, failing closed.** Images are re-encoded through
  sharp (dropping EXIF, IPTC, XMP, GPS and the embedded thumbnail); audio and
  video are remuxed with `-map_metadata -1`. If stripping is impossible, the
  upload is **refused**, never stored intact.
  → `apps/api/src/modules/media/metadata-stripper.service.ts`
- **IPs never leave the edge.** One middleware turns the address into a peppered
  HMAC and nothing downstream can obtain the original.
  → `apps/api/src/common/middleware/request-context.middleware.ts`
- **Hide my presence.** One switch makes a member and everything attributed to
  them private instantly, deleting nothing.
- **Account existence is never confirmed.** Requesting a sign-in link *and*
  registering both return the same answer whether or not the address is already
  a member; a repeat registration quietly sends a sign-in link instead. Testing
  whether a named person takes part in cross-conflict peace work is, in some
  places, itself dangerous.
- **The process refuses to start with weak secrets.** Env validation requires
  32-character peppers and rejects `MAIL_TRANSPORT=console` in production.

### Audit and moderation

`audit_logs` and `moderation_decisions` are append-only, enforced by a database
trigger and not merely by the absence of an update path in the service layer —
an administrator with a database console must not be able to quietly rewrite the
record of a decision they made. An appeal is never reviewed by the moderator who
made the original decision.

→ `apps/api/prisma/migrations/20260808000100_audit_immutability/migration.sql`

---

## The mark

Two circles of exactly equal radius, neither containing the other, and where
they overlap a leaf grows — the charter in one drawing. The leaf's venation is
drawn as a branching tree with terminal buds, because a leaf's veins and a nerve
cell's dendrites are the same figure: *"the greatest of God's creation is the
nerve cell"*, and *"religion and science complete one another."*

What is deliberately absent: any flag, any national or factional colour, any
religious symbol. The mark is unchanged by mirroring, so it is identical in
Arabic and English (I-2), and unchanged by a 180° rotation, so no half of it is
ever first (§3.1). The palette follows the same rule — olive, the gold of light
on it, and sand — chosen because the greens, reds, blacks and whites of national
and factional symbols take a side before a word is read.

- `src/components/brand/PeaceMark.tsx` — the mark, themed through CSS variables
- `src/app/icon.svg` — favicon variant, venation simplified because six terminal
  buds turn to mud at 16px
- `src/theme/tokens.ts` — palette, type scale (1.25 modular) and vertical rhythm

**A decision the Foundation should review:** the language switcher marks each
language with a letterform rather than a flag. A flag is a country and these are
languages — Arabic has no country, and choosing one of the twenty-odd states
that speak it is a political act of exactly the kind §3.1 forbids. English would
have to pick between two flags too. National flags are one constant away in
`src/components/layout/locale-badge.ts` (`BADGE_STYLE`) if the Foundation
decides otherwise.

## Photographs

Four, each carrying one line of the charter, and none showing an identifiable
person, place, building, flag or religious symbol — because a photograph of
people carries a face, a dress and a landscape, any of which can be read as one
side of a conflict (§3.1). The hero has no photograph at all for the same
reason: the number is the argument there.

Licensing, the selection test, and how to replace one:
[`apps/web/photos-src/CREDITS.md`](apps/web/photos-src/CREDITS.md).

They are built at compile time into AVIF and WebP at four widths with an inline
blur placeholder (`npm run photos:build --workspace @peace/web`), served as a
plain `<picture>` so no image server sits in front of the CDN, lazy-loaded below
the fold, and dropped entirely for a reader whose browser asks to save data
(§7 low-data mode).

## Running in production

```bash
cp apps/api/.env.example apps/api/.env      # then fill in every blank
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

Both images run as a non-root user, read-only, with all capabilities dropped.
The API image ships ffmpeg because the metadata stripper fails closed without it
(S-3) — no ffmpeg would mean every recording upload refused.

**The process refuses to start in production** if a secret is still a
placeholder, if the three peppers are not distinct, if mail would print sign-in
links to the log, if uploads would land on the container filesystem, or if
`WEB_ORIGIN` is not https. That is deliberate: a misconfigured deployment here
is a safety incident, not an inconvenience.

`TRUSTED_PROXY_HOPS` must match your actual proxy depth. Too low and every
visitor shares one address, so rate limiting becomes global; too high and a
client can forge `X-Forwarded-For`.

### Measured, not claimed

- Landing page: **309 KB** above the fold (28 KB HTML + 281 KB JS, gzipped)
  against the 300 KB budget in §7 — **3% over**. Roughly 280 KB of that is
  MUI + React + Emotion. Getting under means dropping MUI from the landing
  route; the Foundation may reasonably decide 309 KB is fine.
- Photographs: 190 KB at a 1200px viewport, lazy, below the fold, zero in
  low-data mode.
- `npm audit`: **no vulnerabilities at any severity.**

## What is and is not built

[`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) checks every numbered requirement
in the specification against the code, and says plainly where the gaps are.

## Conventions

- **No source file exceeds 200 lines.** The Prisma schema is a *folder* and the
  translation catalogues are split by namespace for this reason. The one
  exception is `prisma/migrations/*/migration.sql`, which is generated by Prisma
  and must not be split.
- **Limits are declared once**, in `@peace/shared`, and imported by both sides.
- **Comments explain why, not what** — and where a rule comes from the
  specification, the comment cites it (`A-6`, `S-3`, `§3.1`).
- Server components stay server-rendered; the `ButtonLink`/`TextLink` wrappers
  exist so MUI's `component` prop never has to cross the RSC boundary.

---

## What is implemented, and what is not

**Complete (Phase 1):** the Voice — submission without an account, the global
counter, the randomised Wall, withdrawal by one-click token, moderation queue
and decisions with audit; membership with self-introduction and charter
affirmation; magic-link authentication with device list and revocation; the
safety baseline of §8; the Founding Vision, Code of Conduct, Safety and
Transparency pages in all four languages.

**Backend complete, UI partial (Phases 2–3):** circles and posts (API complete;
the web app lists circles but has no discussion composer yet); the member
directory (API and UI); the Path — intake, invitation and consent, symmetric
statements, facilitator release, stage advance, withdrawal, publication consent,
fairness rating (API complete; the web app has the explainer page only).

**Not implemented — data model present, no code behind it:** events and RSVPs,
direct messages and blocks, the Library, announcements, facilitator vetting
workflow (E-2), the anonymised outcome library (D-9).

**Not implemented at all:**

- Shareable image cards (A-7) — the safety rules for what a card may contain are
  written and tested in `cardSafeFields`, but no image is rendered yet.
- The audio/video recorder UI (A-3). The upload endpoint and the stripping
  pipeline work; there is no in-browser recorder.
- Scheduled workers: the 30-day deletion purge (S-5) and the 7-day IP-hash sweep
  (S-7) are recorded with deadlines but nothing runs them yet.
- The S3 storage adapter and the SMTP mail adapter. Both interfaces exist and
  both **throw** rather than silently degrading; development uses local disk and
  the server log.
- Invisible CAPTCHA (A-8) — configuration hook only. Rate limiting is live.
- Service-worker PWA. Voice submissions queue in `localStorage` and flush on
  reconnect, but there is no offline shell.
- On-demand machine translation (I-4) and the Hijri calendar option (I-5).
- Malware scanning on uploads, and the annual penetration test (S-11).

**Verification status:** both builds pass, 28 tests cover the symmetry,
attribution, ordering and prohibited-field guarantees, and the stack has been
run end to end against a live PostgreSQL: both migrations apply, the seed runs,
and the following were exercised against the running API — anonymous voice
submission, the counter, the randomised wall, one-click withdrawal (message and
IP hash erased, counter decremented), registration, magic-link sign-in, session
listing, single-use token enforcement, the prohibited-field guard on both body
and query string, the append-only triggers on `audit_logs`, and the
`voice_counter` singleton constraint. All four locales render, with `dir="rtl"`
and a flipped Emotion cache for Arabic.

Still unexercised at runtime: media upload and stripping (needs ffmpeg on the
host), and the full Path case flow, which needs two consenting accounts.

---

## Open questions for the Foundation

§14 of the specification lists eight. Two of them block work that is otherwise
ready to build: the **legal entity and jurisdiction** (which fixes hosting and
the transparency policy's actual promises), and **governance** — who holds final
authority over moderation appeals and over amendments to the Founding Vision.
The appeals mechanism is built and currently escalates to `ADMINISTRATOR`; that
is a placeholder for a decision the Foundation should make before launch rather
than after the first controversy.
