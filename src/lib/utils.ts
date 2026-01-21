import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number for display in statistics
 * - Numbers > 99,999: Shows with 'k' suffix (e.g., 234567 -> 234k)
 * - Numbers > 999: Shows with thousands separator (e.g., 1234 -> 1.234)
 * - Numbers <= 999: Shows as-is
 */
export function formatStatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  // If > 99,999, show with 'k' suffix (truncate, don't round)
  if (absNum > 99999) {
    const kValue = Math.floor(absNum / 1000);
    return `${sign}${kValue}k`;
  }
  
  // If > 999, show with thousands separator (point)
  if (absNum > 999) {
    return `${sign}${Math.round(absNum).toLocaleString('es-ES')}`;
  }
  
  // Otherwise, show as integer
  return `${sign}${Math.round(absNum)}`;
}
