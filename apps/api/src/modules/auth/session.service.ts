import { Injectable } from '@nestjs/common';
import type { AccountStatus, UserRole } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { generateToken, tokenHash } from '../../common/utils/hash.util';

export const SESSION_COOKIE = 'peace_session';
const SESSION_DAYS = 30;

/** S-9 — sessions with a device list and remote revocation. */
@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, deviceLabel?: string): Promise<{ token: string; expiresAt: Date }> {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({
      data: { userId, tokenHash: tokenHash(token), deviceLabel: deviceLabel?.slice(0, 120), expiresAt },
    });
    return { token, expiresAt };
  }

  async resolve(token: string): Promise<AuthenticatedUser | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
    if (session.user.status === 'SUSPENDED' || session.user.status === 'DELETION_PENDING') {
      return null;
    }

    // Touch at most once a minute: a write on every request would turn the
    // session table into a high-resolution activity log (S-7).
    if (Date.now() - session.lastSeenAt.getTime() > 60_000) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      });
    }

    return {
      id: session.user.id,
      displayName: session.user.displayName,
      roles: session.user.roles as UserRole[],
      status: session.user.status as AccountStatus,
      locale: session.user.locale,
      sessionId: session.id,
    };
  }

  async revoke(sessionId: string, userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async list(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, deviceLabel: true, createdAt: true, lastSeenAt: true },
      orderBy: { lastSeenAt: 'desc' },
    });
  }
}
