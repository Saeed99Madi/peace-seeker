import type { VoiceCount } from '@peace/shared';
import { apiFetch } from './api-client';

export interface PublicVoice {
  id: string;
  attribution: { kind: 'name' | 'firstName' | 'anonymousFromCountry' | 'anonymous'; value: string | null };
  country: string | null;
  message: string | null;
  mediaUrl: string | null;
  mediaKind: 'audio' | 'video' | null;
  locale: string | null;
  createdAt: string;
}

const EMPTY_COUNT: VoiceCount = { total: 0, countriesRepresented: 0, asOf: new Date().toISOString() };

/**
 * §7, Availability — "the public Voice page must remain available even under
 * load spikes". These reads are cached and degrade to an empty state rather
 * than an error page: a landing page that renders without the API is better
 * than one that fails with it.
 */
export async function fetchVoiceCount(): Promise<VoiceCount> {
  try {
    return await apiFetch<VoiceCount>('/voices/count', { revalidate: 30 });
  } catch {
    return EMPTY_COUNT;
  }
}

export async function fetchVoices(limit = 24, offset = 0): Promise<PublicVoice[]> {
  try {
    const result = await apiFetch<{ items: PublicVoice[] }>(
      `/voices?limit=${limit}&offset=${offset}`,
      { revalidate: 30 },
    );
    return result.items;
  } catch {
    return [];
  }
}
