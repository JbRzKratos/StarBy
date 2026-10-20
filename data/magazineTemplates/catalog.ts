import type { MagazineTemplateMeta } from '@/types/magazine';

/**
 * Lightweight template catalogue.
 *
 * The magazine landing page and the template API only need card/preview
 * metadata — never the full page trees. Keeping that metadata in its own small
 * module stops the ~860 KB `data/magazineTemplates/index.ts` bundle (and its
 * API payload) from reaching the browser.
 *
 * `data/magazineTemplates/index.ts` remains the source of truth for the full
 * templates used by the editor / wizard.
 */
export const MAGAZINE_TEMPLATE_CATALOG: MagazineTemplateMeta[] = [
  {
    id: 'tpl_fashion_1',
    slug: 'fashion-magazine-1',
    name: 'Fashion Magazine 1',
    category: 'fashion',
    subcategory: 'Fashion Editorial',
    description: 'Custom template created from editorial layout',
    styleTags: ['editorial', 'magazine', 'fashion'],
    badge: 'POPULAR',
    coverImage: '/templates/canva/fashion-1/thumbnail.webp',
    dimensionKey: 'a4-portrait',
    pageCount: 10,
    featured: true,
    spreadPreviews: [],
  },
  {
    id: 'tpl_fashion_2',
    slug: 'fashion-magazine-2',
    name: 'Fashion Magazine 2',
    category: 'fashion',
    subcategory: 'Fashion Editorial',
    description: 'Custom template created from editorial layout',
    styleTags: ['editorial', 'magazine', 'fashion'],
    badge: 'NEW',
    coverImage: '/templates/canva/fashion-2/thumbnail.webp',
    dimensionKey: 'a4-portrait',
    pageCount: 10,
    featured: true,
    spreadPreviews: [],
  },
  {
    id: 'tpl_girl_birthday_1',
    slug: 'girl-birthday-1',
    name: 'Girl Birthday Magazine 1',
    category: 'lifestyle',
    subcategory: 'Birthday & Celebration',
    description: 'Custom template created from editorial layout',
    styleTags: ['editorial', 'magazine', 'lifestyle'],
    badge: 'NEW',
    coverImage: '/templates/canva/girl-birthday-1/thumbnail.webp',
    dimensionKey: 'a4-portrait',
    pageCount: 11,
    featured: true,
    spreadPreviews: [],
  },
  {
    id: 'tpl_lifestyle_1',
    slug: 'lifestyle-1',
    name: 'Lifestyle Magazine 1',
    category: 'lifestyle',
    subcategory: 'Lifestyle & Wellness',
    description: 'Custom template created from editorial layout',
    styleTags: ['editorial', 'magazine', 'lifestyle'],
    badge: 'NEW',
    coverImage: '/templates/canva/lifestyle-1/thumbnail.webp',
    dimensionKey: 'a4-portrait',
    pageCount: 24,
    featured: true,
    spreadPreviews: [],
  },
  {
    id: 'tpl_personal_man_1',
    slug: 'personal-man-1',
    name: 'Personal Man Magazine 1',
    category: 'mens-style',
    subcategory: "Men's Editorial",
    description: 'Custom template created from editorial layout',
    styleTags: ['editorial', 'magazine', 'mens-style'],
    badge: 'TRENDING',
    coverImage: '/templates/canva/personal-man-1/thumbnail.webp',
    dimensionKey: 'a4-portrait',
    pageCount: 10,
    featured: true,
    spreadPreviews: [],
  },
];
