import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge multiple class names with tailwind classes using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a URL-friendly slug from a string preserving Arabic characters
 */
export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // Keep Unicode letters/numbers, spaces, hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}

/**
 * Formats date to Arabic locale
 */
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Calculates estimated reading time in minutes
 */
export function getReadingTime(text: string) {
  const wordsPerMinute = 200;
  const numberOfWords = text.split(/\s/g).length;
  const minutes = Math.ceil(numberOfWords / wordsPerMinute);
  return `${minutes} دقيقة للقراءة`;
}

/**
 * Safely trims text at the last full word before maxLength for clean meta descriptions
 */
export function getCleanDescription(text: string | null | undefined, maxLength = 160): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const trimmed = clean.slice(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace > 0) {
    return trimmed.slice(0, lastSpace) + '...';
  }
  return trimmed + '...';
}

export const truncateDescription = getCleanDescription;
