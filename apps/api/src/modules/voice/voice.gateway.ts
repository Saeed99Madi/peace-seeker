import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { WebSocket } from 'ws';
import { RedisService } from '../../redis/redis.service';
import { VOICE_COUNT_CHANNEL, VoiceCounterService } from './voice-counter.service';

/**
 * A-4 — the global count, live.
 *
 * Watching the number rise as someone, somewhere, chooses peace is the one
 * piece of motion this platform has any business showing (§3.2 rules out the
 * rest). It is also the only thing sent: this socket emits `{ total,
 * countriesRepresented }` and nothing else. No message text, no country of the
 * arriving voice, no per-group figure — a live feed would otherwise be the
 * easiest place to leak the breakdown §3.1 forbids.
 *
 * Read-only by design: nothing a client sends is parsed, so the socket cannot
 * be used to write, subscribe to anything narrower, or ask a question.
 *
 * Broadcast goes through Redis pub/sub, so a Voice added on one instance reaches
 * readers connected to any other — and so the counter never has to know that
 * anything is listening. If Redis is unreachable the number simply stops moving
 * until the page is reloaded, which is the right way for this to fail.
 */
@WebSocketGateway({ path: '/live' })
export class VoiceGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(VoiceGateway.name);
  private readonly clients = new Set<WebSocket>();

  constructor(
    private readonly counter: VoiceCounterService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit(): void {
    const subscriber = this.redis.subscriber();
    if (!subscriber) {
      this.logger.warn('Redis unavailable: the live counter will not update across instances');
      return;
    }
    // A live counter is a nicety; the API must start without it. Every failure
    // here is logged and swallowed rather than allowed to abort boot.
    const listen = () =>
      subscriber
        .subscribe(VOICE_COUNT_CHANNEL)
        .catch((error: Error) => this.logger.warn(`Live counter not subscribed: ${error.message}`));

    void listen();
    subscriber.on('ready', listen);
    subscriber.on('message', (channel, payload) => {
      if (channel === VOICE_COUNT_CHANNEL) this.fanOut(payload);
    });
  }

  afterInit(): void {
    this.logger.log('Live voice counter listening on /live');
  }

  async handleConnection(client: WebSocket): Promise<void> {
    this.clients.add(client);
    // Send the current figure immediately; the page may have been served from a
    // CDN cache minutes ago and is showing a number that has since moved.
    try {
      client.send(JSON.stringify(await this.counter.get()));
    } catch {
      this.clients.delete(client);
    }
  }

  handleDisconnect(client: WebSocket): void {
    this.clients.delete(client);
  }

  private fanOut(payload: string): void {
    for (const client of this.clients) {
      try {
        client.send(payload);
      } catch {
        this.clients.delete(client);
      }
    }
  }
}
