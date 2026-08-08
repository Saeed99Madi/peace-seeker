import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createCircleSchema,
  createPostSchema,
  listPostsSchema,
  updateCircleSchema,
} from '@peace/shared';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { zodBody, ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CirclesService, type CreateCircleDto, type UpdateCircleDto } from './circles.service';
import { PostsService, type CreatePostDto, type ListPostsDto } from './posts.service';

@Controller()
export class CommunityController {
  constructor(
    private readonly circles: CirclesService,
    private readonly posts: PostsService,
  ) {}

  @Public()
  @Get('circles')
  async listCircles(@Query('type') type?: 'GEOGRAPHIC' | 'THEMATIC') {
    return { items: await this.circles.list(type) };
  }

  @Public()
  @Get('circles/:id')
  getCircle(@Param('id') id: string) {
    return this.circles.get(id);
  }

  @Post('circles')
  createCircle(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(createCircleSchema)) dto: CreateCircleDto,
  ) {
    return this.circles.create(user.id, dto);
  }

  @Patch('circles/:id')
  updateCircle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(zodBody(updateCircleSchema)) dto: UpdateCircleDto,
  ) {
    return this.circles.update(user.id, id, dto);
  }

  @Post('circles/:id/membership')
  join(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.circles.join(user.id, id);
  }

  @Delete('circles/:id/membership')
  leave(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.circles.leave(user.id, id);
  }

  /** C-2 — chronological, cursor-paged. */
  @Public()
  @Get('posts')
  listPosts(@Query(new ZodValidationPipe(listPostsSchema)) query: ListPostsDto) {
    return this.posts.list(query);
  }

  @Public()
  @Get('posts/:id/replies')
  async replies(@Param('id') id: string) {
    return { items: await this.posts.replies(id) };
  }

  @Post('posts')
  createPost(
    @CurrentUser() user: AuthenticatedUser,
    @Body(zodBody(createPostSchema)) dto: CreatePostDto,
  ) {
    return this.posts.create(user.id, dto);
  }
}
