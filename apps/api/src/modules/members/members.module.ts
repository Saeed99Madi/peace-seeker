import { Module } from '@nestjs/common';
import { DirectoryService } from './directory.service';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  controllers: [MembersController],
  providers: [MembersService, DirectoryService],
  exports: [MembersService],
})
export class MembersModule {}
