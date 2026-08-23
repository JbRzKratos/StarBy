'use client';

import { CustomizerPanelDesktop } from './CustomizerHub.desktop';
import { CustomizerPanelMobile } from './CustomizerHub.mobile';

export function CustomizerHubClient() {
  return (
    <>
      <div className="hidden md:block w-full max-w-7xl mx-auto px-8 pt-40 pb-24">
        <CustomizerPanelDesktop />
      </div>
      <div className="block md:hidden w-full px-5 pt-40 pb-24 min-h-screen flex flex-col">
        <CustomizerPanelMobile />
      </div>
    </>
  );
}
