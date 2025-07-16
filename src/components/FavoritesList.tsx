import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface FavoritesListProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FavoritesList = ({ isOpen, onClose }: FavoritesListProps) => {
  const { favorites, removeFromFavorites } = useFavorites();
  const { addItem, openCart } = useCart();
  const navigate = useNavigate();

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleAddToCart = (favorite: any) => {
    addItem({
      id: typeof favorite.id === 'string' ? parseInt(favorite.id) : favorite.id,
      name: favorite.name,
      price: favorite.price,
      image: favorite.image,
      quantity: 1
    });
    
    // Show success feedback
    openCart();
    onClose();
  };

  const handleViewProduct = (slug?: string) => {
    if (slug) {
      navigate(`/produto/${slug}`);
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Meus Favoritos ({favorites.length})
          </SheetTitle>
          <SheetDescription>
            {favorites.length === 0 
              ? 'Sua lista de favoritos está vazia' 
              : 'Seus produtos favoritos salvos'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-120px)]">
          {favorites.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <Heart className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Sua lista de favoritos está vazia.<br />
                Adicione produtos que você gosta para salvá-los aqui.
              </p>
              <Button onClick={onClose} variant="elegant">
                Explorar Produtos
              </Button>
            </div>
          ) : (
            <>
              {/* Favorites Items */}
              <div className="flex-1 overflow-y-auto space-y-4 py-6 min-h-0">
                {favorites.map((favorite) => (
                  <div key={favorite.id} className="flex gap-3 p-3 border border-border rounded-lg">
                    <img
                      src={favorite.image}
                      alt={favorite.name}
                      className="w-16 h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleViewProduct(favorite.slug)}
                    />
                    
                    <div className="flex-1 space-y-2">
                      <h4 
                        className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleViewProduct(favorite.slug)}
                      >
                        {favorite.name}
                      </h4>
                      <p className="text-primary font-semibold">
                        {formatPrice(favorite.price)}
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="elegant"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAddToCart(favorite)}
                        >
                          <ShoppingBag className="h-3 w-3 mr-1" />
                          Comprar
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeFromFavorites(favorite.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-4 pb-6 space-y-3 mt-auto">
                <div className="text-center text-sm text-muted-foreground">
                  {favorites.length} {favorites.length === 1 ? 'produto salvo' : 'produtos salvos'}
                </div>
                
                <Button 
                  variant="minimal" 
                  className="w-full"
                  onClick={onClose}
                >
                  Continuar Navegando
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};