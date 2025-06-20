/**
 * Utility functions for smooth scrolling
 */

/**
 * Smoothly scroll to a specific element
 * @param elementId The ID of the element to scroll to
 * @param offset Optional offset from the top of the element (in pixels)
 * @param duration Duration of the scroll animation in milliseconds
 */
export const scrollToElement = (elementId: string, offset = 0, duration = 800): void => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.warn(`Element with ID "${elementId}" not found`);
    return;
  }
  
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};

/**
 * Center an element on the screen (especially useful for mobile)
 * @param elementId The ID of the element to center
 * @param duration Duration of the scroll animation in milliseconds
 */
export const centerElementOnScreen = (elementId: string, duration = 800): void => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.warn(`Element with ID "${elementId}" not found`);
    return;
  }
  
  const elementRect = element.getBoundingClientRect();
  const elementTop = elementRect.top + window.pageYOffset;
  const elementHeight = elementRect.height;
  const windowHeight = window.innerHeight;
  
  // Calculate position to center the element on screen
  const centerPosition = elementTop - (windowHeight / 2) + (elementHeight / 2);
  
  window.scrollTo({
    top: Math.max(0, centerPosition), // Don't scroll above the page
    behavior: 'smooth'
  });
};

/**
 * Smoothly scroll to a specific position
 * @param position Position to scroll to (in pixels)
 * @param duration Duration of the scroll animation in milliseconds
 */
export const scrollToPosition = (position: number, duration = 800): void => {
  window.scrollTo({
    top: position,
    behavior: 'smooth'
  });
};
