/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gets the initials from a full name (e.g., "Daniel Nefro" -> "DN").
 * Returns "U" if no name is provided.
 */
export function getInitials(name?: string): string {
  if (!name || name.trim() === '') return 'U'
  const names = name.trim().split(/\s+/)
  if (names.length === 1) return names[0].charAt(0).toUpperCase()
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
}
