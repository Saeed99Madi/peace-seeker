import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  openCaseSchema,
  publicationConsentSchema,
  respondToInviteSchema,
  submitStatementSchema,
  withdrawCaseSchema,
  type CaseStage,
} from '@peace/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { zodBody } from '../../common/pipes/zod-validation.pipe';
import { CaseInvitesService, type InviteResponseDto } from './case-invites.service';
import { CasesService, type OpenCaseDto } from './cases.service';
import { StatementsService } from './statements.service';

@Controller('path/cases')
export class CasesController {
  constructor(
    private readonly cases: CasesService,
    private readonly invites: CaseInvitesService,
    private readonly statements: StatementsService,
  ) {}

  @Post()
  open(@CurrentUser() user: AuthenticatedUser, @Body(zodBody(openCaseSchema)) dto: OpenCaseDto) {
    return this.cases.open(user.id, dto);
  }

  /** D-1 — the invited party consents (or declines) before anything proceeds. */
  @Post('invitations/respond')
  respond(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(respondToInviteSchema)) dto: InviteResponseDto,
  ) {
    return this.invites.respond(user.id, dto);
  }

  @Get(':id')
  view(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    return this.statements.view(user.id, id, request.displaySeed ?? 'case');
  }

  @Post(':id/statements')
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(zodBody(submitStatementSchema)) dto: { stage: CaseStage; body: string },
  ) {
    return this.statements.submit(user.id, id, dto.stage, dto.body);
  }

  @Post(':id/withdraw')
  withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(zodBody(withdrawCaseSchema)) _dto: { confirmation: 'WITHDRAW' },
  ) {
    return this.cases.withdraw(user.id, id);
  }

  /** D-6 — each party answers for themselves; publication needs both. */
  @Post(':id/publication-consent')
  publication(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(zodBody(publicationConsentSchema)) dto: { consent: boolean },
  ) {
    return this.cases.setPublicationConsent(user.id, id, dto.consent);
  }

  /** §13 — the same question, asked identically of both parties. */
  @Post(':id/fairness')
  fairness(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('rating') rating: number,
  ) {
    return this.cases.rateFairness(user.id, id, Number(rating));
  }

  /**
   * D-5 — the facilitator guides and releases; they cannot decide. There is no
   * endpoint on this controller that lets a facilitator rule for either party.
   */
  @Roles('FACILITATOR', 'ADMINISTRATOR')
  @Post(':id/stages/:stage/release')
  release(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('stage') stage: CaseStage,
  ) {
    return this.statements.release(user.id, id, stage);
  }

  @Roles('FACILITATOR', 'ADMINISTRATOR')
  @Post(':id/advance')
  advance(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.statements.advance(user.id, id);
  }
}
