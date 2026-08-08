# Requirements coverage

Every numbered requirement in the specification, checked against the code as it
stands. Status is one of:

- **Done** — implemented and exercised (by a test, or by hand against the running stack).
- **Built, unexercised** — implemented, but not yet run end to end.
- **Partial** — some of it works; the gap is stated.
- **Not built** — honestly, nothing is there yet.

Where a requirement is not met, the reason is given rather than the word "todo".

---

## §3 Guiding design principles

| # | Requirement | Status | Where / why |
|---|---|---|---|
| 3.1 | No group-level counters | **Done** | `voice-counter.service.ts`; DB has no `(group, count)` table, and `voice_counter` is a `CHECK (id = 1)` singleton |
| 3.1 | No rankings or leaderboards | **Done** | No score/vote/like column exists in the schema; every listing orders by `createdAt` |
| 3.1 | No identity fields | **Done** | `ProhibitedFieldsGuard`, enforced on body *and* query, 7 tests |
| 3.1 | Identical two-party interfaces | **Done** | `symmetry.service.ts`, 8 tests |
| 3.1 | Randomised party order | **Done** | `shuffle.util.ts` + `CaseParty.sideToken`; demonstrated live on the landing page |
| 3.2 | No engagement mechanics | **Done** | Nothing to like or follow exists in schema or UI |
| 3.3 | Safety first | **Done** | See §8 below |
| 3.4 | Global and multilingual from day one | **Done** | 4 locales, full RTL, per-script typography |

## §5.1 Module A — The Voice

| # | Requirement | Status | Notes |
|---|---|---|---|
| A-1 | Add a Voice with no account | **Done** | Verified live |
| A-2 | Optional 280-char message, any language | **Done** | |
| A-3 | Audio/video testimony, 60s / 25 MB, moderated | **Partial** | Upload endpoint, size/type limits, metadata stripping and PENDING moderation all work. **No in-browser recorder UI**, and duration is not yet enforced server-side (only bytes) |
| A-4 | Single global counter, no breakdown | **Done** | Redis-cached; endpoint takes no parameters |
| A-5 | Wall of Voices, randomised order | **Done** | Seeded per reader per day |
| A-6 | Name / first-name / anonymous | **Done** | 9 tests |
| A-7 | Shareable image card | **Not built** | The *rules* for what a card may contain are written and tested (`cardSafeFields`), but no image is rendered |
| A-8 | Rate limiting, CAPTCHA, duplicate detection, optional verification | **Partial** | Redis-backed rate limiting keyed by hashed address; duplicate detection via `ipHash`. **CAPTCHA is configuration-only** — no provider wired, no widget |
| A-9 | One-click withdrawal, no account | **Done** | Verified live: message and address hash erased, counter decremented |

## §5.2 Module B — Membership

| # | Requirement | Status | Notes |
|---|---|---|---|
| B-1 | Registration + 100–2000 char self-introduction | **Done** | Verified live |
| B-2 | Optional profile fields | **Done** | API complete; profile-edit UI not built |
| B-3 | Prohibited fields | **Done** | Runtime guard + no columns |
| B-4 | Charter acceptance recorded | **Done** | Version-stamped (`charterVersion`) |
| B-5 | Visibility, default members-only | **Done** | Enforced server-side |
| B-6 | Directory by language and skill only | **Done** | API + UI |
| B-7 | Self-service deletion | **Done** | Request + `DeletionWorker` executes at 30 days |

## §5.3 Module C — The Community

| # | Requirement | Status | Notes |
|---|---|---|---|
| C-1 | Circles | **Partial** | API complete; UI lists circles but cannot create/join |
| C-2 | Threaded chronological discussions | **Partial** | API complete; no composer UI |
| C-3 | Stories, editorially reviewed | **Partial** | API complete (STORY → PENDING); no UI |
| C-4 | Library | **Not built** | `LibraryItem` model only |
| C-5 | Events, general area public | **Not built** | `Event`/`EventRsvp` models only |
| C-6 | Direct messages, block, report | **Not built** | `DirectMessage`/`Block` models only |
| C-7 | Announcements | **Not built** | Model only |

## §5.4 Module D — The Path

| # | Requirement | Status | Notes |
|---|---|---|---|
| D-1 | Intake, both parties consent | **Built, unexercised** | Needs two accounts to run end to end |
| D-2 | Facilitator reviews before release; words never altered | **Done** | No code path modifies a statement body |
| D-3 | Structural symmetry | **Done** | 8 tests |
| D-4 | Seven stages | **Built, unexercised** | |
| D-5 | Facilitator has no power to impose | **Done** | No endpoint exists that decides for a party |
| D-6 | Confidential; publication needs both | **Built, unexercised** | |
| D-7 | Withdrawal without penalty | **Built, unexercised** | |
| D-8 | Route out crime, violence, child safety | **Partial** | Screen implemented, biased to false positives, EN + AR terms. **Needs a safeguarding adviser to extend per language**, and referral directories per country are not populated |
| D-9 | Outcome library | **Not built** | `OutcomePattern` model only |

## §5.5 Module E — Administration

| # | Requirement | Status | Notes |
|---|---|---|---|
| E-1 | Moderation queue + audit log | **Done** | Audit log immutable by DB trigger |
| E-2 | Facilitator vetting workflow | **Not built** | `FacilitatorProfile` model only |
| E-3 | Aggregate-only analytics | **Done** | No grouping parameter exists; nightly snapshot |
| E-4 | Content management for pages/Library/translations | **Not built** | Static pages live in the translation catalogues |
| E-5 | Feature flags | **Done** | |

## §6 Internationalisation

| # | Requirement | Status | Notes |
|---|---|---|---|
| I-1 | Launch languages | **Done** | Spec said AR+EN; **EN, AR, FR, ES** all shipped |
| I-2 | Complete RTL | **Done** | Stylis RTL plugin, per-script fonts, optical size multiplier, direction-aware drawer |
| I-3 | Language independent of country | **Done** | |
| I-4 | Original language + optional machine translation | **Partial** | Content renders in its own language and direction; **no translation button** |
| I-5 | No cultural defaults | **Partial** | Locale-aware dates, no assumed name structure, countries named in the reader's language. **Hijri calendar option not built** |
| I-6 | Human-reviewed charter translations | **Done (process)** | Never machine-translated at runtime; the four texts still need a human translator before launch — including the Arabic |

## §7 Non-functional

| Area | Target | Measured | Status |
|---|---|---|---|
| Landing payload | < 300 KB | **309 KB** (28 KB HTML + 281 KB JS, gzipped) | **Misses by 3%.** MUI + React + Emotion account for ~280 KB. Options: drop MUI from the landing route, or accept the overrun |
| Photographs | — | 190 KB at a 1200px viewport, lazy, below the fold | Not in the critical path |
| Low-data mode | Suppress images | **Done** | `prefers-reduced-data` removes every photo before it is fetched |
| Offline tolerance | Queue and sync | **Partial** | Voice submissions queue in `localStorage` and flush on reconnect; **no service worker / PWA shell** |
| Accessibility | WCAG 2.1 AA | **Partial** | Skip link, focus rings, 44px targets, semantic landmarks, reduced-motion, alt text in 4 languages. **Not audited with a screen reader**, as §7 requires |
| Availability | Static + CDN | **Done** | All public pages prerendered |
| Scalability | Counter from cache | **Done** | Redis |
| Browser support | No-JS fallback for the Voice form | **Not built** | The form requires JavaScript |
| Audit | Immutable log | **Done** | DB trigger rejects UPDATE and DELETE |

## §8 Security, privacy and safety

| # | Requirement | Status | Notes |
|---|---|---|---|
| S-1 | Data minimisation | **Done** | |
| S-2 | Pseudonymity throughout | **Done** | No legal identity is ever required |
| S-3 | No precise location; strip EXIF/GPS | **Done** | Stripper fails closed; ffmpeg shipped in the image |
| S-4 | TLS 1.3, encryption at rest | **Partial** | HSTS, TLS enforced to SMTP, SSE-AES256 on uploads. **Database encryption at rest is a deployment setting**, not code; case-content encryption with separate key material is **not built** |
| S-5 | Right to disappear within 30 days | **Done** | `DeletionWorker` + confirmation email |
| S-6 | No third-party trackers | **Done** | CSP admits no off-origin host anywhere |
| S-7 | Hashed IPs, 7-day retention | **Done** | Peppered at the edge; hourly sweep; rate limiter keyed by the hash, not the address |
| S-8 | EU jurisdiction, transparency policy | **Partial** | Policy page published, deployment is EU-configurable. **Jurisdiction is the Foundation's decision** (§14.2) |
| S-9 | Passkeys/magic links, session management | **Partial** | Magic links, device list, remote revocation, Argon2id optional passwords. **Passkeys/WebAuthn not built**; no 2FA |
| S-10 | Hide-my-presence + admin kill switch | **Partial** | Member switch works (API). **No admin kill switch**, no UI for the member switch |
| S-11 | OWASP, CSRF, CSP, sanitisation, signed uploads, malware scanning, dependency scanning, pen test | **Partial** | CSRF guard, strict CSP, security headers, body limits, non-root read-only containers, dependency + secret scanning in CI, **zero npm advisories at any severity**. **No malware scanning on uploads; no penetration test** |
| S-12 | GDPR alignment | **Partial** | Lawful basis by consent, consent records, deletion, breach-notification process documented. **No data export/portability endpoint**; **no under-16 guardian flow** |

## §9 Moderation

| # | Requirement | Status |
|---|---|---|
| M-1 | Published Code of Conduct | **Done** — page in 4 languages |
| M-2 | Symmetric moderation, logged and reviewable | **Done** — every decision records the rule applied |
| M-3 | Plural team, escalation, appeals | **Partial** — appeals API enforces that a decision is never reviewed by its own author; no UI, and composition is an organisational matter |
| M-4 | Automated pre-screening, human review before removal | **Partial** — media held PENDING; no automated classifier |
| M-5 | Criticism of governments protected | **Done** — stated on the Code of Conduct page |

---

## The shortest path to launch

Ordered by what actually blocks a safe public launch:

1. **A human translator reviews all four charter texts** (I-6). The Arabic is my
   rendering of the founder's dialect into MSA — a judgement call that should
   not be mine.
2. **A safeguarding adviser extends D-8** and supplies referral services per
   country. The screen currently covers English and Arabic terms only.
3. **Jurisdiction and governance decisions** (§14.2, §14.6) — these fix hosting,
   what the transparency policy can promise, and who hears appeals.
4. **Screen-reader audit in Arabic and English** (§7).
5. **Penetration test** (S-11).
6. Then: the admin kill switch (S-10), data export (S-12), and the under-16 flow.
