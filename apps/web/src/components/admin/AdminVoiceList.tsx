'use client';

import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useLocale, useTranslations } from 'next-intl';
import { getDirection, isLocale, type Locale } from '@peace/shared';
import { ApiError, apiFetch } from '@/lib/api-client';
import { countryName } from '@/lib/countries';

interface AdminVoice {
  id: string;
  displayName: string;
  displayMode: string;
  country: string | null;
  message: string | null;
  locale: string | null;
  createdAt: string;
}

/**
 * The moderation view of the Wall.
 *
 * It shows the real display name even for a voice published anonymously,
 * because a moderator cannot judge what they cannot see — and it says so, so
 * nobody mistakes this screen for what the public sees. That asymmetry is the
 * reason this page is behind a role and written to the audit log (M-2).
 */
export function AdminVoiceList() {
  const t = useTranslations('admin.voices');
  const locale = useLocale() as Locale;
  const [voices, setVoices] = useState<AdminVoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const page = await apiFetch<{ items: AdminVoice[] }>('/moderation/voices?pageSize=100');
      setVoices(page.items);
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught));
      setVoices([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const takeDown = async (voice: AdminVoice) => {
    if (!window.confirm(t('confirm'))) return;
    setBusy(voice.id);
    try {
      // The same decision path the rest of moderation uses, so the audit log
      // records which rule was applied rather than "an admin deleted a row".
      await apiFetch(`/moderation/decisions/VOICE/${voice.id}`, {
        method: 'POST',
        body: { action: 'HIDE', ruleApplied: 'OTHER' },
      });
      setVoices((current) => (current ?? []).filter((v) => v.id !== voice.id));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : String(caught));
    } finally {
      setBusy(null);
    }
  };

  if (voices === null) return <CircularProgress />;

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {voices.length === 0 ? <Typography color="text.secondary">{t('empty')}</Typography> : null}

      {voices.map((voice) => {
        const shown = isLocale(voice.locale) ? voice.locale : locale;
        return (
          <Card key={voice.id}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                  {voice.message ? (
                    <Typography lang={shown} dir={getDirection(shown)} sx={{ whiteSpace: 'pre-wrap' }}>
                      {voice.message}
                    </Typography>
                  ) : null}
                  <Typography variant="caption" color="text.secondary">
                    {voice.displayName}
                    {voice.displayMode !== 'NAME' ? ` (${t('anonymous')})` : ''}
                    {voice.country ? ` · ${countryName(voice.country, locale)}` : ''}
                    {' · '}
                    {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
                      .format(new Date(voice.createdAt))}
                  </Typography>
                </Stack>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => void takeDown(voice)}
                  disabled={busy === voice.id}
                >
                  {busy === voice.id ? t('removing') : t('remove')}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
