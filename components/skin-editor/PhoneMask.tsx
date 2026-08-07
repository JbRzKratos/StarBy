'use client';

import React from 'react';
import type { PhoneTemplate } from '@/hooks/usePhoneTemplate';

interface PhoneMaskProps {
  template: PhoneTemplate;
}

/**
 * PhoneMask — Declares the SVG <clipPath> that clips artwork to the device body.
 * Must be rendered inside <defs>.
 */
export function PhoneMaskDefs({ template }: PhoneMaskProps) {
  const { clipId, bodyPath } = template;

  return (
    <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
      <path d={bodyPath} />
    </clipPath>
  );
}
