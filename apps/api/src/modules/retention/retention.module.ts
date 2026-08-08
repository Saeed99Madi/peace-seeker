import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { StatsModule } from '../stats/stats.module';
import { DeletionWorker } from './deletion.worker';
import { RetentionWorker } from './retention.worker';

/**
 * The workers behind the retention promises in §8.
 *
 * They run in-process on a schedule, which is right for one or two instances.
 * At more, move them behind a leader lock or a job runner so a purge is not
 * attempted concurrently by every replica — the deletions are idempotent, but
 * the confirmation email is not.
 */
@Module({
  imports: [MediaModule, StatsModule],
  providers: [DeletionWorker, RetentionWorker],
})
export class RetentionModule {}
