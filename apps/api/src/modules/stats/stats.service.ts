import { Injectable } from '@nestjs/common';
import type { AggregateStats } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * E-3 — aggregate analytics for the Foundation.
 *
 * Every figure here is a total or a breadth count. There is no method that
 * accepts a grouping key, and the underlying tables hold no group attribute to
 * group by, so a breakdown cannot be reconstructed from this service even by a
 * determined administrator (§3.1, E-3).
 *
 * §13 also asks for the metric the Foundation should care about most: the gap
 * between the two parties' fairness ratings in a closed case. A large gap means
 * the platform failed its founding principle.
 */
@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async aggregate(): Promise<AggregateStats> {
    const [counter, totalMembers, activeCircles, casesOpened, casesUnderstood] =
      await this.prisma.$transaction([
        this.prisma.voiceCounter.findUnique({ where: { id: 1 } }),
        this.prisma.user.count({ where: { status: 'ACTIVE' } }),
        this.prisma.circle.count({ where: { status: 'PUBLISHED' } }),
        this.prisma.case.count(),
        this.prisma.case.count({ where: { status: 'CLOSED' } }),
      ]);

    return {
      totalVoices: counter?.total ?? 0,
      countriesRepresented: counter?.countriesRepresented ?? 0,
      totalMembers,
      activeCircles,
      casesOpened,
      casesReachingUnderstanding: casesUnderstood,
      asOf: new Date().toISOString(),
    };
  }

  /** §13 — the single most important quality metric. */
  async fairnessGap(): Promise<{ cases: number; meanGap: number | null; worstGap: number | null }> {
    const closed = await this.prisma.case.findMany({
      where: { status: 'CLOSED' },
      select: { parties: { select: { fairnessRating: true } } },
    });

    const gaps = closed
      .map((record) => record.parties.map((party) => party.fairnessRating))
      .filter((ratings): ratings is number[] => ratings.length === 2 && ratings.every((r) => r !== null))
      .map(([a, b]) => Math.abs(a - b));

    if (gaps.length === 0) return { cases: 0, meanGap: null, worstGap: null };
    return {
      cases: gaps.length,
      meanGap: gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length,
      worstGap: Math.max(...gaps),
    };
  }

  /** Stores a point-in-time snapshot so growth can be read without live queries. */
  async snapshot(): Promise<void> {
    const stats = await this.aggregate();
    await this.prisma.statsSnapshot.create({
      data: {
        totalVoices: stats.totalVoices,
        countriesRepresented: stats.countriesRepresented,
        totalMembers: stats.totalMembers,
        activeCircles: stats.activeCircles,
        casesOpened: stats.casesOpened,
        casesReachingUnderstanding: stats.casesReachingUnderstanding,
      },
    });
  }
}
