import { useCallback } from 'react';
import { scrollToElement } from '../utils/scrollUtils';

/**
 * Custom hook to handle scrolling to search results
 */
export const useScrollToResults = () => {
  /**
   * Scroll to the search results container
   * @param delay Delay in milliseconds before scrolling
   * @param offset Offset from the top of the element in pixels
   */
  const scrollToResults = useCallback((delay = 500, offset = 100) => {
    setTimeout(() => {
      scrollToElement('search-results', offset);
    }, delay);
  }, []);

  return scrollToResults;
};
