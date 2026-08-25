'use client';

import { CustomizerPanelDesktop } from './CustomizerHub.desktop';
import { CustomizerPanelMobile } from './CustomizerHub.mobile';

export function CustomizerHubClient() {
  return (
    <>
      <div className="hidden md:block section-container pt-40 pb-24">
        <CustomizerPanelDesktop />
      </div>
      <div className="block md:hidden w-full px-5 pt-32 pb-20 min-h-[100dvh] flex flex-col">
        <CustomizerPanelMobile />
      </div>
    </>
  );
}
