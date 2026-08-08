import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  deleteAccountSchema,
  hidePresenceSchema,
  memberSearchSchema,
  updateProfileSchema,
} from '@peace/shared';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { zodBody, ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { DirectoryService } from './directory.service';
import { MembersService, type UpdateProfileDto } from './members.service';

@Controller('members')
export class MembersController {
  constructor(
    private readonly members: MembersService,
    private readonly directory: DirectoryService,
  ) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.members.me(user.id);
  }

  @Patch('me')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(updateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return this.members.updateProfile(user.id, dto);
  }

  /** S-10 — the switch a member may need in a hurry. */
  @Post('me/presence')
  async presence(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(hidePresenceSchema)) dto: { hidden: boolean },
  ) {
    await this.members.setPresenceHidden(user.id, dto.hidden);
    return { hidden: dto.hidden };
  }

  /** S-5 — self-service, immediate, complete. */
  @Post('me/deletion')
  deletion(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(deleteAccountSchema)) dto: { voiceHandling: 'ANONYMISE' | 'REMOVE' },
  ) {
    return this.members.requestDeletion(user.id, dto.voiceHandling);
  }

  /** B-6 — language and skill only. */
  @Get()
  search(
    @Query(new ZodValidationPipe(memberSearchSchema))
    query: { language?: string; skill?: string; page: number; pageSize: number },
  ) {
    return this.directory.search(query);
  }

  @Get('skills')
  async skills() {
    return { items: await this.directory.knownSkills() };
  }

  @Public()
  @Get(':id')
  profile(@Param('id') id: string, @CurrentUser() viewer?: AuthenticatedUser) {
    return this.members.profile(id, viewer);
  }
}
