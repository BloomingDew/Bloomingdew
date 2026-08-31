'use client';

import { useEffect, useState } from 'react';

/**
 * Fetches the anti-bot token the enquiry endpoint requires. Include the
 * returned value as `formToken` in the POST body, and render an off-screen
 * `website` input (the honeypot) that stays empty for humans.
 */
export function useFormToken(): string {
  const [token, setToken] = useState('');
  useEffect(() => {
    fetch('/api/enquiry')
      .then(r => r.json())
      .then(d => { if (d?.token) setToken(d.token); })
      .catch(() => {});
  }, []);
  return token;
}

/** Props for the honeypot input — visually gone, present to bots. */
export const honeypotProps = {
  name: 'website',
  tabIndex: -1,
  autoComplete: 'off',
  'aria-hidden': true,
  style: { position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 },
} as const;
