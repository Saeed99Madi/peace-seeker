import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { CHARTER_VERSION, DEFAULT_LOCALE, type Locale } from '@peace/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { keyedHash } from '../../common/utils/hash.util';
import { MagicLinkService } from './magic-link.service';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly magicLinks: MagicLinkService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  private emailHash(email: string): string {
    return keyedHash(email, this.config.get<string>('emailHashPepper') ?? '');
  }

  /**
   * B-1 / B-4 — registration is: introduce yourself, and affirm the vision.
   * Nothing about who you are, where you come from, or what you believe.
   *
   * §3.3 — an address that is already registered gets the same answer as one
   * that is not, and a sign-in link instead of a new account. Replying "an
   * account already exists" would turn this endpoint into a membership oracle:
   * anyone could test a colleague's or a neighbour's address and learn that
   * they take part in cross-conflict peace work. That is precisely the
   * disclosure the magic-link endpoint already refuses to make, and the two
   * have to agree or the careful one is pointless.
   */
  async register(dto: RegisterDto): Promise<void> {
    const emailHash = this.emailHash(dto.email);
    const existing = await this.prisma.user.findUnique({
      where: { emailHash },
      select: { id: true, status: true },
    });

    if (existing) {
      if (existing.status === 'ACTIVE' || existing.status === 'HIDDEN') {
        await this.magicLinks.issue(existing.id, dto.email, dto.locale ?? DEFAULT_LOCALE);
      }
      return;
    }

    const now = new Date();
    const user = await this.prisma.user.create({
      data: {
        displayName: dto.displayName,
        email: dto.email,
        emailHash,
        introduction: dto.introduction,
        locale: dto.locale ?? DEFAULT_LOCALE,
        charterVersion: CHARTER_VERSION,
        charterAffirmedAt: now,
        codeAffirmedAt: now,
        credential: dto.password
          ? { create: { passwordHash: await argon2.hash(dto.password, { type: argon2.argon2id }) } }
          : undefined,
      },
      select: { id: true },
    });

    await this.audit.record({
      actorId: user.id,
      action: 'member.registered',
      target: `user:${user.id}`,
      metadata: { charterVersion: CHARTER_VERSION },
    });

    await this.magicLinks.issue(user.id, dto.email, dto.locale ?? DEFAULT_LOCALE);
  }

  /**
   * Always resolves, whether or not the address is known. Confirming that an
   * address is registered would let anyone test whether a named person is a
   * member of this platform — in some places that alone is dangerous (§3.3).
   */
  async requestMagicLink(email: string, locale: Locale = DEFAULT_LOCALE): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { emailHash: this.emailHash(email) },
      select: { id: true, status: true },
    });
    if (!user || user.status === 'SUSPENDED' || user.status === 'DELETION_PENDING') return;
    await this.magicLinks.issue(user.id, email, locale);
  }

  async loginWithPassword(email: string, password: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { emailHash: this.emailHash(email) },
      include: { credential: true },
    });
    const invalid = new UnauthorizedException('Those details did not match an account.');
    if (!user?.credential || user.status !== 'ACTIVE') throw invalid;
    if (!(await argon2.verify(user.credential.passwordHash, password))) throw invalid;
    return user.id;
  }

  async consumeMagicLink(token: string): Promise<string> {
    const userId = await this.magicLinks.consume(token);
    if (!userId) throw new UnauthorizedException('This link has expired or has already been used.');
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
    return userId;
  }

  async setPassword(userId: string, password: string): Promise<void> {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await this.prisma.authCredential.upsert({
      where: { userId },
      create: { userId, passwordHash },
      update: { passwordHash },
    });
  }
}
