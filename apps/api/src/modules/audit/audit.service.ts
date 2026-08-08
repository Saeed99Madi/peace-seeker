import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  target: string;
  metadata?: Record<string, unknown>;
}

/**
 * NFR "Audit" — an immutable log of every moderation and administrative action.
 *
 * The service exposes `record` and `list` and nothing else: there is no update
 * and no delete path, and the migration adds a database trigger that rejects
 * both, so an administrator cannot quietly rewrite the record of a decision
 * they made (M-2 requires decisions to remain reviewable).
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        target: entry.target,
        metadata: (entry.metadata ?? {}) as object,
      },
    });
  }

  async list(page = 1, pageSize = 50) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, page, pageSize, total };
  }
}
