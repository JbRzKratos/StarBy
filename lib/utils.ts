import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with proper conflict resolution.
 * Used across all components for className composition.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
