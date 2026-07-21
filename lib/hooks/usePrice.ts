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

  const formatPrice = (amountInINR: number) => {
    const converted = amountInINR * rate;
    const formatted =
      currency === 'INR' ? Math.round(converted).toLocaleString('en-IN') : converted.toFixed(2);
    return `${symbol}${formatted}`;
  };

  return { formatPrice };
}
