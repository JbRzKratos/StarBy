export const MAX_FILE_SIZE_MB = 15;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImage(file: File): ValidationResult {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please upload a JPG, PNG, or WebP image.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` };
  }

  return { valid: true };
}

export interface DimensionRequirement {
  minWidth: number;
  minHeight: number;
  recommendedText: string;
}

export function validateImageDimensions(
  file: File,
  req: DimensionRequirement,
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width < req.minWidth || img.height < req.minHeight) {
        resolve({
          valid: false,
          error: `Image is too small (${img.width}x${img.height}px). Minimum required size is ${req.minWidth}x${req.minHeight}px. ${req.recommendedText}`,
        });
      } else {
        resolve({ valid: true });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: false, error: 'Failed to read image dimensions.' });
    };
    img.src = objectUrl;
  });
}

// Helper to convert File to Data URL
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
