import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  /** E-3 — aggregate only, and only for the Foundation. */
  @Roles('ADMINISTRATOR')
  @Get()
  aggregate() {
    return this.stats.aggregate();
  }

  @Roles('ADMINISTRATOR')
  @Get('fairness-gap')
  fairnessGap() {
    return this.stats.fairnessGap();
  }
}
