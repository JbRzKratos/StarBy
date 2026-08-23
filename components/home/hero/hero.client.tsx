'use client';

import { HeroDesktop } from './hero.desktop';
import { HeroMobile } from './hero.mobile';

export function HeroClient() {
  return (
    <>
      <div className="hidden md:block">
        <HeroDesktop />
      </div>
      <div className="block md:hidden">
        <HeroMobile />
      </div>
    </>
  );
}
