import { PrismaClient } from '@prisma/client';
import { DEFAULT_FEATURE_FLAGS } from '@peace/shared';

const prisma = new PrismaClient();

/**
 * Seeds only what the platform needs to run: the singleton counter, the phase
 * flags, and the charter's thematic circles (C-1). No sample voices and no
 * sample members — a fabricated voice for peace is a contradiction in terms.
 */
async function main(): Promise<void> {
  await prisma.voiceCounter.upsert({
    where: { id: 1 },
    create: { id: 1, total: 0, countriesRepresented: 0 },
    update: {},
  });

  for (const [key, enabled] of Object.entries(DEFAULT_FEATURE_FLAGS)) {
    await prisma.featureFlag.upsert({ where: { key }, create: { key, enabled }, update: {} });
  }

  // C-4 names these themes; the circles mirror them so the Library and the
  // community are organised around the same ideas as the charter.
  const themes: Array<{ name: string; description: string }> = [
    {
      name: 'Religion and science',
      description:
        'On the charter statement that religion and science complete one another: reading, discussion, and the people working at that meeting point.',
    },
    {
      name: 'Education',
      description:
        'Teachers, students and parents building peace where it is most durable — in what the next generation learns.',
    },
    {
      name: 'Health',
      description:
        'Medicine across every line. Practitioners offering care and knowledge without asking which side anyone is from.',
    },
    {
      name: 'Youth',
      description: 'For those who will live longest with whatever is decided now.',
    },
    {
      name: 'Media',
      description:
        'Telling the story of a conflict without making either party into an enemy. Craft, ethics, and practice.',
    },
  ];

  for (const theme of themes) {
    const existing = await prisma.circle.findFirst({ where: { name: theme.name } });
    if (!existing) {
      await prisma.circle.create({
        data: { name: theme.name, type: 'THEMATIC', description: theme.description },
      });
    }
  }

  console.log('Seed complete: counter, feature flags, and thematic circles.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
