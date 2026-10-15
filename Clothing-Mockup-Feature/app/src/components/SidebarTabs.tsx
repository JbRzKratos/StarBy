import React from 'react';
import { SidebarDesktop, type SidebarTab, type SidebarTabsProps } from './SidebarDesktop';
import { SidebarMobile } from './SidebarMobile';

export type { SidebarTab, SidebarTabsProps };

export const SidebarTabs: React.FC<SidebarTabsProps> = (props) => {
  return (
    <>
      <SidebarDesktop {...props} />
      <SidebarMobile {...props} />
    </>
  );
};
