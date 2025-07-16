import { useFavorites } from '@/contexts/FavoritesContext';
import { FavoritesList } from '@/components/FavoritesList';

export const FavoritesDrawer = () => {
  const { isOpen, closeFavorites } = useFavorites();
  
  return (
    <FavoritesList 
      isOpen={isOpen} 
      onClose={closeFavorites}
    />
  );
};