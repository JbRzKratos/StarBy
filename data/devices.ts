export interface DeviceModel {
  id: string;
  name: string;
  type: 'mobile' | 'laptop';
  aspectRatio: number; // width / height
  borderRadius: number; // percentage of width (e.g., 0.1 for 10%)
  cameraCutout?: {
    x: number; // percentage of device width
    y: number; // percentage of device height
    width: number; // percentage of device width
    height: number; // percentage of device height
    borderRadius: number; // percentage of cutout width
  };
  logoCutout?: {
    x: number; // percentage of device width
    y: number; // percentage of device height
    width: number; // percentage of device width
    height: number; // percentage of device height
  };
}

export const deviceModels: DeviceModel[] = [
  // APPLE MOBILE
  {
    id: 'iphone-16-pro-max',
    name: 'iPhone 16 Pro Max',
    type: 'mobile',
    aspectRatio: 9 / 19.5,
    borderRadius: 0.16,
    cameraCutout: { x: 0.06, y: 0.03, width: 0.42, height: 0.42 * (9/19.5), borderRadius: 0.25 },
  },
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    type: 'mobile',
    aspectRatio: 9 / 19.5,
    borderRadius: 0.16,
    cameraCutout: { x: 0.06, y: 0.03, width: 0.45, height: 0.45 * (9/19.5), borderRadius: 0.25 },
  },
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    type: 'mobile',
    aspectRatio: 9 / 19.5,
    borderRadius: 0.15,
    cameraCutout: { x: 0.06, y: 0.03, width: 0.40, height: 0.40 * (9/19.5), borderRadius: 0.25 },
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    type: 'mobile',
    aspectRatio: 9 / 19.5,
    borderRadius: 0.15,
    cameraCutout: { x: 0.06, y: 0.03, width: 0.43, height: 0.43 * (9/19.5), borderRadius: 0.25 },
  },
  {
    id: 'iphone-15',
    name: 'iPhone 15',
    type: 'mobile',
    aspectRatio: 9 / 19.5,
    borderRadius: 0.15,
    cameraCutout: { x: 0.06, y: 0.03, width: 0.38, height: 0.38 * (9/19.5), borderRadius: 0.25 },
  },
  // SAMSUNG MOBILE
  {
    id: 'galaxy-s24-ultra',
    name: 'Galaxy S24 Ultra',
    type: 'mobile',
    aspectRatio: 9 / 19.3,
    borderRadius: 0.02, // very sharp corners
    cameraCutout: { x: 0.06, y: 0.04, width: 0.12, height: 0.28, borderRadius: 0.5 },
  },
  {
    id: 'galaxy-s24-plus',
    name: 'Galaxy S24+',
    type: 'mobile',
    aspectRatio: 9 / 19.5,
    borderRadius: 0.12,
    cameraCutout: { x: 0.06, y: 0.04, width: 0.12, height: 0.25, borderRadius: 0.5 },
  },
  {
    id: 'galaxy-s24',
    name: 'Galaxy S24',
    type: 'mobile',
    aspectRatio: 9 / 19.5,
    borderRadius: 0.12,
    cameraCutout: { x: 0.06, y: 0.04, width: 0.14, height: 0.26, borderRadius: 0.5 },
  },
  // GOOGLE MOBILE
  {
    id: 'pixel-9-pro-xl',
    name: 'Pixel 9 Pro XL',
    type: 'mobile',
    aspectRatio: 9 / 20,
    borderRadius: 0.14,
    cameraCutout: { x: 0.1, y: 0.15, width: 0.8, height: 0.12, borderRadius: 0.5 }, // horizontal bar
  },
  {
    id: 'pixel-8-pro',
    name: 'Pixel 8 Pro',
    type: 'mobile',
    aspectRatio: 9 / 20,
    borderRadius: 0.14,
    cameraCutout: { x: 0.0, y: 0.15, width: 1.0, height: 0.10, borderRadius: 0.0 }, // edge-to-edge bar
  },
  // LAPTOPS
  {
    id: 'macbook-pro-16-m3',
    name: 'MacBook Pro 16" (M3)',
    type: 'laptop',
    aspectRatio: 16 / 10,
    borderRadius: 0.03,
    logoCutout: { x: 0.5, y: 0.5, width: 0.08, height: 0.08 * (16/10) }
  },
  {
    id: 'macbook-pro-14-m3',
    name: 'MacBook Pro 14" (M3)',
    type: 'laptop',
    aspectRatio: 16 / 10,
    borderRadius: 0.04,
    logoCutout: { x: 0.5, y: 0.5, width: 0.10, height: 0.10 * (16/10) }
  },
  {
    id: 'macbook-air-15-m3',
    name: 'MacBook Air 15" (M3)',
    type: 'laptop',
    aspectRatio: 16 / 10,
    borderRadius: 0.04,
    logoCutout: { x: 0.5, y: 0.5, width: 0.09, height: 0.09 * (16/10) }
  },
  {
    id: 'macbook-air-13-m3',
    name: 'MacBook Air 13" (M3)',
    type: 'laptop',
    aspectRatio: 16 / 10,
    borderRadius: 0.04,
    logoCutout: { x: 0.5, y: 0.5, width: 0.10, height: 0.10 * (16/10) }
  },
  {
    id: 'dell-xps-14',
    name: 'Dell XPS 14 (2024)',
    type: 'laptop',
    aspectRatio: 16 / 10,
    borderRadius: 0.02,
    logoCutout: { x: 0.5, y: 0.5, width: 0.08, height: 0.08 * (16/10) } // Dell logo
  }
];
