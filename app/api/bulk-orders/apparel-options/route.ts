import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { STANDARD_SIZES } from '@/lib/bulk-orders/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch products belonging to apparel categories
    const products = await prisma.product.findMany({
      where: {
        categorySlug: {
          in: ['tees', 'oversized-tees', 'hoodies', 'polos', 'sweatshirts', 'jerseys'],
        },
      },
      include: {
        variants: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Curated standard fallbacks if catalog has sparse items
    const standardApparelTypes = [
      {
        id: 'oversized-t-shirt',
        name: 'Oversized T-Shirt',
        categorySlug: 'oversized-tees',
        description: '240 GSM heavyweight, drop-shoulder luxury streetwear fit. Boxy silhouette.',
        recommendedFabric: '240 GSM French Terry / Bio-Washed Cotton',
        sizes: [...STANDARD_SIZES],
        colors: [
          { name: 'Black', hex: '#121214' },
          { name: 'White', hex: '#F9F9F9' },
          { name: 'Charcoal', hex: '#2A2A2E' },
          { name: 'Navy Blue', hex: '#1B263B' },
          { name: 'Beige / Sand', hex: '#D7C4A5' },
          { name: 'Dusky Pink', hex: '#DDA7A5' },
          { name: 'Maroon', hex: '#6B1D2F' },
          { name: 'Forest Green', hex: '#1B4332' },
        ],
      },
      {
        id: 'regular-fit-t-shirt',
        name: 'Regular Fit Classic T-Shirt',
        categorySlug: 'tees',
        description: '180–200 GSM 100% combed cotton, pre-shrunk, soft-flow dyed fabric.',
        recommendedFabric: '180–200 GSM Combed Cotton',
        sizes: [...STANDARD_SIZES],
        colors: [
          { name: 'Black', hex: '#121214' },
          { name: 'White', hex: '#F9F9F9' },
          { name: 'Navy Blue', hex: '#1B263B' },
          { name: 'Charcoal Grey', hex: '#333333' },
          { name: 'Royal Blue', hex: '#0057FF' },
          { name: 'Red', hex: '#C1121F' },
          { name: 'Olive Green', hex: '#556B2F' },
          { name: 'Yellow', hex: '#FFB703' },
        ],
      },
      {
        id: 'heavyweight-hoodie',
        name: 'Heavyweight Pullover Hoodie',
        categorySlug: 'hoodies',
        description: '320–350 GSM premium 3-thread fleece, double-layered hood, ribbed cuffs.',
        recommendedFabric: '320 GSM 100% Cotton Fleece',
        sizes: [...STANDARD_SIZES],
        colors: [
          { name: 'Black', hex: '#121214' },
          { name: 'White', hex: '#F9F9F9' },
          { name: 'Heather Grey', hex: '#8E9196' },
          { name: 'Navy Blue', hex: '#1B263B' },
          { name: 'Mocha Brown', hex: '#4A3728' },
          { name: 'Emerald Green', hex: '#1B4332' },
        ],
      },
      {
        id: 'polo-t-shirt',
        name: 'Polo T-Shirt (Corporate & Event)',
        categorySlug: 'polos',
        description: '220 GSM honeycomb pique cotton, ribbed collar with tipping, formal & smart.',
        recommendedFabric: '220 GSM Matty Pique Cotton',
        sizes: [...STANDARD_SIZES],
        colors: [
          { name: 'Black', hex: '#121214' },
          { name: 'White', hex: '#F9F9F9' },
          { name: 'Navy Blue', hex: '#1B263B' },
          { name: 'Royal Blue', hex: '#0057FF' },
          { name: 'Burgundy', hex: '#5E1914' },
          { name: 'Anthracite Grey', hex: '#383838' },
        ],
      },
      {
        id: 'crewneck-sweatshirt',
        name: 'Crewneck Sweatshirt',
        categorySlug: 'sweatshirts',
        description: '280 GSM soft brushed fleece, rib knit collar & hem, timeless teamwear.',
        recommendedFabric: '280 GSM Brushed Cotton Fleece',
        sizes: [...STANDARD_SIZES],
        colors: [
          { name: 'Black', hex: '#121214' },
          { name: 'Off White', hex: '#F3EFE6' },
          { name: 'Navy Blue', hex: '#1B263B' },
          { name: 'Grey Melange', hex: '#A3A3A3' },
          { name: 'Sage Green', hex: '#879883' },
        ],
      },
      {
        id: 'sports-jersey',
        name: 'Custom Sports & Esports Jersey',
        categorySlug: 'jerseys',
        description: '160 GSM moisture-wicking quick-dry polyester, all-over dye sublimation.',
        recommendedFabric: '160 GSM Micro-Polyester Dry-Fit',
        sizes: [...STANDARD_SIZES],
        colors: [
          { name: 'Black / Red', hex: '#121214' },
          { name: 'Navy / Cyan', hex: '#0A2540' },
          { name: 'White / Gold', hex: '#FAFAFA' },
          { name: 'Full Custom Sublimation', hex: '#3B5EFF' },
        ],
      },
      {
        id: 'custom-apparel-other',
        name: 'Other / Custom Requirement',
        categorySlug: 'other',
        description:
          'Custom cut & sew, jackets, aprons, caps, tote bags, or specialized merchandise.',
        recommendedFabric: 'Custom per specification',
        sizes: [...STANDARD_SIZES],
        colors: [{ name: 'Custom Color / Pantone', hex: '#777777' }],
      },
    ];

    // If database products exist, enrich standard types with live DB variant colors
    const enriched = standardApparelTypes.map((item) => {
      const match = products.find(
        (p) =>
          p.categorySlug === item.categorySlug ||
          p.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0]),
      );
      if (match && match.variants.length > 0) {
        const dbColors = match.variants.map((v) => ({
          name: v.color || v.name,
          hex: v.colorHex || '#121214',
        }));
        // Merge without duplicates
        const colorMap = new Map<string, { name: string; hex: string }>();
        item.colors.forEach((c) => colorMap.set(c.name.toLowerCase(), c));
        dbColors.forEach((c) => colorMap.set(c.name.toLowerCase(), c));
        return {
          ...item,
          productId: match.id,
          colors: Array.from(colorMap.values()),
        };
      }
      return item;
    });

    return NextResponse.json({
      success: true,
      apparelTypes: enriched,
    });
  } catch (err) {
    console.error('Error fetching bulk apparel options:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to load apparel options' },
      { status: 500 },
    );
  }
}
