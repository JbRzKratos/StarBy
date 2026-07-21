export const getOfferMessages = (formatPrice: (price: number) => string) => [
  `FREE SHIPPING OVER ${formatPrice(999)}`,
  'FLAT 20% OFF YOUR FIRST CUSTOM DESIGN',
  'NEW: SPLIT-PANEL WALL ART',
  'DESIGN IT YOURSELF — UPLOAD ANY PHOTO',
];

export const getOfferString = (formatPrice: (price: number) => string) =>
  getOfferMessages(formatPrice).join(' ✦ ') + ' ✦ ';
