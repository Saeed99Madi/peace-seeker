'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useLocale, useTranslations } from 'next-intl';
import {
  createVoiceSchema,
  VOICE_DISPLAY_MODES,
  VOICE_LIMITS,
  type CreateVoiceInput,
  type Locale,
} from '@peace/shared';
import { CountrySelect } from './CountrySelect';
import { useVoiceSubmission } from '@/hooks/use-voice-submission';

/**
 * A-1 — the whole point is that this takes under a minute and needs no account.
 * One required field, everything else optional, and no step between the person
 * and being counted.
 */
export function VoiceForm() {
  const t = useTranslations('voice.form');
  const locale = useLocale() as Locale;
  const { submit, status, error, errorStatus } = useVoiceSubmission();
  const [email, setEmail] = useState('');

  const { control, handleSubmit, watch, formState } = useForm<CreateVoiceInput>({
    resolver: zodResolver(createVoiceSchema),
    defaultValues: { displayName: '', message: '', displayMode: 'FIRST_NAME', locale },
  });

  const message = watch('message') ?? '';

  if (status === 'done') {
    return (
      <Alert severity="success" sx={{ mt: 2 }}>
        {email ? t('successWithEmail') : t('success')}
      </Alert>
    );
  }

  // Their words are on the device and will be sent when the server is reachable
  // again — which is a success from where the person is standing, not a failure.
  if (status === 'queued') {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {t('offline')}
      </Alert>
    );
  }

  return (
    <Stack
      component="form"
      spacing={3}
      onSubmit={handleSubmit((values) => submit({ ...values, email: email || undefined }))}
      noValidate
    >
      <Typography color="text.secondary">{t('intro')}</Typography>

      <Controller
        name="displayName"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label={t('name')}
            helperText={fieldState.error ? fieldState.error.message : t('nameHelp')}
            error={Boolean(fieldState.error)}
            required
            inputProps={{ maxLength: VOICE_LIMITS.displayNameMax }}
          />
        )}
      />

      <Controller
        name="country"
        control={control}
        render={({ field }) => (
          <CountrySelect
            value={field.value ?? null}
            onChange={(code) => field.onChange(code ?? undefined)}
            label={t('country')}
            helperText={t('countryHelp')}
          />
        )}
      />

      <Controller
        name="message"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label={t('message')}
            helperText={
              fieldState.error?.message ??
              `${t('messageHelp', { max: VOICE_LIMITS.messageMax })} · ${message.length}/${VOICE_LIMITS.messageMax}`
            }
            error={Boolean(fieldState.error)}
            multiline
            minRows={3}
            inputProps={{ maxLength: VOICE_LIMITS.messageMax }}
          />
        )}
      />

      {/* A-6 — the default is first-name-only, chosen for the person rather
          than left to them to discover. */}
      <Controller
        name="displayMode"
        control={control}
        render={({ field }) => (
          <FormControl>
            <FormLabel id="display-mode">{t('displayMode.label')}</FormLabel>
            <RadioGroup {...field} aria-labelledby="display-mode">
              {VOICE_DISPLAY_MODES.map((mode) => (
                <FormControlLabel
                  key={mode}
                  value={mode}
                  control={<Radio />}
                  label={t(`displayMode.${mode}`)}
                />
              ))}
            </RadioGroup>
          </FormControl>
        )}
      />

      {/* A-9 — the address is used for one thing: the withdrawal link. */}
      <TextField
        type="email"
        label={t('email')}
        helperText={t('emailHelp')}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <Typography variant="caption" color="text.secondary">
        {t('privacyNote')}
      </Typography>

      {/* The server refused and said why. Saying nothing would leave someone
          staring at a button that appears to do nothing. */}
      {status === 'error' ? (
        <Alert severity="error">
          {errorStatus === 429 ? t('tooMany') : (error ?? t('failed'))}
        </Alert>
      ) : null}

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={formState.isSubmitting || status === 'submitting'}
      >
        {status === 'submitting' ? t('submitting') : t('submit')}
      </Button>
    </Stack>
  );
}
