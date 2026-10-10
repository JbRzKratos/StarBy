import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const R2 = 'https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters';

const SPLIT_POSTER_VARIANT_IMAGES = {
  'var_split_s3_mat': [`${R2}/3%20Split%20Poster.webp`],
  'var_split_s3_luxe': [`${R2}/3%20Split%20Poster.webp`],
  'var_split_s5_mat': [`${R2}/Fregoro_Studios_Extend_the_existing_background_into_the_empty_c500f4a2-3ca8-471c-86fb-5b78ea8ecc81_3.webp`],
  'var_split_s5_luxe': [`${R2}/Fregoro_Studios_Extend_the_existing_background_into_the_empty_c500f4a2-3ca8-471c-86fb-5b78ea8ecc81_3.webp`],
  'var_split_cl_3p': [`${R2}/Fregoro_Studios_Extend_the_existing_background_into_the_empty_ef9c2920-e7ec-4d5d-8ef9-638716a339a0_3.webp`],
  'var_split_cl_4p': [`${R2}/Fregoro_Studios_Extend_the_existing_background_into_the_empty_ef9c2920-e7ec-4d5d-8ef9-638716a339a0_3.webp`],
  'var_split_cl_5p': [`${R2}/Fregoro_Studios_Extend_the_existing_background_into_the_empty_ef9c2920-e7ec-4d5d-8ef9-638716a339a0_3.webp`],
  'var_split_grid_2x2': [`${R2}/Fregoro_Studios_Extend_the_existing_background_into_the_empty_c054f7e5-5ed5-453d-8f54-8497cff5c7f5_3.webp`],
  'var_split_grid_3x2': [`${R2}/Fregoro_Studios_Extend_the_existing_background_into_the_empty_c054f7e5-5ed5-453d-8f54-8497cff5c7f5_3.webp`],
  'var_split_grid_3x3': [`${R2}/Fregoro_Studios_Extend_the_existing_background_into_the_empty_c054f7e5-5ed5-453d-8f54-8497cff5c7f5_3.webp`],
};

async function main() {
  console.log('Updating split poster variant images to R2 CDN URLs...');
  let updated = 0;
  for (const [variantId, images] of Object.entries(SPLIT_POSTER_VARIANT_IMAGES)) {
    try {
      await p.productVariant.update({
        where: { id: variantId },
        data: { images },
      });
      console.log(`  ✅ Updated ${variantId}`);
      updated++;
    } catch (e) {
      console.log(`  ⚠️ Skipped ${variantId}: ${e.message}`);
    }
  }
  
  // Also check the R2 URLs
  console.log('\nChecking R2 URL availability...');
  for (const images of Object.values(SPLIT_POSTER_VARIANT_IMAGES)) {
    for (const url of images.slice(0, 1)) {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        console.log(`  ${res.status} ${url.substring(0, 90)}`);
      } catch (e) {
        console.log(`  ERR ${url.substring(0, 90)}`);
      }
    }
  }
  
  console.log(`\nDone! Updated ${updated} variants.`);
}

main().catch(console.error).finally(() => p.$disconnect());
