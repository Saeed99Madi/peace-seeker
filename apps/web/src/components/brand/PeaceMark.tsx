/**
 * The Peace Seekers mark.
 *
 * Two circles of exactly equal radius, neither containing the other, and where
 * they overlap a leaf grows. That is the charter in one drawing: "resolve
 * problems between two parties without one feeling that it is stronger, and
 * without the other feeling that it is wronged" — the shared ground is the only
 * thing either party makes, and it is made of both.
 *
 * The leaf's venation is drawn as a branching tree with terminal buds, because
 * a leaf's veins and a nerve cell's dendrites are the same figure: "the
 * greatest of God's creation is the nerve cell", and "religion and science
 * complete one another".
 *
 * Deliberately absent: any flag, any national or factional colour, any
 * religious symbol, and any left/right asymmetry. The mark is unchanged by
 * mirroring, so it is identical in Arabic and in English (I-2), and unchanged
 * by a 180° rotation, so no half of it is ever "first" (§3.1).
 */
export interface PeaceMarkProps {
  size?: number | string;
  /** Renders in a single inherited colour, for small or one-colour contexts. */
  mono?: boolean;
  title?: string;
}

export function PeaceMark({ size = 40, mono = false, title }: PeaceMarkProps) {
  const ring = mono ? 'currentColor' : 'var(--peace-mark-ring, #4F6146)';
  const leaf = mono ? 'currentColor' : 'var(--peace-mark-leaf, #3B4A34)';
  const vein = mono ? 'var(--peace-mark-cream, #FAF8F3)' : 'var(--peace-mark-vein, #D8B87A)';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}

      {/* The two parties. Same radius, same stroke, same colour — always. */}
      <g fill="none" stroke={ring} strokeWidth="5">
        <circle cx="36" cy="50" r="27" />
        <circle cx="64" cy="50" r="27" />
      </g>

      {/* What they hold in common. */}
      <path d="M 50 26.91 A 27 27 0 0 1 50 73.09 A 27 27 0 0 1 50 26.91 Z" fill={leaf} />

      <g fill="none" stroke={vein} strokeWidth="1.7" strokeLinecap="round">
        <path
          d="M 50 30.31 L 50 69.69
             M 50 38.5 Q 47.24 37.58 43.88 33.72 M 50 38.5 Q 52.76 37.58 56.13 33.72
             M 50 48 Q 46.17 46.73 41.5 41.37 M 50 48 Q 53.83 46.73 58.5 41.37
             M 50 57.5 Q 47.24 56.58 43.88 52.72 M 50 57.5 Q 52.76 56.58 56.13 52.72"
        />
      </g>
      <g fill={vein}>
        {[
          [43.88, 33.72],
          [56.13, 33.72],
          [41.5, 41.37],
          [58.5, 41.37],
          [43.88, 52.72],
          [56.13, 52.72],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.35" />
        ))}
      </g>
    </svg>
  );
}
