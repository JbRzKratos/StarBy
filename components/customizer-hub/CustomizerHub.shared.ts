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

// Helper to convert File to Data URL
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
