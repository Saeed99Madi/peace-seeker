'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MuiLink from '@mui/material/Link';
import { useLocale, useTranslations } from 'next-intl';
import { MEMBER_LIMITS, registerSchema, type Locale, type RegisterInput } from '@peace/shared';
import { Link } from '@/i18n/navigation';
import { useSubmit } from '@/hooks/use-submit';

/**
 * B-1/B-4 — the whole of membership: a name, a way to reach you, an
 * introduction in your own words, and your affirmation of the vision.
 */
export function JoinForm() {
  const t = useTranslations('membership.join');
  const locale = useLocale() as Locale;
  const { run, status, error } = useSubmit('/auth/register');

  const { control, handleSubmit, watch } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', introduction: '', locale },
  });

  const introduction = watch('introduction') ?? '';

  if (status === 'done') return <Alert severity="success">{t('success')}</Alert>;

  return (
    <Stack component="form" spacing={3} onSubmit={handleSubmit((values) => run(values))} noValidate>
      <Typography color="text.secondary">{t('intro')}</Typography>

      <Controller
        name="displayName"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label={t('name')}
            helperText={fieldState.error?.message ?? t('nameHelp')}
            error={Boolean(fieldState.error)}
            required
          />
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            type="email"
            label={t('email')}
            helperText={fieldState.error?.message ?? t('emailHelp')}
            error={Boolean(fieldState.error)}
            required
          />
        )}
      />

      <Controller
        name="introduction"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label={t('introduction')}
            helperText={
              fieldState.error?.message ??
              `${t('introductionHelp', { min: MEMBER_LIMITS.introductionMin, max: MEMBER_LIMITS.introductionMax })} · ${t('introductionCount', { count: introduction.length, min: MEMBER_LIMITS.introductionMin })}`
            }
            error={Boolean(fieldState.error)}
            multiline
            minRows={6}
            required
            inputProps={{ maxLength: MEMBER_LIMITS.introductionMax }}
          />
        )}
      />

      {/* B-3 — the absence of identity fields is stated, not left to be noticed. */}
      <Alert severity="info" icon={false}>
        <Typography variant="subtitle2">{t('notAsked.title')}</Typography>
        <Typography variant="body2">{t('notAsked.body')}</Typography>
      </Alert>

      <Stack>
        <Controller
          name="charterAffirmed"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox checked={Boolean(field.value)} onChange={field.onChange} />}
              label={t('charter.affirm')}
            />
          )}
        />
        <MuiLink component={Link} href="/charter" variant="body2">
          {t('charter.read')}
        </MuiLink>
        <Controller
          name="codeOfConductAffirmed"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Checkbox checked={Boolean(field.value)} onChange={field.onChange} />}
              label={t('charter.conduct')}
            />
          )}
        />
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Button type="submit" variant="contained" size="large" disabled={status === 'working'}>
        {t('submit')}
      </Button>
    </Stack>
  );
}
