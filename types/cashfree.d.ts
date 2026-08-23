declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeInitOptions {
    mode: 'sandbox' | 'production';
  }

  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_modal' | '_blank';
  }

  export interface CashfreeInstance {
    checkout: (options: CashfreeCheckoutOptions) => Promise<unknown>;
  }

  export function load(options: CashfreeInitOptions): Promise<CashfreeInstance>;
}
