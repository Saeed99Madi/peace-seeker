'use client';

import { useMemo } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useLocale } from 'next-intl';
import type { Locale } from '@peace/shared';
import { countryOptions, type CountryOption } from '@/lib/countries';

interface CountrySelectProps {
  value: string | null;
  onChange: (code: string | null) => void;
  label: string;
  helperText?: string;
}

/**
 * S-3 — the only location control in the entire application, and it stops at
 * the country. There is no city field to add later, because the field it would
 * live beside does not exist.
 */
export function CountrySelect({ value, onChange, label, helperText }: CountrySelectProps) {
  const locale = useLocale() as Locale;
  const options = useMemo(() => countryOptions(locale), [locale]);
  const selected = options.find((option) => option.code === value) ?? null;

  return (
    <Autocomplete<CountryOption>
      options={options}
      value={selected}
      onChange={(_event, option) => onChange(option?.code ?? null)}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, candidate) => option.code === candidate.code}
      renderInput={(params) => <TextField {...params} label={label} helperText={helperText} />}
      autoHighlight
      openOnFocus
      // The default dropdown affordance is a 29px hit area; on a phone that is
      // a miss as often as a hit.
      sx={{
        '& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator': {
          width: 40,
          height: 40,
        },
      }}
    />
  );
}
