import React from 'react';
import { HeaderDesktop, type HeaderProps } from './HeaderDesktop';
import { HeaderMobile } from './HeaderMobile';

export type { HeaderProps };

export const Header: React.FC<HeaderProps> = (props) => {
  return (
    <>
      <HeaderDesktop {...props} />
      <HeaderMobile {...props} />
    </>
  );
};
