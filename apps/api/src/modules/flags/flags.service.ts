import { Injectable } from '@nestjs/common';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';

const CACHE_TTL_MS = 30_000;

/** E-5 — modules launch in phases behind flags. */
@Injectable()
export class FlagsService {
  private cached: FeatureFlags | null = null;
  private cachedAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  async all(): Promise<FeatureFlags> {
    if (this.cached && Date.now() - this.cachedAt < CACHE_TTL_MS) return this.cached;

    const rows = await this.prisma.featureFlag.findMany();
    const flags = { ...DEFAULT_FEATURE_FLAGS };
    for (const row of rows) {
      if (row.key in flags) flags[row.key as keyof FeatureFlags] = row.enabled;
    }
    this.cached = flags;
    this.cachedAt = Date.now();
    return flags;
  }

  async set(key: keyof FeatureFlags, enabled: boolean): Promise<FeatureFlags> {
    await this.prisma.featureFlag.upsert({
      where: { key },
      create: { key, enabled },
      update: { enabled },
    });
    this.cached = null;
    return this.all();
  }
}
