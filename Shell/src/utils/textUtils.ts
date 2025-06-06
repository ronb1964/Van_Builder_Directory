/**
 * Text formatting utilities for consistent display across the application
 */

/**
 * Transforms a string to title case (first letter of each word capitalized)
 * Handles ALL CAPS names from database and ensures consistent formatting
 * 
 * @param text - The text to transform
 * @returns The text in title case format
 * 
 * @example
 * formatToTitleCase("ALABAMA CUSTOM TRAILER & RV") // "Alabama Custom Trailer & Rv"
 * formatToTitleCase("gearbox adventure rentals") // "Gearbox Adventure Rentals"
 */
export const formatToTitleCase = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats builder names specifically for display
 * Currently uses title case formatting but can be extended for special cases
 * 
 * @param name - The builder name to format
 * @returns The formatted builder name
 */
export const formatBuilderName = (name: string): string => {
  return formatToTitleCase(name);
};
