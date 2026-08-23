'use client';

import { OfferBannerDesktop } from './offer-banner.desktop';
import { OfferBannerMobile } from './offer-banner.mobile';

export function OfferBannerClient() {
  return (
    <>
      <div className="hidden md:block">
        <OfferBannerDesktop />
      </div>
      <div className="block md:hidden">
        <OfferBannerMobile />
      </div>
    </>
  );
}
