import rawCatalog from './catalog.json';
import type { CatalogTemplate } from '../types/mockup';

export const CATALOG: CatalogTemplate[] = rawCatalog as unknown as CatalogTemplate[];

export const DEFAULT_TEMPLATE_ID = 36; // Heavyweight floating tee — Shaka Wear (ID #36)

export function getTemplateById(id: number): CatalogTemplate {
  const found = CATALOG.find(t => t.mockup_id === id);
  return found || CATALOG[0];
}

export function getGarmentUrl(id: number, side: 'front' | 'back'): string {
  const template = getTemplateById(id);
  const sideMeta = side === 'front' ? template.front : template.back;
  const fileName = sideMeta.garment.path.split('/').pop();
  return `/designs/${fileName}`;
}

export function getShadowUrl(id: number, side: 'front' | 'back'): string {
  const template = getTemplateById(id);
  const sideMeta = side === 'front' ? template.front : template.back;
  const fileName = sideMeta.shadow.path.split('/').pop();
  return `/designs/${fileName}`;
}
