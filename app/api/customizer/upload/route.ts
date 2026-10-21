import { NextResponse } from 'next/server';
import { uploadBufferToR2, getR2PublicUrl } from '@/lib/r2';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Helper to safely convert base64 data URL to Buffer
function parseBase64DataUrl(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;
    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    return { buffer, contentType };
  } catch (err) {
    console.error('Failed to parse base64 data URL:', err);
    return null;
  }
}

// Fallback local file saver for development/offline
function saveLocalFallback(buffer: Buffer, fileName: string): string {
  try {
    const dir = path.join(process.cwd(), 'public', 'images', 'uploads', 'customizer');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(dir, safeName);
    fs.writeFileSync(filePath, buffer);
    return `/images/uploads/customizer/${safeName}`;
  } catch (err) {
    console.warn('Local fallback file save failed:', err);
    return '';
  }
}

async function uploadOrFallback(
  buffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  try {
    const { objectKey } = await uploadBufferToR2(buffer, fileName, contentType);
    return getR2PublicUrl(objectKey);
  } catch (r2Err) {
    console.warn('R2 upload failed, falling back to local static storage:', r2Err);
    const localUrl = saveLocalFallback(buffer, fileName);
    if (localUrl) return localUrl;
    // Ultimate fallback: return a data URL if small, or throw
    throw r2Err;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      currentSnapshot,
      frontSnapshot,
      backSnapshot,
      leftSleeveSnapshot,
      rightSleeveSnapshot,
      uploadedArtworks = [],
      garmentId = 'tee',
      magazinePdf,
      filename,
    } = body;

    let currentPreviewUrl: string | null = null;
    let frontPreviewUrl: string | null = null;
    let backPreviewUrl: string | null = null;
    let leftSleevePreviewUrl: string | null = null;
    let rightSleevePreviewUrl: string | null = null;
    let printPdfUrl: string | null = null;
    const processedArtworks: Array<{
      name: string;
      url: string;
      side: string;
      placement?: string;
    }> = [];

    const uploadSnapshot = async (
      snapshot: unknown,
      suffix: string,
    ): Promise<string | null> => {
      if (!snapshot || typeof snapshot !== 'string') return null;
      if (!snapshot.startsWith('data:image/')) return snapshot;
      const parsed = parseBase64DataUrl(snapshot);
      if (!parsed) return null;
      try {
        return await uploadOrFallback(
          parsed.buffer,
          `mockup_3d_${garmentId}_${suffix}.png`,
          parsed.contentType,
        );
      } catch (err) {
        console.error(`Failed to upload ${suffix} 3D mockup snapshot:`, err);
        return null;
      }
    };

    // 0. Upload Magazine Print-Ready PDF if provided
    if (magazinePdf && typeof magazinePdf === 'string') {
      if (magazinePdf.startsWith('data:')) {
        const parsed = parseBase64DataUrl(magazinePdf);
        if (parsed) {
          try {
            const rawName = filename || `magazine_print_${Date.now()}.pdf`;
            const pdfName = rawName.endsWith('.pdf') ? rawName : `${rawName}.pdf`;
            printPdfUrl = await uploadOrFallback(
              parsed.buffer,
              pdfName,
              'application/pdf',
            );
          } catch (pdfErr) {
            console.error('Failed to upload magazine print PDF to R2:', pdfErr);
          }
        }
      } else if (magazinePdf.startsWith('http://') || magazinePdf.startsWith('https://')) {
        printPdfUrl = magazinePdf;
      }
    }

    // 1. Upload the exact studio view and fixed-angle proofs
    currentPreviewUrl = await uploadSnapshot(currentSnapshot, 'current');
    frontPreviewUrl = await uploadSnapshot(frontSnapshot, 'front');
    backPreviewUrl = await uploadSnapshot(backSnapshot, 'back');
    leftSleevePreviewUrl = await uploadSnapshot(leftSleeveSnapshot, 'left_sleeve');
    rightSleevePreviewUrl = await uploadSnapshot(rightSleeveSnapshot, 'right_sleeve');

    // 3. Upload Original Customer Artwork Files (Multiple artworks supported)
    if (Array.isArray(uploadedArtworks)) {
      for (let i = 0; i < uploadedArtworks.length; i++) {
        const art = uploadedArtworks[i];
        if (!art) continue;

        const rawUrl = art.dataUrl || art.url || '';
        let finalArtworkUrl = rawUrl;

        if (typeof rawUrl === 'string' && rawUrl.startsWith('data:image/')) {
          const parsed = parseBase64DataUrl(rawUrl);
          if (parsed) {
            try {
              const safeName = (art.name || `artwork_${i + 1}`).replace(/[^a-zA-Z0-9._-]/g, '_');
              finalArtworkUrl = await uploadOrFallback(
                parsed.buffer,
                `art_${i + 1}_${safeName}.png`,
                parsed.contentType,
              );
            } catch (artErr) {
              console.error(`Failed to upload artwork #${i + 1} to R2:`, artErr);
            }
          }
        }

        processedArtworks.push({
          name: art.name || `Graphic #${i + 1}`,
          url: finalArtworkUrl,
          side: art.side || 'front',
          placement: art.placementTarget || art.placement || undefined,
        });
      }
    }

    // Find front, back and sleeve primary design files from processed artworks
    const frontArt = processedArtworks.find((a) => a.side === 'front') || processedArtworks[0];
    const backArt = processedArtworks.find((a) => a.side === 'back');
    const leftSleeveArt = processedArtworks.find((a) => a.side === 'left-sleeve');
    const rightSleeveArt = processedArtworks.find((a) => a.side === 'right-sleeve');

    const frontDesignFileUrl = frontArt?.url || null;
    const backDesignFileUrl = backArt?.url || null;
    const leftSleeveDesignFileUrl = leftSleeveArt?.url || null;
    const rightSleeveDesignFileUrl = rightSleeveArt?.url || null;
    const designFileUrl =
      printPdfUrl ||
      frontDesignFileUrl ||
      backDesignFileUrl ||
      leftSleeveDesignFileUrl ||
      rightSleeveDesignFileUrl ||
      null;

    return NextResponse.json({
      success: true,
      printPdfUrl,
      currentPreviewUrl,
      frontPreviewUrl,
      backPreviewUrl,
      leftSleevePreviewUrl,
      rightSleevePreviewUrl,
      previewFileUrl: currentPreviewUrl || frontPreviewUrl || backPreviewUrl,
      frontDesignFileUrl,
      backDesignFileUrl,
      leftSleeveDesignFileUrl,
      rightSleeveDesignFileUrl,
      designFileUrl,
      uploadedArtworks: processedArtworks,
    });
  } catch (error) {
    console.error('Customizer upload handler error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process customizer uploads' },
      { status: 500 },
    );
  }
}
