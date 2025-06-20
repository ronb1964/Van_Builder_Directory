/**
 * API utility functions for secure API access
 */

/**
 * Gets the Google Maps API key with validation
 * @returns The API key or throws an error if not available
 */
export const getGoogleMapsApiKey = (): string => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('Google Maps API key is not set. Please set REACT_APP_GOOGLE_MAPS_API_KEY in your environment variables.');
    // Return a placeholder that will trigger the error UI rather than exposing that the key is missing
    return 'MISSING_API_KEY';
  }
  
  return apiKey;
};

/**
 * Validates external URLs to prevent security issues
 * @param url The URL to validate
 * @returns True if the URL is valid and from an allowed domain
 */
export const isValidExternalUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    
    // List of allowed domains for external resources
    const allowedDomains = [
      'maps.google.com',
      'maps.googleapis.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'example.com', // Replace with actual domains used in your app
      'images.squarespace-cdn.com',
      'img.freepik.com'
    ];
    
    return allowedDomains.some(domain => urlObj.hostname.endsWith(domain));
  } catch (e) {
    console.error('Invalid URL:', url);
    return false;
  }
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input The user input to sanitize
 * @returns Sanitized input string
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Basic sanitization - replace HTML special chars
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
