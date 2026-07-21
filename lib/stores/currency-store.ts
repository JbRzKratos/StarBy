import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

interface CurrencyState {
  currency: CurrencyCode;
}

interface CurrencyActions {
  setCurrency: (currency: CurrencyCode) => void;
}

export const useCurrencyStore = create<CurrencyState & CurrencyActions>()(
  devtools(
    persist(
      (set) => ({
        currency: 'INR',
        setCurrency: (currency) => set({ currency }),
      }),
      { name: 'starby-currency' },
    ),
    { name: 'CurrencyStore' },
  ),
);
