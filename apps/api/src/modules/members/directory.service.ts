import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { Paginated, PublicMember } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';

export interface DirectoryQuery {
  language?: string;
  skill?: string;
  page: number;
  pageSize: number;
}

/**
 * B-6 — the member directory is searchable by language and by offered skill,
 * and by nothing else.
 *
 * Country is displayed on a profile if the member volunteered it, but it is not
 * a filter here and must not become one: "show me the members from X" is the
 * first step towards a list that can be used against people.
 */
@Injectable()
export class DirectoryService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: DirectoryQuery): Promise<Paginated<PublicMember>> {
    const where: Prisma.UserWhereInput = {
      status: 'ACTIVE',
      presenceHidden: false,
      visibility: { in: ['PUBLIC', 'MEMBERS_ONLY'] },
      ...(query.language ? { languages: { has: query.language } } : {}),
      ...(query.skill ? { skills: { has: query.skill } } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          displayName: true,
          introduction: true,
          country: true,
          languages: true,
          skills: true,
          createdAt: true,
        },
        // Chronological, never ranked (§3.2): there is no "top member".
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        displayName: row.displayName,
        introduction: row.introduction,
        country: row.country,
        languages: row.languages,
        skills: row.skills,
        avatarUrl: null,
        joinedAt: row.createdAt.toISOString(),
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  /** Powers the skill filter's suggestions without exposing member counts. */
  async knownSkills(): Promise<string[]> {
    const rows = await this.prisma.user.findMany({
      where: { status: 'ACTIVE', presenceHidden: false },
      select: { skills: true },
      take: 1000,
    });
    return [...new Set(rows.flatMap((row) => row.skills))].sort().slice(0, 100);
  }
}
