import { ForbiddenException, Injectable } from '@nestjs/common';
import { COMMUNITY_LIMITS } from '@peace/shared';
import type { z } from 'zod';
import type { createPostSchema, listPostsSchema } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { CirclesService } from './circles.service';

export type CreatePostDto = z.output<typeof createPostSchema>;
export type ListPostsDto = z.output<typeof listPostsSchema>;

/**
 * C-2/C-3 — discussions and stories.
 *
 * Ordering is chronological, full stop. There is no score column to sort by,
 * no engagement signal to compute, and no feed ranking to tune (§3.2): content
 * is shown in the order it was written, or in the order an editor chose.
 */
@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly circles: CirclesService,
  ) {}

  async create(userId: string, dto: CreatePostDto) {
    if (dto.circleId && !(await this.circles.isMember(userId, dto.circleId))) {
      throw new ForbiddenException('Join this circle before writing in it.');
    }
    if (dto.type === 'DISCUSSION' && dto.body.length > COMMUNITY_LIMITS.discussionBodyMax) {
      throw new ForbiddenException(
        `A discussion post may be up to ${COMMUNITY_LIMITS.discussionBodyMax} characters.`,
      );
    }

    return this.prisma.post.create({
      data: {
        authorId: userId,
        circleId: dto.circleId,
        parentId: dto.parentId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        language: dto.language,
        // C-3: stories are editorially reviewed before publication; discussion
        // appears immediately and is moderated on report (M-4).
        status: dto.type === 'STORY' ? 'PENDING' : 'PUBLISHED',
      },
      select: { id: true, status: true, createdAt: true },
    });
  }

  async list(dto: ListPostsDto) {
    const items = await this.prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        parentId: null,
        ...(dto.circleId ? { circleId: dto.circleId } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.before ? { createdAt: { lt: new Date(dto.before) } } : {}),
      },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        language: true,
        createdAt: true,
        author: { select: { id: true, displayName: true, presenceHidden: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: dto.limit,
    });

    return {
      // S-10: a member who hid their presence keeps their words, without their name.
      items: items.map((post) => ({
        ...post,
        author: post.author.presenceHidden
          ? { id: null, displayName: null }
          : { id: post.author.id, displayName: post.author.displayName },
      })),
      nextCursor: items.length === dto.limit ? items[items.length - 1].createdAt.toISOString() : null,
    };
  }

  async replies(postId: string) {
    return this.prisma.post.findMany({
      where: { parentId: postId, status: 'PUBLISHED' },
      select: {
        id: true,
        body: true,
        language: true,
        createdAt: true,
        author: { select: { id: true, displayName: true, presenceHidden: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
