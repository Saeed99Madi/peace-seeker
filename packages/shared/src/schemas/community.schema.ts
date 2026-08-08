import { z } from 'zod';
import { CIRCLE_TYPES, POST_TYPES } from '../enums';
import { COMMUNITY_LIMITS } from '../limits';
import { LOCALES } from '../locales';

/** C-1 — circles are geographic or thematic; nothing else. */
export const createCircleSchema = z.object({
  name: z.string().trim().min(3).max(COMMUNITY_LIMITS.circleNameMax),
  type: z.enum(CIRCLE_TYPES),
  description: z.string().trim().min(20).max(COMMUNITY_LIMITS.circleDescriptionMax),
  locale: z.enum(LOCALES).optional(),
  /** Geographic circles name a general area only — never an address (S-3). */
  generalArea: z.string().trim().max(120).optional(),
});

export const updateCircleSchema = createCircleSchema.partial();

/**
 * C-2 / C-3 — discussions and stories. Chronological ordering only:
 * there is no score, no vote and no ranking field anywhere in this shape (§3.2).
 */
export const createPostSchema = z.object({
  type: z.enum(POST_TYPES),
  circleId: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(COMMUNITY_LIMITS.postTitleMax),
  body: z.string().trim().min(1).max(COMMUNITY_LIMITS.storyBodyMax),
  language: z.enum(LOCALES),
  parentId: z.string().uuid().optional(),
});

export const listPostsSchema = z.object({
  circleId: z.string().uuid().optional(),
  type: z.enum(POST_TYPES).optional(),
  /** Cursor pagination, strictly by creation time. */
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** C-5 — public listings expose the general area only. */
export const createEventSchema = z.object({
  circleId: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20).max(4000),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  mode: z.enum(['ONLINE', 'IN_PERSON']),
  generalArea: z.string().trim().max(120).optional(),
  exactLocation: z.string().trim().max(300).optional(),
  onlineUrl: z.string().url().max(500).optional(),
});

/** C-6 — direct messages, with per-member contact controls enforced server-side. */
export const sendDirectMessageSchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().trim().min(1).max(COMMUNITY_LIMITS.messageBodyMax),
});
