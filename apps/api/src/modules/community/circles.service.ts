import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { z } from 'zod';
import type { createCircleSchema, updateCircleSchema } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';

export type CreateCircleDto = z.output<typeof createCircleSchema>;
export type UpdateCircleDto = z.output<typeof updateCircleSchema>;

/**
 * C-1 — circles, geographic or thematic.
 *
 * A steward is a coordinator, not a rank: the role grants moderation duties
 * inside one circle and confers nothing anywhere else, and it is never rendered
 * as status in the interface (§3.1, §4).
 */
@Injectable()
export class CirclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCircleDto) {
    return this.prisma.circle.create({
      data: {
        ...dto,
        members: { create: { userId, role: 'STEWARD' } },
      },
      select: { id: true, name: true, type: true },
    });
  }

  /** Chronological listing. No "most active" ordering exists (§3.2). */
  async list(type?: 'GEOGRAPHIC' | 'THEMATIC') {
    return this.prisma.circle.findMany({
      where: { status: 'PUBLISHED', ...(type ? { type } : {}) },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        generalArea: true,
        locale: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async get(circleId: string) {
    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        members: {
          where: { role: 'STEWARD' },
          select: { user: { select: { id: true, displayName: true } } },
        },
      },
    });
    if (!circle || circle.status !== 'PUBLISHED') throw new NotFoundException('No such circle.');
    return circle;
  }

  async join(userId: string, circleId: string) {
    await this.get(circleId);
    await this.prisma.circleMembership.upsert({
      where: { circleId_userId: { circleId, userId } },
      create: { circleId, userId },
      update: {},
    });
    return { joined: true };
  }

  async leave(userId: string, circleId: string) {
    await this.prisma.circleMembership.deleteMany({ where: { circleId, userId } });
    return { joined: false };
  }

  async update(userId: string, circleId: string, dto: UpdateCircleDto) {
    await this.assertSteward(userId, circleId);
    return this.prisma.circle.update({ where: { id: circleId }, data: dto });
  }

  async assertSteward(userId: string, circleId: string): Promise<void> {
    const membership = await this.prisma.circleMembership.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });
    if (membership?.role !== 'STEWARD') {
      throw new ForbiddenException('Only a steward of this circle can do that.');
    }
  }

  async isMember(userId: string, circleId: string): Promise<boolean> {
    const membership = await this.prisma.circleMembership.findUnique({
      where: { circleId_userId: { circleId, userId } },
    });
    return membership !== null;
  }
}
