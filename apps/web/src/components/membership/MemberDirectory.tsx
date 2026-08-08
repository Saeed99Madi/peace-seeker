'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale, Paginated, PublicMember } from '@peace/shared';
import { ApiError, apiFetch } from '@/lib/api-client';
import { countryName } from '@/lib/countries';

/**
 * B-6 — two filters exist: language, and what a person can offer. There is no
 * country filter and no identity filter, and this component is the only place
 * a directory query is built, so one cannot be slipped in elsewhere.
 */
export function MemberDirectory() {
  const t = useTranslations('membership.directory');
  const locale = useLocale() as Locale;
  const [language, setLanguage] = useState('');
  const [skill, setSkill] = useState('');
  const [members, setMembers] = useState<PublicMember[]>([]);
  // B-5 — profiles default to members-only, so a visitor legitimately sees
  // nothing here. Reporting that as "no members match your search" would be a
  // lie about the data rather than an explanation of the rule.
  const [needsSignIn, setNeedsSignIn] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams();
    if (language) query.set('language', language);
    if (skill) query.set('skill', skill);

    const timer = setTimeout(() => {
      apiFetch<Paginated<PublicMember>>(`/members?${query}`, { signal: controller.signal })
        .then((page) => {
          setNeedsSignIn(false);
          setMembers(page.items);
        })
        .catch((error: unknown) => {
          setMembers([]);
          setNeedsSignIn(error instanceof ApiError && (error.status === 401 || error.status === 403));
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [language, skill]);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label={t('language')}
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        />
        <TextField
          label={t('skill')}
          value={skill}
          onChange={(event) => setSkill(event.target.value)}
        />
      </Stack>

      {members.length === 0 ? (
        <Typography color="text.secondary">
          {needsSignIn ? t('signInRequired') : t('empty')}
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          }}
        >
          {members.map((member) => (
            <Card key={member.id} component="article">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h6" component="h2">
                    {member.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.introduction?.slice(0, 180)}
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {member.skills.map((offered) => (
                      <Chip key={offered} size="small" label={offered} />
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {countryName(member.country, locale)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  );
}
