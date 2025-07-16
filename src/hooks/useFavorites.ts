import { useState, useEffect } from 'react';

export interface FavoriteItem {
  id: number | string;
  name: string;
  price: number;
  image: string;
  slug?: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem('favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = (newFavorites: FavoriteItem[]) => {
    try {
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const addToFavorites = (item: FavoriteItem) => {
    const newFavorites = [...favorites, item];
    saveFavorites(newFavorites);
  };

  const removeFromFavorites = (itemId: number | string) => {
    const newFavorites = favorites.filter(item => item.id !== itemId);
    saveFavorites(newFavorites);
  };

  const isFavorite = (itemId: number | string) => {
    return favorites.some(item => item.id === itemId);
  };

  const toggleFavorite = (item: FavoriteItem) => {
    if (isFavorite(item.id)) {
      removeFromFavorites(item.id);
    } else {
      addToFavorites(item);
    }
  };

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite
  };
};