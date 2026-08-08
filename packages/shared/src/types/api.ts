/** Envelope types shared by every endpoint. */

export interface ApiError {
  statusCode: number;
  error: string;
  message: string | string[];
  /** Correlates a client report with the server log without storing an IP. */
  requestId?: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface Cursored<T> {
  items: T[];
  nextCursor: string | null;
}

/** E-5 — modules are launched in phases behind flags. */
export interface FeatureFlags {
  voice: boolean;
  membership: boolean;
  community: boolean;
  path: boolean;
  library: boolean;
  events: boolean;
  directMessages: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  voice: true,
  membership: true,
  community: false,
  path: false,
  library: false,
  events: false,
  directMessages: false,
};

/**
 * E-3 — the only analytics shape the Foundation ever receives. Note there is no
 * per-country, per-language or per-group breakdown field, and adding one would
 * violate §3.1; `countriesRepresented` is a breadth measure, not a comparison.
 */
export interface AggregateStats {
  totalVoices: number;
  countriesRepresented: number;
  totalMembers: number;
  activeCircles: number;
  casesOpened: number;
  casesReachingUnderstanding: number;
  asOf: string;
}
