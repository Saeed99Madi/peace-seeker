import { PrismaClient } from '@prisma/client';
import { createHmac } from 'node:crypto';

/**
 * Grants a role to an existing member. Run from a terminal, never over HTTP:
 *
 *   npm run grant:role --workspace @peace/api -- you@example.org ADMINISTRATOR
 *
 * There is deliberately no endpoint for this. An HTTP route that can make
 * someone an administrator is the single most valuable target on the platform,
 * and the first administrator has to come from somewhere the network cannot
 * reach. Every later grant is then made through the panel by someone who is
 * already trusted, and recorded in the audit log.
 */
const ROLES = ['MEMBER', 'CIRCLE_STEWARD', 'FACILITATOR', 'MODERATOR', 'ADMINISTRATOR'] as const;
type Role = (typeof ROLES)[number];

async function main(): Promise<void> {
  const [email, role] = process.argv.slice(2);

  if (!email || !role) {
    console.error('Usage: grant:role -- <email> <ROLE>');
    console.error(`Roles: ${ROLES.join(', ')}`);
    process.exit(1);
  }
  if (!ROLES.includes(role as Role)) {
    console.error(`"${role}" is not a role. Choose one of: ${ROLES.join(', ')}`);
    process.exit(1);
  }

  const pepper = process.env.EMAIL_HASH_PEPPER;
  if (!pepper) {
    console.error('EMAIL_HASH_PEPPER is not set — cannot look the member up.');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    // Lookups go through the peppered hash, the same way the API does it (S-1).
    const emailHash = createHmac('sha256', pepper).update(email.trim().toLowerCase()).digest('hex');
    const user = await prisma.user.findUnique({
      where: { emailHash },
      select: { id: true, displayName: true, roles: true },
    });

    if (!user) {
      console.error(`No member with that address. They must join at /join first.`);
      process.exit(1);
    }
    if (user.roles.includes(role as Role)) {
      console.log(`${user.displayName} already has ${role}.`);
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { roles: { set: [...user.roles, role as Role] } },
    });
    // §7 Audit — a role grant is an administrative action like any other.
    await prisma.auditLog.create({
      data: {
        action: 'role.granted',
        target: `user:${user.id}`,
        metadata: { role, grantedBy: 'cli' },
      },
    });

    console.log(`${user.displayName} is now ${[...user.roles, role].join(', ')}.`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
