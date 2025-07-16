import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface FavoriteItem {
  id: number | string;
  name: string;
  price: number;
  image: string;
  slug?: string;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  addToFavorites: (item: FavoriteItem) => void;
  removeFromFavorites: (itemId: number | string) => void;
  isFavorite: (itemId: number | string) => boolean;
  toggleFavorite: (item: FavoriteItem) => void;
  isOpen: boolean;
  openFavorites: () => void;
  closeFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

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
      toast({
        title: "Removido dos favoritos",
        description: `${item.name} foi removido da sua lista de favoritos.`,
      });
    } else {
      addToFavorites(item);
      toast({
        title: "Adicionado aos favoritos ❤️",
        description: `${item.name} foi salvo na sua lista de favoritos.`,
      });
    }
  };

  const openFavorites = () => {
    setIsOpen(true);
  };

  const closeFavorites = () => {
    setIsOpen(false);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleFavorite,
        isOpen,
        openFavorites,
        closeFavorites
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};