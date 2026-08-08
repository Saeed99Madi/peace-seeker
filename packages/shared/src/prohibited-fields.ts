/**
 * B-3 / §3.1 — structural identity fields are prohibited platform-wide.
 *
 * A member may write anything they wish about themselves in free text; that is
 * their expression. What the platform must never do is put such information in
 * a *structured* field, because a structured field can be filtered, sorted and
 * counted — and a count by group turns the platform into a scoreboard.
 *
 * This list is enforced at runtime by the API (see ProhibitedFieldsGuard), so a
 * future contributor cannot reintroduce one of these fields by accident.
 */
export const PROHIBITED_FIELD_NAMES: readonly string[] = [
  'religion',
  'sect',
  'denomination',
  'faith',
  'ethnicity',
  'ethnicGroup',
  'race',
  'tribe',
  'nationality',
  'nationalityOfOrigin',
  'originCountry',
  'citizenship',
  'politicalAffiliation',
  'politicalParty',
  'party',
  'side',
  'conflictSide',
  'faction',
  'ideology',
  'city',
  'town',
  'address',
  'postalCode',
  'zipCode',
  'latitude',
  'longitude',
  'lat',
  'lng',
  'coordinates',
  'gpsLocation',
  'preciseLocation',
];

const NORMALISED = new Set(PROHIBITED_FIELD_NAMES.map((name) => name.toLowerCase()));

export function isProhibitedField(name: string): boolean {
  return NORMALISED.has(name.toLowerCase());
}

/** Returns every prohibited key found anywhere in a nested payload. */
export function findProhibitedFields(payload: unknown, depth = 0): string[] {
  if (depth > 6 || payload === null || typeof payload !== 'object') return [];
  if (Array.isArray(payload)) {
    return payload.flatMap((item) => findProhibitedFields(item, depth + 1));
  }
  const found: string[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (isProhibitedField(key)) found.push(key);
    found.push(...findProhibitedFields(value, depth + 1));
  }
  return [...new Set(found)];
}
