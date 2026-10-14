import { useCallback } from 'react';
import { useCurrencyStore } from '@/lib/stores/currency-store';

const exchangeRates: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
};

const currencySymbols: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function usePrice() {
  const currency = useCurrencyStore((s) => s.currency);

  const rate = exchangeRates[currency] || 1;
  const symbol = currencySymbols[currency] || '₹';

  // Stable reference: only changes when currency changes, preventing
  // unnecessary child re-renders when formatPrice is passed as a prop.
  const formatPrice = useCallback(
    (amountInINR: number) => {
      const converted = amountInINR * rate;
      const formatted =
        currency === 'INR' ? Math.round(converted).toLocaleString('en-IN') : converted.toFixed(2);
      return `${symbol}${formatted}`;
    },
    [currency, rate, symbol],
  );

  return { formatPrice };
}

