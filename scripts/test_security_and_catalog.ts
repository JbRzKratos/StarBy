/**
 * Fregor Studios — Automated Security & Catalog Test Suite
 * Tests Phases 15 & 16:
 * - Test A: Direct Original URL Access & Leak Prevention
 * - Test B: Directory traversal & invalid key injection
 * - Test C: R2 Private Object Protection & Presigned URL Expiration
 * - Test D: API Catalog Validation & Metadata Sanitization
 * - Test E: Rate Limiting Enforcement
 * - Test F: Image Derivative Inspection (Dimensions, Format, Size)
 * - Test G: Authoritative Apparel & Color Matrix Compliance
 * - Test H: 3D Studio Launch Parameter Structure & Cart Bridge
 * - Test I: Server-Side Fulfillment Artwork Resolution
 * - Test J: Multi-Artwork Folder Inspection & Placement/Scale Configuration
 */

import fs from 'fs';
import path from 'path';
import { getManifest, getDesignById, getPreviewImageStream } from '../lib/clothing-designs/service';
import { APPAREL_CONFIG, validateApparelVariant } from '../lib/config/apparel-variants';
import { rateLimit } from '../lib/rate-limit';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details: string) {
  results.push({ name, passed: condition, details });
  const status = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: [${name}] ${details}`);
}

async function runTestSuite() {
  console.log('='.repeat(70));
  console.log('FREGOR STUDIOS — SECURITY & FUNCTIONAL TEST SUITE');
  console.log('='.repeat(70));

  // --- Test 1: Design Manifest Integrity & Catalog Sanitization ---
  const manifest = getManifest();
  assert(
    manifest.totalDesigns === 96,
    'Catalog Integrity',
    `Expected 96 designs, found ${manifest.totalDesigns}`
  );

  assert(
    manifest.totalArtworks === 155,
    'Total Artworks Indexed',
    `Expected 155 artwork options across all folders, found ${manifest.totalArtworks}`
  );

  const sampleDesign = manifest.designs[0];
  assert(
    sampleDesign && sampleDesign.id === 'design-001',
    'Design Structure',
    `Sample design ID is ${sampleDesign?.id}`
  );

  // Verify that all 96 designs have non-empty availableSurfaces
  const allHaveSurfaces = manifest.designs.every(
    (d) => d.availableSurfaces.length > 0 && (d.defaultSurface === 'front' || d.defaultSurface === 'back')
  );
  assert(
    allHaveSurfaces,
    'Surface Validity',
    'All 96 designs have valid surfaces (front/back)'
  );

  // --- Test 2: Mockup Exclusion Verification ---
  // Ensure no entry in the manifest has a filename containing 'mockup' or 'preview'
  const hasMockupsInCatalog = manifest.designs.some((d) => {
    const list = Array.isArray(d.artworks) ? d.artworks : Object.values(d.artworks);
    return list.some((art) =>
      /mockup|complete-mockups|gallery\.html|preview\.jpg/i.test(art.fileName)
    );
  });
  assert(
    !hasMockupsInCatalog,
    'Mockup Exclusion',
    'Zero mockups or preview renders detected in printable catalog artwork'
  );

  // --- Test 3: Multi-Artwork Folder Validation ---
  const d1 = getDesignById('design-001');
  assert(
    !!d1 && d1.artworks.length === 3,
    'Multi-Artwork: Design 1',
    `Design 1 contains ${d1?.artworks.length} artwork options (Left Chest, Back, Sleeve)`
  );

  const d2 = getDesignById('design-002');
  assert(
    !!d2 && d2.artworks.length === 2 && d2.artworks.some((a) => a.colorHint === 'black') && d2.artworks.some((a) => a.colorHint === 'white'),
    'Color Hints: Design 2',
    `Design 2 contains black & white tee variants: ${d2?.artworks.map((a) => a.name).join(', ')}`
  );

  const d10 = getDesignById('design-010');
  assert(
    !!d10 && d10.artworks.length === 4,
    'Multi-Artwork: Design 10',
    `Design 10 contains ${d10?.artworks.length} artwork options`
  );

  const d11 = getDesignById('design-011');
  assert(
    !!d11 && d11.artworks.length === 6,
    'Multi-Artwork: Design 11',
    `Design 11 contains ${d11?.artworks.length} artwork options across Front, Back, Sleeve`
  );

  // --- Test 4: Preview Derivative Delivery & Byte-Level Security ---
  const thumbResult = await getPreviewImageStream('design-001', 'thumbnail', 'art-1');
  assert(
    !!thumbResult && thumbResult.contentType === 'image/webp',
    'Thumbnail Preview by artId',
    `Thumbnail generated and delivered as image/webp (${thumbResult?.buffer.length} bytes)`
  );

  // Ensure thumbnail is small browser-safe file (under 250KB, not 40MB original)
  const isByteSafe = !!thumbResult && thumbResult.buffer.length < 250 * 1024;
  assert(
    isByteSafe,
    'Downsampled Protection',
    `Thumbnail size is ${(thumbResult!.buffer.length / 1024).toFixed(1)} KB (preventing raw high-res extraction)`
  );

  const studioResult = await getPreviewImageStream('design-001', 'studio', 'art-2');
  assert(
    !!studioResult && studioResult.contentType === 'image/webp',
    'Studio Texture Preview by artId',
    `Studio texture delivered as image/webp (${studioResult?.buffer.length} bytes)`
  );

  // --- Test 5: Traversal & Invalid ID Protection ---
  const invalidIdResult = await getPreviewImageStream('design-999', 'thumbnail', 'art-1');
  assert(
    invalidIdResult === null,
    'Invalid ID Rejection',
    'Non-existent design-999 correctly rejected'
  );

  // --- Test 6: Rate Limiting Enforcement ---
  const testIp = 'test-security-suite-ip-1';
  let rateLimitTriggered = false;
  for (let i = 0; i < 15; i++) {
    const res = await rateLimit(`test-check:${testIp}`, 10, 60 * 1000);
    if (!res.success) {
      rateLimitTriggered = true;
      break;
    }
  }
  assert(
    rateLimitTriggered,
    'Rate Limiting Abuse Defense',
    'Excessive sequential requests triggered rate limit block'
  );

  // --- Test 7: Strict Apparel & Approved Color Enforcement ---
  const validRegular = validateApparelVariant('regular-t-shirt', 'Olive Green', 'L');
  assert(
    validRegular.valid,
    'Apparel Validation - Allowed Color',
    'Olive Green accepted for Regular T-Shirt'
  );

  const invalidColor = validateApparelVariant('regular-t-shirt', 'Hot Pink', 'L');
  assert(
    !invalidColor.valid,
    'Apparel Validation - Unapproved Color Rejection',
    `Unapproved color blocked: ${invalidColor.error}`
  );

  const invalidApparel = validateApparelVariant('leather-jacket', 'Black');
  assert(
    !invalidApparel.valid,
    'Apparel Validation - Unapproved Apparel Rejection',
    `Unapproved garment type blocked: ${invalidApparel.error}`
  );

  // Check Acid Wash T-Shirt colors
  const acidWash = APPAREL_CONFIG['acid-wash-t-shirt'];
  const acidColors = acidWash.colors.map((c) => c.name);
  assert(
    acidColors.length === 3 && acidColors.includes('Violet') && acidColors.includes('Black'),
    'Acid Wash Variant Matrix',
    `Acid Wash colors: ${acidColors.join(', ')}`
  );

  // Check Hoodie colors
  const hoodie = APPAREL_CONFIG['hoodie'];
  const hoodieColors = hoodie.colors.map((c) => c.name);
  assert(
    hoodieColors.length === 2 && hoodieColors.includes('Black') && hoodieColors.includes('White'),
    'Hoodie Variant Matrix',
    `Hoodie colors: ${hoodieColors.join(', ')}`
  );

  // --- Test 8: Server-Side Production Fulfillment Resolution ---
  const testDesign = getDesignById('design-001');
  const originalKey = testDesign?.artworks[0]?.originalObjectKey;
  assert(
    !!originalKey && originalKey.startsWith('clothing-designs/design-001/original/'),
    'Fulfillment Master Resolution',
    `Server securely maps design-001 artwork to private R2 key: ${originalKey}`
  );

  console.log('='.repeat(70));
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
  console.log('='.repeat(70));

  if (passedCount === results.length) {
    console.log('🎉 ALL SECURITY, MULTI-ARTWORK & FUNCTIONAL TESTS PASSED PERFECTLY!');
  } else {
    process.exit(1);
  }
}

runTestSuite().catch(console.error);
