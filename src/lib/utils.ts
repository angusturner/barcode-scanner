import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to YYYY-MM-DD
export function formatDate(date: Date | undefined): string {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// Calculate days until expiration
export function daysUntilExpiration(expirationDate: Date | undefined): number {
  if (!expirationDate) return Infinity;
  
  const now = new Date();
  const expDate = new Date(expirationDate);
  
  // Reset time part to compare only dates
  now.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);
  
  const diffTime = expDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// Get category icons for inventory items
export function getCategoryIcon(category: string): string {
  const categoryMap: Record<string, string> = {
    'fruits': '🍎',
    'vegetables': '🥦',
    'dairy': '🥛',
    'meat': '🥩',
    'seafood': '🐟',
    'grains': '🌾',
    'snacks': '🍪',
    'beverages': '🥤',
    'condiments': '🧂',
    'baking': '🍞',
    'canned': '🥫',
    'frozen': '❄️',
    'spices': '🌶️',
  };
  
  return categoryMap[category.toLowerCase()] || '📦';
}

// Format recipe time (minutes to human-readable)
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
}