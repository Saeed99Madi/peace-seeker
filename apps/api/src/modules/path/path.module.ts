import { Module } from '@nestjs/common';
import { CaseInvitesService } from './case-invites.service';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { ScopeRoutingService } from './scope-routing.service';
import { StatementsService } from './statements.service';
import { SymmetryService } from './symmetry.service';

/** Module D — The Path. Feature-flagged; Phase 3 in the delivery plan. */
@Module({
  controllers: [CasesController],
  providers: [
    CasesService,
    CaseInvitesService,
    StatementsService,
    SymmetryService,
    ScopeRoutingService,
  ],
})
export class PathModule {}
