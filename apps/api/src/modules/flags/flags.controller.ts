import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import type { FeatureFlags } from '@peace/shared';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { FlagsService } from './flags.service';

@Controller('flags')
export class FlagsController {
  constructor(private readonly flags: FlagsService) {}

  /** Public: the web app needs to know which modules to render. */
  @Public()
  @Get()
  all() {
    return this.flags.all();
  }

  @Roles('ADMINISTRATOR')
  @Put(':key')
  set(@Param('key') key: keyof FeatureFlags, @Body('enabled') enabled: boolean) {
    return this.flags.set(key, Boolean(enabled));
  }
}
