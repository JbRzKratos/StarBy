export interface Testimonial {
  id: string;
  name: string;
  handle: string;
  quote: string;
  product: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Arjun M.',
    handle: '@arjun.creates',
    quote: 'The print quality is insane. My artwork looks better on the tee than on my screen.',
    product: 'Eclipse Tee',
    rating: 5,
  },
  {
    id: 't2',
    name: 'Mia L.',
    handle: '@mia.studio',
    quote: 'Ordered a split poster of our wedding photo. It looks like actual gallery art.',
    product: 'Prism Split',
    rating: 5,
  },
  {
    id: 't3',
    name: 'Dev R.',
    handle: '@devr_design',
    quote: 'The customizer is addictive. Spent an hour designing my laptop skin.',
    product: 'Phantom Skin',
    rating: 5,
  },
  {
    id: 't4',
    name: 'Priya K.',
    handle: '@priya.writes',
    quote: 'Gifted a custom diary with our photos on the cover. She cried. 10/10.',
    product: 'Chronicle Diary',
    rating: 5,
  },
  {
    id: 't5',
    name: 'Kael S.',
    handle: '@kael.photo',
    quote: 'Finally a brand that treats custom products as design objects, not cheap merch.',
    product: 'Monolith Poster',
    rating: 5,
  },
  {
    id: 't6',
    name: 'Nina W.',
    handle: '@nina.minimal',
    quote: 'The hoodie quality alone is worth it. The custom design is just a bonus.',
    product: 'Orbit Hoodie',
    rating: 5,
  },
];
