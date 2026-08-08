const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldMessages: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Seconds of ISR caching for public, cacheable reads (§7, Availability). */
  revalidate?: number;
  signal?: AbortSignal;
}

/**
 * The single way the web app talks to the API.
 *
 * `credentials: 'include'` carries the session cookie; no token is ever placed
 * in localStorage, where any script on the page could read it (S-11).
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, revalidate, signal } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    signal,
    credentials: 'include',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    ...(revalidate !== undefined ? { next: { revalidate } } : { cache: 'no-store' }),
  });

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    const messages = Array.isArray(payload.message) ? payload.message : [];
    const message = Array.isArray(payload.message)
      ? payload.message[0]
      : (payload.message ?? response.statusText);
    return new ApiError(response.status, message, messages);
  } catch {
    return new ApiError(response.status, response.statusText);
  }
}
