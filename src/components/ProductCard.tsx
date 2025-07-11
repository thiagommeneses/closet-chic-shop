import { useState } from 'react';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  isNew?: boolean;
  isOnSale?: boolean;
  discount?: number;
  className?: string;
}

export const ProductCard = ({ 
  id, 
  name, 
  price, 
  originalPrice, 
  image, 
  isNew, 
  isOnSale, 
  discount,
  className = ""
}: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { addItem, openCart } = useCart();

  const handleAddToCart = () => {
    addItem({
      id,
      name,
      price,
      image
    });
    openCart();
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div 
      className={`group relative bg-card rounded-lg overflow-hidden shadow-card hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {isNew && (
          <Badge className="bg-accent text-accent-foreground">
            NOVO
          </Badge>
        )}
        {isOnSale && discount && (
          <Badge className="bg-primary text-primary-foreground">
            -{discount}%
          </Badge>
        )}
      </div>

      {/* Wishlist Button */}
      <Button
        variant="ghost"
        size="icon"
        className={`absolute top-3 right-3 z-10 bg-white/80 hover:bg-white transition-all duration-300 ${
          isWishlisted ? 'text-primary' : 'text-muted-foreground hover:text-primary'
        }`}
        onClick={() => setIsWishlisted(!isWishlisted)}
      >
        <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
      </Button>

      {/* Product Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Quick Actions Overlay */}
        <div 
          className={`absolute inset-0 bg-black/20 flex items-center justify-center gap-2 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button
            variant="elegant"
            size="sm"
            className="transform scale-95 hover:scale-100 transition-transform"
            onClick={handleAddToCart}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Comprar
          </Button>
          <Button
            variant="minimal"
            size="icon"
            className="bg-white/90 hover:bg-white"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
          {name}
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-primary">
            {formatPrice(price)}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          ou 3x de {formatPrice(price / 3)} sem juros
        </div>
      </div>
    </div>
  );
};