import { useState, useEffect, useCallback } from 'react';
import { Builder } from '../types';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Builder[]>([]);

  // Load favorites from localStorage on initial load
  useEffect(() => {
    const storedFavorites = localStorage.getItem('favoriteBuilders');
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch (error) {
        console.error('Failed to parse favorites from localStorage', error);
        localStorage.removeItem('favoriteBuilders');
      }
    }
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem('favoriteBuilders', JSON.stringify(favorites));
  }, [favorites]);

  // Add a builder to favorites
  const addFavorite = useCallback((builder: Builder) => {
    setFavorites(prev => {
      // Check if builder is already in favorites
      if (prev.some(fav => fav.id === builder.id)) {
        return prev;
      }
      return [...prev, builder];
    });
  }, []);

  // Remove a builder from favorites
  const removeFavorite = useCallback((builderId: string | number) => {
    setFavorites(prev => prev.filter(builder => builder.id !== builderId));
  }, []);

  // Check if a builder is in favorites
  const isFavorite = useCallback((builderId: string | number) => {
    return favorites.some(builder => builder.id === builderId);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite
  };
};
