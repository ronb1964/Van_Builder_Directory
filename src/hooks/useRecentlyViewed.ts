import { useState, useEffect, useCallback } from 'react';
import { Builder } from '../types';

const MAX_RECENT_ITEMS = 5;

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<Builder[]>([]);

  // Load recently viewed from localStorage on initial load
  useEffect(() => {
    const storedRecent = localStorage.getItem('recentlyViewedBuilders');
    if (storedRecent) {
      try {
        setRecentlyViewed(JSON.parse(storedRecent));
      } catch (error) {
        console.error('Failed to parse recently viewed from localStorage', error);
        localStorage.removeItem('recentlyViewedBuilders');
      }
    }
  }, []);

  // Save recently viewed to localStorage when they change
  useEffect(() => {
    localStorage.setItem('recentlyViewedBuilders', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Add a builder to recently viewed
  const addToRecentlyViewed = useCallback((builder: Builder) => {
    setRecentlyViewed(prev => {
      // Remove the builder if it's already in the list
      const filtered = prev.filter(item => item.id !== builder.id);
      
      // Add the builder to the beginning of the list
      const updated = [builder, ...filtered];
      
      // Limit the list to MAX_RECENT_ITEMS
      return updated.slice(0, MAX_RECENT_ITEMS);
    });
  }, []);

  // Clear recently viewed list
  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem('recentlyViewedBuilders');
  }, []);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed
  };
};
