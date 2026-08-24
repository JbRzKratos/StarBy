import type {
  MagazinePage,
  MagazineElement,
  AlignAction,
  DistributeAction,
} from '@/types/magazine';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

/**
 * Calculates the collective bounding box for multiple selected elements.
 */
export function calculateCollectiveBoundingBox(elements: MagazineElement[]): BoundingBox | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((el) => {
    const { x, y, width, height } = el.frame;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + width > maxX) maxX = x + width;
    if (y + height > maxY) maxY = y + height;
  });

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/**
 * Alignment calculation across selected elements or page boundaries.
 */
export function alignElements(
  elements: MagazineElement[],
  action: AlignAction,
  relativeToPage = false,
): MagazineElement[] {
  if (elements.length === 0) return elements;

  const bbox = calculateCollectiveBoundingBox(elements);
  if (!bbox) return elements;

  return elements.map((el) => {
    const updated = { ...el, frame: { ...el.frame } };

    if (relativeToPage) {
      // Align relative to page (0 - 100%)
      switch (action) {
        case 'left':
          updated.frame.x = 4; // inside safe margin
          break;
        case 'center':
          updated.frame.x = (100 - el.frame.width) / 2;
          break;
        case 'right':
          updated.frame.x = 100 - el.frame.width - 4;
          break;
        case 'top':
          updated.frame.y = 4;
          break;
        case 'middle':
          updated.frame.y = (100 - el.frame.height) / 2;
          break;
        case 'bottom':
          updated.frame.y = 100 - el.frame.height - 4;
          break;
      }
    } else {
      // Align relative to selection bounding box
      switch (action) {
        case 'left':
          updated.frame.x = bbox.x;
          break;
        case 'center':
          updated.frame.x = bbox.x + (bbox.width - el.frame.width) / 2;
          break;
        case 'right':
          updated.frame.x = bbox.x + bbox.width - el.frame.width;
          break;
        case 'top':
          updated.frame.y = bbox.y;
          break;
        case 'middle':
          updated.frame.y = bbox.y + (bbox.height - el.frame.height) / 2;
          break;
        case 'bottom':
          updated.frame.y = bbox.y + bbox.height - el.frame.height;
          break;
      }
    }

    return updated;
  });
}

/**
 * Distributes elements evenly along horizontal or vertical axis.
 */
export function distributeElements(
  elements: MagazineElement[],
  action: DistributeAction,
): MagazineElement[] {
  if (elements.length <= 2) return elements;

  const sorted = [...elements].sort((a, b) =>
    action === 'horizontal' ? a.frame.x - b.frame.x : a.frame.y - b.frame.y,
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return elements;

  if (action === 'horizontal') {
    const totalSpan = last.frame.x + last.frame.width - first.frame.x;
    const totalElementsWidth = sorted.reduce((sum, el) => sum + el.frame.width, 0);
    const gap = (totalSpan - totalElementsWidth) / (sorted.length - 1);

    let currentX = first.frame.x;
    return sorted.map((el) => {
      const updated = { ...el, frame: { ...el.frame, x: currentX } };
      currentX += el.frame.width + gap;
      return updated;
    });
  } else {
    const totalSpan = last.frame.y + last.frame.height - first.frame.y;
    const totalElementsHeight = sorted.reduce((sum, el) => sum + el.frame.height, 0);
    const gap = (totalSpan - totalElementsHeight) / (sorted.length - 1);

    let currentY = first.frame.y;
    return sorted.map((el) => {
      const updated = { ...el, frame: { ...el.frame, y: currentY } };
      currentY += el.frame.height + gap;
      return updated;
    });
  }
}

/**
 * Reorders an element in a page's z-index stack.
 */
export function reorderElementZIndex(
  page: MagazinePage,
  elementId: string,
  action: 'front' | 'back' | 'forward' | 'backward',
): MagazinePage {
  const elements = [...page.elements];
  const index = elements.findIndex((el) => el.id === elementId);
  if (index === -1) return page;

  const el = elements[index];
  if (!el) return page;

  elements.splice(index, 1);

  if (action === 'front') {
    elements.push(el);
  } else if (action === 'back') {
    elements.unshift(el);
  } else if (action === 'forward') {
    const newIdx = Math.min(elements.length, index + 1);
    elements.splice(newIdx, 0, el);
  } else if (action === 'backward') {
    const newIdx = Math.max(0, index - 1);
    elements.splice(newIdx, 0, el);
  }

  // Normalize zIndex properties to match array order
  const normalized = elements.map((item, idx) => ({
    ...item,
    frame: { ...item.frame, zIndex: (idx + 1) * 10 },
  }));

  return { ...page, elements: normalized };
}

/**
 * Calculates snapping suggestions against page center, margins, and neighboring objects.
 */
export interface SnapResult {
  x: number;
  y: number;
  guides: Array<{ type: 'horizontal' | 'vertical'; position: number; label: string }>;
}

export function snapElementPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  otherElements: MagazineElement[],
  snapThreshold = 1.5, // % threshold
): SnapResult {
  const guides: SnapResult['guides'] = [];
  let snappedX = x;
  let snappedY = y;

  const cx = x + width / 2;
  const cy = y + height / 2;

  // 1. Snap to page center
  if (Math.abs(cx - 50) < snapThreshold) {
    snappedX = 50 - width / 2;
    guides.push({ type: 'vertical', position: 50, label: 'Center' });
  }
  if (Math.abs(cy - 50) < snapThreshold) {
    snappedY = 50 - height / 2;
    guides.push({ type: 'horizontal', position: 50, label: 'Middle' });
  }

  // 2. Snap to safe margins (4% and 96%)
  if (Math.abs(x - 4) < snapThreshold) {
    snappedX = 4;
    guides.push({ type: 'vertical', position: 4, label: 'Safe Margin' });
  }
  if (Math.abs(x + width - 96) < snapThreshold) {
    snappedX = 96 - width;
    guides.push({ type: 'vertical', position: 96, label: 'Safe Margin' });
  }
  if (Math.abs(y - 4) < snapThreshold) {
    snappedY = 4;
    guides.push({ type: 'horizontal', position: 4, label: 'Safe Margin' });
  }
  if (Math.abs(y + height - 96) < snapThreshold) {
    snappedY = 96 - height;
    guides.push({ type: 'horizontal', position: 96, label: 'Safe Margin' });
  }

  // 3. Snap to other elements' edges/centers
  for (const other of otherElements) {
    const ox = other.frame.x;
    const oy = other.frame.y;
    const ow = other.frame.width;
    const oh = other.frame.height;
    const ocx = ox + ow / 2;
    const ocy = oy + oh / 2;

    // Left-to-left
    if (Math.abs(x - ox) < snapThreshold) {
      snappedX = ox;
      guides.push({ type: 'vertical', position: ox, label: 'Align Left' });
    }
    // Right-to-right
    if (Math.abs(x + width - (ox + ow)) < snapThreshold) {
      snappedX = ox + ow - width;
      guides.push({ type: 'vertical', position: ox + ow, label: 'Align Right' });
    }
    // Center-to-center
    if (Math.abs(cx - ocx) < snapThreshold) {
      snappedX = ocx - width / 2;
      guides.push({ type: 'vertical', position: ocx, label: 'Align Center' });
    }
    // Top-to-top
    if (Math.abs(y - oy) < snapThreshold) {
      snappedY = oy;
      guides.push({ type: 'horizontal', position: oy, label: 'Align Top' });
    }
    // Bottom-to-bottom
    if (Math.abs(y + height - (oy + oh)) < snapThreshold) {
      snappedY = oy + oh - height;
      guides.push({ type: 'horizontal', position: oy + oh, label: 'Align Bottom' });
    }
    // Middle-to-middle
    if (Math.abs(cy - ocy) < snapThreshold) {
      snappedY = ocy - height / 2;
      guides.push({ type: 'horizontal', position: ocy, label: 'Align Middle' });
    }
  }

  return { x: snappedX, y: snappedY, guides };
}
