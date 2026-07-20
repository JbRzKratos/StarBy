'use client';

import { useDevice } from '@/lib/providers/device-provider';
import { OfferBannerDesktop } from './offer-banner.desktop';
import { OfferBannerMobile } from './offer-banner.mobile';

export function OfferBannerClient() {
  const device = useDevice();
  return device === 'mobile' ? <OfferBannerMobile /> : <OfferBannerDesktop />;
}
