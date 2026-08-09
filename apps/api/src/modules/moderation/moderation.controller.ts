import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { ReportTargetType } from '@prisma/client';
import {
  appealSchema,
  createReportSchema,
  moderationDecisionSchema,
  moderationQueueQuerySchema,
} from '@peace/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { zodBody, ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AppealsService } from './appeals.service';
import { ModerationService, type CreateReportDto, type DecisionDto } from './moderation.service';

@Controller('moderation')
export class ModerationController {
  constructor(
    private readonly moderation: ModerationService,
    private readonly appeals: AppealsService,
  ) {}

  /** Any member may report; reporting is not a privilege. */
  @Post('reports')
  report(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(createReportSchema)) dto: CreateReportDto,
  ) {
    return this.moderation.report(dto, user.id);
  }

  @Roles('MODERATOR', 'ADMINISTRATOR')
  @Get('queue')
  async queue(
    @Query(new ZodValidationPipe(moderationQueueQuerySchema))
    query: { queue: 'VOICES' | 'MEDIA' | 'REPORTS' | 'STORIES'; page: number; pageSize: number },
  ) {
    return { items: await this.moderation.queue(query.queue, query.page, query.pageSize) };
  }

  /** Everything currently on the Wall, so it can be acted on. */
  @Roles('MODERATOR', 'ADMINISTRATOR')
  @Get('voices')
  publishedVoices(@Query('page') page = '1', @Query('pageSize') pageSize = '25') {
    return this.moderation.publishedVoices(
      Math.max(Number(page) || 1, 1),
      Math.min(Math.max(Number(pageSize) || 25, 1), 100),
    );
  }

  @Roles('MODERATOR', 'ADMINISTRATOR')
  @Post('decisions/:targetType/:targetId')
  decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('targetType') targetType: ReportTargetType,
    @Param('targetId') targetId: string,
    @Body(zodBody(moderationDecisionSchema)) dto: DecisionDto,
    @Query('reportId') reportId?: string,
  ) {
    return this.moderation.decide(user.id, targetType, targetId, dto, reportId);
  }

  /** M-3 — open to every member, against any decision. */
  @Post('appeals')
  appeal(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(appealSchema)) dto: { decisionId: string; argument: string },
  ) {
    return this.appeals.open(dto.decisionId, dto.argument, user.id);
  }

  @Roles('MODERATOR', 'ADMINISTRATOR')
  @Get('appeals')
  async listAppeals(@Query('status') status = 'OPEN') {
    return { items: await this.appeals.list(status) };
  }

  @Roles('ADMINISTRATOR')
  @Post('appeals/:id/resolve')
  resolveAppeal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('upheld') upheld: boolean,
    @Body('outcome') outcome: string,
  ) {
    return this.appeals.resolve(id, user.id, Boolean(upheld), outcome ?? '');
  }
}
