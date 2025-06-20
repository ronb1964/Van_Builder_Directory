/**
 * Content Security Policy configuration
 * This script adds security headers to the application
 */

// Add Content Security Policy headers
const addSecurityHeaders = () => {
  try {
    // Define allowed sources for different resource types
    const cspDirectives = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "*.googleapis.com", "*.gstatic.com"],
      'style-src': ["'self'", "'unsafe-inline'", "*.googleapis.com", "*.gstatic.com"],
      'img-src': ["'self'", "data:", "*.googleapis.com", "*.gstatic.com", "https://static.wixstatic.com", "https://vanquestak.com", "https://papagovans.com", "https://lirp.cdn-website.com", "https://ucarecdn.com", "https://images.squarespace-cdn.com", "https://www.ozkcustoms.com", "https://camplifecustoms.com", "https://www.outpostvans.com", "https://outpostvans.files.wordpress.com", "https://maps.google.com", "https://maps.gstatic.com", "https://maps.googleapis.com", "https://*.google.com", "https://*.gstatic.com", "https://*.googleapis.com", "https://*.freepik.com", "https://images.unsplash.com", "https://advanced-rv.com", "https://*.advanced-rv.com", "https://images.ctfassets.net", "https://*.cdninstagram.com", "https://*.fbcdn.net", "https://www.exclusiveoutfitters.com", "https://www.vanspeedshop.com", "https://canoconversions.com", "https://www.titanvans.com", "https://vikingvancustoms.com", "https://woodpeckercraftsandbuilds.com", "https://thesummitvans.com", "https://scamperrv.com"],
      'font-src': ["'self'", "*.googleapis.com", "*.gstatic.com"],
      'connect-src': ["'self'", "*.googleapis.com", "*.gstatic.com"],
      'frame-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"]
    };

    // Build CSP string
    const cspString = Object.entries(cspDirectives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');

    // Create and append the CSP meta tag
    const metaTag = document.createElement('meta');
    metaTag.httpEquiv = 'Content-Security-Policy';
    metaTag.content = cspString;
    document.head.appendChild(metaTag); // Re-enabled
    
    console.log('Security headers applied successfully');

    // Add additional security headers as meta tags
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    // Add security header meta tags
    Object.entries(securityHeaders).forEach(([header, value]) => {
      const meta = document.createElement('meta');
      meta.httpEquiv = header;
      meta.content = value;
      document.head.appendChild(meta);
    });
  } catch (error) {
    console.error('Failed to apply security headers:', error);
  }
};

// Execute when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addSecurityHeaders);
} else {
  addSecurityHeaders();
}
