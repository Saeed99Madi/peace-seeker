import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MagicLinkService } from './magic-link.service';
import { SessionService } from './session.service';

/**
 * Global because SessionGuard is registered application-wide and needs
 * SessionService on every route.
 */
@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, MagicLinkService, SessionService],
  // MagicLinkService is exported so RetentionWorker can purge expired tokens.
  exports: [AuthService, SessionService, MagicLinkService],
})
export class AuthModule {}
