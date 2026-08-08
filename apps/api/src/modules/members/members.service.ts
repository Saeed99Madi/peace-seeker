import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RETENTION } from '@peace/shared';
import type { z } from 'zod';
import type { updateProfileSchema } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

export type UpdateProfileDto = z.output<typeof updateProfileSchema>;

const PUBLIC_FIELDS = {
  id: true,
  displayName: true,
  introduction: true,
  country: true,
  languages: true,
  skills: true,
  links: true,
  visibility: true,
  createdAt: true,
} as const;

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ...PUBLIC_FIELDS, email: true, locale: true, roles: true, status: true,
        presenceHidden: true, dmPolicy: true, charterAffirmedAt: true, charterVersion: true },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  /** B-5 — visibility is enforced here, not left to the client to respect. */
  async profile(id: string, viewer?: AuthenticatedUser) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: PUBLIC_FIELDS });
    if (!user) throw new NotFoundException('No such member.');

    const isSelf = viewer?.id === id;
    const hidden = await this.isHidden(id);
    if (!isSelf && (hidden || user.visibility === 'PRIVATE')) {
      throw new NotFoundException('No such member.');
    }
    if (!isSelf && user.visibility === 'MEMBERS_ONLY' && !viewer) {
      throw new ForbiddenException('Sign in to view this profile.');
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        introduction: dto.introduction,
        country: dto.country,
        languages: dto.languages,
        skills: dto.skills,
        links: dto.links,
        visibility: dto.visibility,
        avatarId: dto.avatarUploadId,
      },
      select: PUBLIC_FIELDS,
    });
  }

  /**
   * S-10 — "hide my presence". Instant, reversible, and destroys nothing: a
   * member in sudden danger should never have to choose between visibility and
   * losing everything they have written.
   */
  async setPresenceHidden(userId: string, hidden: boolean) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { presenceHidden: hidden, status: hidden ? 'HIDDEN' : 'ACTIVE' },
    });
    await this.audit.record({
      actorId: userId,
      action: hidden ? 'member.presence_hidden' : 'member.presence_restored',
      target: `user:${userId}`,
    });
  }

  /** S-5 — the right to disappear, with a stated deadline. */
  async requestDeletion(userId: string, voiceHandling: 'ANONYMISE' | 'REMOVE') {
    const dueAt = new Date(Date.now() + RETENTION.deletionCompletionDays * 86_400_000);
    await this.prisma.$transaction([
      this.prisma.deletionRequest.upsert({
        where: { userId },
        create: { userId, voiceHandling, dueAt },
        update: { voiceHandling, dueAt, requestedAt: new Date(), completedAt: null },
      }),
      this.prisma.user.update({ where: { id: userId }, data: { status: 'DELETION_PENDING' } }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await this.audit.record({
      actorId: userId,
      action: 'member.deletion_requested',
      target: `user:${userId}`,
      metadata: { voiceHandling, dueAt: dueAt.toISOString() },
    });
    return { dueAt };
  }

  private async isHidden(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { presenceHidden: true, status: true },
    });
    return Boolean(user?.presenceHidden) || user?.status !== 'ACTIVE';
  }
}
