import type { CustomizationTemplate } from '@/data/customizationTemplates';

/**
 * Loads an image from a source URL or Data URL asynchronously.
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

/**
 * Generates a static composite preview of a user's uploaded image applied to a product template.
 * Uses a native HTML Canvas to avoid loading fabric.js for the comparison view.
 */
export async function generateCompositePreview(
  uploadedImageUrl: string,
  template: CustomizationTemplate,
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('generateCompositePreview can only be called on the client side.');
  }

  try {
    // 1. Load both images
    const [mockupImg, userImg] = await Promise.all([
      loadImage(template.mockupImage),
      loadImage(uploadedImageUrl),
    ]);

    // 2. Setup standard canvas (e.g., 800x800 base resolution)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context');

    // For better resolution on high-DPI screens without blowing up file size
    const CANVAS_SIZE = 800;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // 3. Draw mockup background
    ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);

    // 4. Calculate print area in absolute pixels
    const paX = canvas.width * template.printArea.x;
    const paY = canvas.height * template.printArea.y;
    const paW = canvas.width * template.printArea.width;
    const paH = canvas.height * template.printArea.height;

    // 5. Draw user image inside the print area
    ctx.save();

    // Setup clipping path so the user image doesn't bleed outside the print area
    ctx.beginPath();
    ctx.rect(paX, paY, paW, paH);
    ctx.clip();

    // Apply rotation if any
    if (template.printArea.rotation) {
      // Translate to center of print area to rotate
      ctx.translate(paX + paW / 2, paY + paH / 2);
      ctx.rotate((template.printArea.rotation * Math.PI) / 180);
      ctx.translate(-(paX + paW / 2), -(paY + paH / 2));
    }

    // Apply blend mode for realism (e.g. 'multiply' for tees to show fabric folds)
    if (template.blendMode) {
      ctx.globalCompositeOperation = template.blendMode;
    }

    // Calculate 'cover' scaling to fit the user image perfectly inside the print area
    const imgRatio = userImg.width / userImg.height;
    const paRatio = paW / paH;

    let drawW, drawH, drawX, drawY;

    if (imgRatio > paRatio) {
      // Image is wider than print area -> match height
      drawH = paH;
      drawW = drawH * imgRatio;
      drawX = paX - (drawW - paW) / 2;
      drawY = paY;
    } else {
      // Image is taller -> match width
      drawW = paW;
      drawH = drawW / imgRatio;
      drawX = paX;
      drawY = paY - (drawH - paH) / 2;
    }

    ctx.drawImage(userImg, drawX, drawY, drawW, drawH);

    ctx.restore();

    // 6. Export as WebP for smaller size and faster rendering
    return canvas.toDataURL('image/webp', 0.8);
  } catch (error) {
    console.error(`Error generating composite for ${template.productId}:`, error);
    throw error;
  }
}
