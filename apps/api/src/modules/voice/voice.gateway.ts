import { Logger, OnModuleDestroy } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { WebSocket } from 'ws';
import { RedisService } from '../../redis/redis.service';
import {
  VOICE_ARRIVED_CHANNEL,
  VOICE_COUNT_CHANNEL,
  VoiceCounterService,
} from './voice-counter.service';

/**
 * A-4 — the global count, live.
 *
 * Watching the number rise as someone, somewhere, chooses peace is the one
 * piece of motion this platform has any business showing (§3.2 rules out the
 * rest). The socket carries the count and the public form of an arriving voice,
 * and nothing else: no per-group figure, ever — a live feed is the easiest
 * place to leak the breakdown §3.1 forbids.
 *
 * Read-only by design: nothing a client sends is parsed, so the socket cannot
 * be used to write, to subscribe to anything narrower, or to ask a question.
 *
 * Broadcast goes through Redis pub/sub, so a Voice added on one instance reaches
 * readers connected to any other — and so the counter never has to know that
 * anything is listening. If Redis is unreachable the number simply stops moving
 * until the page is reloaded, which is the right way for this to fail.
 */

/**
 * Both proxies in front of this (Cloudflare, then Railway) close a WebSocket
 * that has been idle for around a hundred seconds, and they close it without
 * telling either end. A counter that only speaks when a voice arrives is idle
 * almost always, so without this the connection is reaped within two minutes:
 * the reader's number freezes with no close event to react to, and this process
 * keeps the dead socket in its set forever. The interval is the fix on both
 * sides — it keeps the connection warm, and it is how each end finds out the
 * other is gone.
 */
const HEARTBEAT_MS = 25_000;

/** A slow reader should not be allowed to grow the send buffer without bound. */
const MAX_BUFFERED_BYTES = 512 * 1024;

@WebSocketGateway({ path: '/live' })
export class VoiceGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly logger = new Logger(VoiceGateway.name);
  private readonly clients = new Set<WebSocket>();
  private readonly alive = new WeakSet<WebSocket>();
  private heartbeat?: ReturnType<typeof setInterval>;

  constructor(
    private readonly counter: VoiceCounterService,
    private readonly redis: RedisService,
  ) {}

  afterInit(): void {
    this.listen();
    this.heartbeat = setInterval(() => this.sweep(), HEARTBEAT_MS);
    // Nothing should be kept alive by this timer at shutdown.
    this.heartbeat.unref?.();
    this.logger.log('Live voice counter listening on /live');
  }

  onModuleDestroy(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    for (const client of this.clients) client.close(1001, 'server shutting down');
    this.clients.clear();
  }

  private listen(): void {
    const subscriber = this.redis.subscriber();
    if (!subscriber) {
      this.logger.warn('Redis unavailable: the live counter will not update across instances');
      return;
    }
    // A live counter is a nicety; the API must start without it. Every failure
    // here is logged and swallowed rather than allowed to abort boot.
    const subscribe = () =>
      subscriber
        .subscribe(VOICE_COUNT_CHANNEL, VOICE_ARRIVED_CHANNEL)
        .catch((error: Error) => this.logger.warn(`Live counter not subscribed: ${error.message}`));

    void subscribe();
    // Re-subscribe after a reconnect: ioredis restores subscriptions itself,
    // but this is cheap and covers the case where it connected for the first
    // time only after the call above had already failed.
    subscriber.on('ready', subscribe);
    subscriber.on('message', (channel, payload) => {
      if (channel === VOICE_COUNT_CHANNEL) this.fanOut(`{"type":"count","data":${payload}}`);
      if (channel === VOICE_ARRIVED_CHANNEL) this.fanOut(`{"type":"voice","data":${payload}}`);
    });
  }

  async handleConnection(client: WebSocket): Promise<void> {
    this.clients.add(client);
    this.alive.add(client);
    client.on('pong', () => this.alive.add(client));
    // Send the current figure immediately: the page may have been served from a
    // CDN cache minutes ago and is showing a number that has since moved.
    this.send(client, JSON.stringify({ type: 'count', data: await this.counter.get() }));
  }

  handleDisconnect(client: WebSocket): void {
    this.clients.delete(client);
  }

  /**
   * One pass of the heartbeat: drop the connections that did not answer the
   * last one, then ping the rest.
   *
   * The application-level frame is not redundant with the protocol ping. A
   * browser answers a protocol ping itself, which tells *this* end the client
   * is alive but tells the *client* nothing — a page whose connection was
   * silently reaped would sit there believing it is still connected. The frame
   * is what its watchdog listens for.
   */
  private sweep(): void {
    for (const client of this.clients) {
      if (!this.alive.has(client)) {
        this.clients.delete(client);
        client.terminate();
        continue;
      }
      this.alive.delete(client);
      try {
        client.ping();
      } catch {
        this.clients.delete(client);
      }
    }
    this.fanOut('{"type":"ping"}');
  }

  private fanOut(payload: string): void {
    for (const client of this.clients) this.send(client, payload);
  }

  private send(client: WebSocket, payload: string): void {
    // readyState, because ws reports a send on a closing socket through the
    // callback rather than by throwing — a try/catch alone never fires, and the
    // dead client stays in the set.
    if (client.readyState !== client.OPEN) {
      this.clients.delete(client);
      return;
    }
    if (client.bufferedAmount > MAX_BUFFERED_BYTES) {
      this.clients.delete(client);
      client.terminate();
      return;
    }
    client.send(payload, (error) => {
      if (!error) return;
      this.clients.delete(client);
      client.terminate();
    });
  }
}
