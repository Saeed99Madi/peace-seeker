import type { ReactNode } from 'react';

/**
 * One drawing for each of the seven statements of the vision.
 *
 * These are drawn rather than photographed, and that is a §3.1 decision before
 * it is an aesthetic one. "God created the universe" and "the greatest of God's
 * creation is the nerve cell" have no photograph that is not either a stock
 * cliché or a picture of somebody — and a picture of somebody carries a face, a
 * dress and a place, any of which a member on one side of a live conflict can
 * read as belonging to the other. A line has no nationality.
 *
 * They share one language so the seven read as a set: a 64-unit square, olive
 * strokes of the same weight, and a single gold accent placed where the meaning
 * of that statement actually sits. Both colours are CSS variables declared for
 * the light and dark schemes together, so the set follows the page.
 *
 * Each is inert and aria-hidden: the statement beside it carries the meaning,
 * and a screen reader should hear it once, not twice.
 */
const OLIVE = 'var(--peace-mark-ring)';
const GOLD = 'var(--peace-mark-vein)';

const stroke = {
  fill: 'none',
  stroke: OLIVE,
  strokeWidth: 2.1,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const accent = { ...stroke, stroke: GOLD, strokeWidth: 2.4 } as const;

/** "God created the universe." One point, and everything expanding from it. */
const creation = (
  <>
    <circle cx="32" cy="32" r="10" {...stroke} opacity="0.95" />
    <circle cx="32" cy="32" r="18.5" {...stroke} opacity="0.6" />
    <circle cx="32" cy="32" r="27" {...stroke} opacity="0.32" />
    <circle cx="32" cy="32" r="3.6" fill={GOLD} />
    <path d="M32 4.5v4M32 55.5v4M4.5 32h4M55.5 32h4" {...stroke} opacity="0.5" />
    <circle cx="47" cy="17" r="1.3" fill={OLIVE} opacity="0.7" />
    <circle cx="16" cy="45" r="1.3" fill={OLIVE} opacity="0.7" />
  </>
);

/**
 * "The greatest of God's creation is the nerve cell." The cell itself: a body,
 * dendrites reaching in, an axon carrying out, and the signal in gold.
 */
const nerveCell = (
  <>
    {/* Dendrites: what the cell receives, each one forking as it reaches. */}
    <path
      d="M16 27C11 22 9.5 18 8.5 13M8.5 13l-3.6-2.2M8.5 13l1-4.4
         M14 32C9.5 31.4 6.5 31 4 30.2M4 30.2l-1.6-3.2M4 30.2l-1 3.6
         M16.5 37.5C11.5 42 10.5 46 9.5 50M9.5 50l-3.6 1.4M9.5 50l1 3.6
         M21 24.5C20 18.5 20 14 20.5 9.5M20.5 9.5l-3.2-2.6M20.5 9.5l3.2-2.6"
      {...stroke}
    />
    <circle cx="23" cy="32" r="8" {...stroke} />
    {/* The axon: what it sends. Gold, because this is the signal. */}
    <path d="M31 32.5C40 33 42.5 29 49.5 26.5" {...accent} />
    <path d="M36 30.6v4M41 31.4v4" {...accent} strokeWidth="1.5" opacity="0.75" />
    <path d="M49.5 26.5l4.5-2.6M49.5 26.5l4.6 1.4M49.5 26.5l1.2 4.6" {...accent} />
    <circle cx="23" cy="32" r="2.8" fill={GOLD} />
    <circle cx="54.4" cy="23.6" r="1.7" fill={GOLD} />
    <circle cx="54.6" cy="28.2" r="1.7" fill={GOLD} />
    <circle cx="51" cy="31.4" r="1.7" fill={GOLD} />
  </>
);

/** "The building of the universe, and peace." A dome still being built, and a leaf at its keystone. */
const purpose = (
  <>
    <path d="M13 55V38a19 19 0 0 1 38 0v17" {...stroke} />
    <path d="M7 55h50" {...stroke} />
    <path d="M20 55V43h10v12M34 55V43h10v12" {...stroke} opacity="0.6" />
    {/* The leaf grows out of the keystone rather than hanging inside the arch,
        where it read as a lamp: what is being built is what peace grows from. */}
    <path d="M32 19v-6" {...accent} />
    <path d="M32 13C27 10.5 27 5 32 2.5c5 2.5 5 8 0 10.5Z" {...accent} />
  </>
);

/** "Religion and science complete one another." Two equal circles; what they share is lit. */
const religionAndScience = (
  <>
    <circle cx="24" cy="32" r="15" {...stroke} />
    <circle cx="40" cy="32" r="15" {...stroke} />
    <path d="M32 18.4a15 15 0 0 0 0 27.2 15 15 0 0 0 0-27.2Z" fill={GOLD} opacity="0.42" />
    <ellipse cx="32" cy="32" rx="23.5" ry="8" {...accent} transform="rotate(-20 32 32)" />
    <circle cx="32" cy="32" r="2.4" fill={GOLD} />
  </>
);

/** "Humanity is the goal." Every one of them the same size, and the goal at the centre. */
const humanity = (
  <>
    <circle cx="32" cy="32" r="23" {...stroke} opacity="0.4" />
    <circle cx="32" cy="32" r="12" {...stroke} opacity="0.7" />
    {Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      return (
        <circle
          key={i}
          cx={32 + Math.cos(angle) * 23}
          cy={32 + Math.sin(angle) * 23}
          r="2.5"
          fill={OLIVE}
        />
      );
    })}
    <circle cx="32" cy="32" r="4.4" fill={GOLD} />
  </>
);

/** "The whole world is one country." A globe drawn without a single border on it. */
const oneCountry = (
  <>
    <circle cx="32" cy="32" r="23" {...stroke} />
    <path d="M32 9c-7 6.5-11 14.3-11 23s4 16.5 11 23c7-6.5 11-14.3 11-23S39 15.5 32 9Z" {...stroke} />
    <path d="M9.6 27h44.8M9.6 37h44.8" {...stroke} opacity="0.65" />
    <path d="M32 9a23 23 0 0 1 0 46" {...accent} />
  </>
);

/** "Life is short, and we live only once." The sand runs; plant something in it. */
const shortLife = (
  <>
    <path d="M17 8h30M17 56h30" {...stroke} />
    <path d="M20 8v6l12 18 12-18V8M20 56v-6l12-18 12 18v6" {...stroke} />
    <path d="M32 32v5" {...accent} />
    <path d="M32 37q-5 3.4-5 7.6t5 5.4q5-1.2 5-5.4T32 37Z" {...accent} />
  </>
);

export const VISION_GLYPHS: Record<string, ReactNode> = {
  creation,
  nerveCell,
  purpose,
  religionAndScience,
  humanity,
  oneCountry,
  shortLife,
};
