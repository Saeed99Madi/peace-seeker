import { Module } from '@nestjs/common';
import { CirclesService } from './circles.service';
import { CommunityController } from './community.controller';
import { PostsService } from './posts.service';

/** Module C — The Community. Feature-flagged; Phase 2 in the delivery plan. */
@Module({
  controllers: [CommunityController],
  providers: [CirclesService, PostsService],
})
export class CommunityModule {}
