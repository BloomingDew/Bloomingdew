'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  BASE_CURRENCY,
  SELECTABLE_CURRENCIES,
  formatFromUsd,
  convertFromUsd,
} from '../lib/currency';

type CurrencyContextType = {
  currency: string;
  setCurrency: (code: string) => void;
  rates: Record<string, number>;
  ready: boolean;
  // True when we couldn't detect a currency and the visitor must pick one.
  needsSelection: boolean;
  dismissSelection: () => void;
  selectable: string[];
  // USD base amount -> formatted local string, e.g. 50 -> "₦80,000"
  format: (usd: number) => string;
  // USD base amount -> converted (rounded) local number
  convert: (usd: number) => number;
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const COOKIE = 'bd_currency';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [rates, setRates] = useState<Record<string, number>>({ [BASE_CURRENCY]: 1 });
  const [currency, setCurrencyState] = useState<string>(BASE_CURRENCY);
  const [ready, setReady] = useState(false);
  const [needsSelection, setNeedsSelection] = useState(false);

  useEffect(() => {
    // Currency resolution order: explicit cookie (user pick or geo, set by
    // middleware) -> otherwise prompt the picker. Never silently default to USD.
    const cookie = readCookie(COOKIE);
    if (cookie) {
      setCurrencyState(cookie);
    } else {
      setNeedsSelection(true); // geo unknown & no prior pick -> force selector
    }

    fetch('/api/rates')
      .then(r => r.json())
      .then(data => { if (data?.rates) setRates(data.rates); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    writeCookie(COOKIE, code);
    setNeedsSelection(false);
  }, []);

  const dismissSelection = useCallback(() => setNeedsSelection(false), []);

  const rateFor = (code: string) => rates[code] ?? (code === BASE_CURRENCY ? 1 : undefined);

  const format = useCallback((usd: number) => {
    const rate = rateFor(currency);
    // If we don't have a rate for the chosen currency, show USD rather than a wrong number.
    if (rate === undefined) return formatFromUsd(usd, 1, BASE_CURRENCY);
    return formatFromUsd(usd, rate, currency);
  }, [currency, rates]);

  const convert = useCallback((usd: number) => {
    const rate = rateFor(currency);
    if (rate === undefined) return convertFromUsd(usd, 1, BASE_CURRENCY);
    return convertFromUsd(usd, rate, currency);
  }, [currency, rates]);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        ready,
        needsSelection,
        dismissSelection,
        selectable: SELECTABLE_CURRENCIES,
        format,
        convert,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
