import { deviceModels } from '@/data/devices';
import { products } from '@/data/products';
import { useCustomizerStore } from '@/store/customizer';

/**
 * Loads an image from a source URL or Data URL asynchronously.
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
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

    const product = products.find(p => p.id === template.productId);
    const isSkin = product?.categorySlug === 'skins';
    const isPoster = product?.categorySlug === 'posters' || product?.categorySlug === 'split-posters';

    if (isSkin) {
      // Background
      ctx.fillStyle = '#1A1A1E';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const deviceShape = deviceModels[0]; // Default iPhone 15 Pro
      const maxH = canvas.height * 0.65;
      const paH = maxH;
      const paW = paH * deviceShape.aspectRatio;
      const paX = (canvas.width - paW) / 2;
      const paY = (canvas.height - paH) / 2;
      const borderRadius = paW * deviceShape.borderRadius;

      // Shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = '#111';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(paX, paY, paW, paH, borderRadius);
      else ctx.rect(paX, paY, paW, paH);
      ctx.fill();
      ctx.restore();

      // Frame
      ctx.fillStyle = '#333';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(paX - 2, paY - 2, paW + 4, paH + 4, borderRadius + 2);
      else ctx.rect(paX - 2, paY - 2, paW + 4, paH + 4);
      ctx.fill();

      // User Image
      ctx.save();
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(paX, paY, paW, paH, borderRadius);
      else ctx.rect(paX, paY, paW, paH);
      ctx.clip();

      const imgRatio = userImg.width / userImg.height;
      const paRatio = paW / paH;
      let drawW, drawH, drawX, drawY;
      if (imgRatio > paRatio) {
        drawH = paH; drawW = drawH * imgRatio; drawX = paX - (drawW - paW) / 2; drawY = paY;
      } else {
        drawW = paW; drawH = drawW / imgRatio; drawX = paX; drawY = paY - (drawH - paH) / 2;
      }
      ctx.drawImage(userImg, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Camera Cutout
      if (deviceShape.cameraCutout) {
        const cw = paW * deviceShape.cameraCutout.width;
        const ch = paH * deviceShape.cameraCutout.height;
        const cx = paX + (paW * deviceShape.cameraCutout.x);
        const cy = paY + (paH * deviceShape.cameraCutout.y);
        const cr = cw * deviceShape.cameraCutout.borderRadius;

        ctx.fillStyle = '#0E0E0F';
        ctx.strokeStyle = '#2A2A2F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') ctx.roundRect(cx, cy, cw, ch, cr);
        else ctx.rect(cx, cy, cw, ch);
        ctx.fill();
        ctx.stroke();
      }

      // Logo Cutout
      if (deviceShape.logoCutout) {
        const lw = paW * deviceShape.logoCutout.width;
        const lh = paH * deviceShape.logoCutout.height;
        const lx = paX + (paW * deviceShape.logoCutout.x);
        const ly = paY + (paH * deviceShape.logoCutout.y);
        
        ctx.fillStyle = '#E5E5E5';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.arc(lx, ly, lw/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent'; // reset shadow
      }

      // Glass Reflection
      const grad = ctx.createLinearGradient(paX, paY, paX + paW, paY + paH);
      grad.addColorStop(0, 'rgba(255,255,255,0.1)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(paX, paY, paW, paH, borderRadius);
      else ctx.rect(paX, paY, paW, paH);
      ctx.fill();

    } else if (isPoster) {
      // Background
      ctx.fillStyle = '#1A1A1E';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let maxH = canvas.height * 0.7;
      let maxW = maxH * (5/7); // portrait
      
      const { splitStyle, splitOrientation, splitPanels, splitGridCols, splitGridRows } = useCustomizerStore.getState();

      if (product?.categorySlug === 'split-posters') {
        const isV = splitOrientation === 'vertical';
        if (splitStyle === 'classic') {
          maxW = isV ? maxH * (4/7) : canvas.width * 0.7;
          maxH = isV ? canvas.height * 0.7 : maxW * (4/7);
        } else if (splitStyle === 'stepped') {
          maxW = canvas.width * 0.7;
          maxH = maxW * (4/7);
        } else if (splitStyle === 'grid') {
          maxW = canvas.height * 0.6;
          maxH = canvas.height * 0.6;
        }
      }

      const paH = maxH;
      const paW = maxW;
      const paX = (canvas.width - paW) / 2;
      const paY = (canvas.height - paH) / 2;

      // Shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;
      ctx.fillStyle = '#111';
      ctx.fillRect(paX - 20, paY - 20, paW + 40, paH + 40);
      ctx.restore();

      // Frame
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(paX - 20, paY - 20, paW + 40, paH + 40);

      // Mat Board
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(paX - 2, paY - 2, paW + 4, paH + 4);

      // Inner Shadow (Mat)
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(paX, paY, paW, paH);

      // User Image
      ctx.save();
      ctx.beginPath();
      ctx.rect(paX, paY, paW, paH);
      ctx.clip();

      const imgRatio = userImg.width / userImg.height;
      const paRatio = paW / paH;
      let drawW, drawH, drawX, drawY;
      if (imgRatio > paRatio) {
        drawH = paH; drawW = drawH * imgRatio; drawX = paX - (drawW - paW) / 2; drawY = paY;
      } else {
        drawW = paW; drawH = drawW / imgRatio; drawX = paX; drawY = paY - (drawH - paH) / 2;
      }
      ctx.drawImage(userImg, drawX, drawY, drawW, drawH);
      ctx.restore();

      if (product?.categorySlug === 'split-posters') {
        const gapSize = 10;
        ctx.fillStyle = '#1A1A1A';

        if (splitStyle === 'classic') {
          const isV = splitOrientation === 'vertical';
          for (let i = 1; i < splitPanels; i++) {
            if (isV) {
              const step = paW / splitPanels;
              ctx.fillRect(paX + (step * i) - (gapSize/2), paY - 20, gapSize, paH + 40);
            } else {
              const step = paH / splitPanels;
              ctx.fillRect(paX - 20, paY + (step * i) - (gapSize/2), paW + 40, gapSize);
            }
          }
        } else if (splitStyle === 'stepped') {
          const step = paW / splitPanels;
          const pCount = splitPanels === 5 ? 5 : 3;
          const heights = pCount === 3 ? [0.8, 1, 0.8] : [0.6, 0.8, 1, 0.8, 0.6];
          
          for (let i = 1; i < splitPanels; i++) {
            ctx.fillRect(paX + (step * i) - (gapSize/2), paY - 20, gapSize, paH + 40);
          }
          
          for (let i = 0; i < splitPanels; i++) {
            const hScale = heights[i];
            const removedH = (paH - (paH * hScale)) / 2;
            if (removedH > 0) {
              ctx.fillRect(paX + (step * i), paY - 20, step, removedH + 20);
              ctx.fillRect(paX + (step * i), paY + paH - removedH, step, removedH + 20);
            }
          }
        } else if (splitStyle === 'grid') {
          const stepX = paW / splitGridCols;
          const stepY = paH / splitGridRows;
          for (let i = 1; i < splitGridCols; i++) {
            ctx.fillRect(paX + (stepX * i) - (gapSize/2), paY - 20, gapSize, paH + 40);
          }
          for (let i = 1; i < splitGridRows; i++) {
            ctx.fillRect(paX - 20, paY + (stepY * i) - (gapSize/2), paW + 40, gapSize);
          }
        }
      }

      // Glass Reflection
      const grad = ctx.createLinearGradient(paX - 20, paY - 20, paX + paW + 20, paY + paH + 20);
      grad.addColorStop(0, 'rgba(255,255,255,0.08)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.15)');
      ctx.fillStyle = grad;
      ctx.fillRect(paX - 20, paY - 20, paW + 40, paH + 40);

    } else {
      // 3. Draw mockup background
      ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);

      // 4. Calculate print area in absolute pixels
      const paX = canvas.width * template.printArea.x;
      const paY = canvas.height * template.printArea.y;
      const paW = canvas.width * template.printArea.width;
      const paH = canvas.height * template.printArea.height;
      const borderRadius = 0;

      // 5. Draw user image inside the print area
      ctx.save();

      ctx.beginPath();
      ctx.rect(paX, paY, paW, paH);
      ctx.clip();

      if (template.printArea.rotation) {
        ctx.translate(paX + paW / 2, paY + paH / 2);
        ctx.rotate((template.printArea.rotation * Math.PI) / 180);
        ctx.translate(-(paX + paW / 2), -(paY + paH / 2));
      }

      if (template.blendMode) {
        ctx.globalCompositeOperation = template.blendMode;
      }

      const imgRatio = userImg.width / userImg.height;
      const paRatio = paW / paH;
      let drawW, drawH, drawX, drawY;

      if (imgRatio > paRatio) {
        drawH = paH;
        drawW = drawH * imgRatio;
        drawX = paX - (drawW - paW) / 2;
        drawY = paY;
      } else {
        drawW = paW;
        drawH = drawW / imgRatio;
        drawX = paX;
        drawY = paY - (drawH - paH) / 2;
      }

      ctx.drawImage(userImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    }

    // 6. Export as WebP for smaller size and faster rendering
    return canvas.toDataURL('image/webp', 0.8);
  } catch (error) {
    console.error(`Error generating composite for ${template.productId}:`, error);
    throw error;
  }
}
