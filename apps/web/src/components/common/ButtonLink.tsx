'use client';

import Button, { type ButtonProps } from '@mui/material/Button';
import MuiLink, { type LinkProps as MuiLinkProps } from '@mui/material/Link';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';

/**
 * Locale-aware links rendered as MUI controls.
 *
 * These wrappers exist because MUI's `component` prop takes a component, and a
 * component cannot cross the server/client boundary as a prop. Keeping the
 * pairing here means pages stay server-rendered — which is what makes the
 * public pages static and cacheable (§7).
 *
 * The prop surface is a deliberate short list rather than the full polymorphic
 * ButtonProps: everything a page here actually needs, and nothing that would
 * let a caller reach around the wrapper.
 */
interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  color?: ButtonProps['color'];
  fullWidth?: boolean;
  sx?: ButtonProps['sx'];
}

export function ButtonLink({ href, children, ...props }: ButtonLinkProps) {
  return (
    <Button component={Link} href={href} {...props}>
      {children}
    </Button>
  );
}

interface TextLinkProps {
  href: string;
  children: ReactNode;
  variant?: MuiLinkProps['variant'];
  color?: MuiLinkProps['color'];
  sx?: MuiLinkProps['sx'];
}

export function TextLink({ href, children, ...props }: TextLinkProps) {
  return (
    <MuiLink component={Link} href={href} {...props}>
      {children}
    </MuiLink>
  );
}
