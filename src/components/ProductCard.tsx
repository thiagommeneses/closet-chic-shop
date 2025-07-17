import { useState } from 'react';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  id?: number | string;
  name?: string;
  price?: number;
  originalPrice?: number;
  image?: string | string[];
  isNew?: boolean;
  isOnSale?: boolean;
  discount?: number;
  className?: string;
  slug?: string;
  product?: Product;
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
  className = "",
  slug,
  product
}: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem, openCart } = useCart();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Use product data if provided, otherwise use individual props
  const productId = product?.id || id;
  const productName = product?.name || name;
  const productPrice = product?.sale_price || product?.price || price;
  const productOriginalPrice = product?.sale_price ? product?.price : originalPrice;
  const productImage = product?.images?.[0] || image;
  const productSlug = product?.slug || slug;
  
  const imageUrl = Array.isArray(productImage) ? productImage[0] : productImage;
  const isWishlisted = isFavorite(productId);
  
  // Check if product is new (created within last 7 days)
  const productIsNew = product ? (() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(product.created_at) > oneWeekAgo;
  })() : isNew;
  
  // Check if product is on sale
  const productIsOnSale = product ? (product.sale_price && product.sale_price < product.price) : isOnSale;
  
  // Calculate discount percentage
  const productDiscount = product && product.sale_price && product.price ? 
    Math.round(((product.price - product.sale_price) / product.price) * 100) : discount;

  const handleAddToCart = () => {
    addItem({
      id: typeof productId === 'string' ? parseInt(productId) : productId!,
      name: productName!,
      price: productPrice!,
      image: imageUrl!
    });
    openCart();
  };

  const handleToggleFavorite = () => {
    toggleFavorite({
      id: productId!,
      name: productName!,
      price: productPrice!,
      image: imageUrl!,
      slug: productSlug
    });
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
        {productIsNew && (
          <Badge className="bg-accent text-accent-foreground">
            NOVO
          </Badge>
        )}
        {productIsOnSale && productDiscount && (
          <Badge className="bg-primary text-primary-foreground">
            -{productDiscount}%
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
        onClick={handleToggleFavorite}
      >
        <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
      </Button>

      {/* Product Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={imageUrl || '/placeholder.svg'}
          alt={productName || 'Product'}
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
            onClick={() => productSlug && navigate(`/produto/${productSlug}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        <h3 
          className="font-medium text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 cursor-pointer"
          onClick={() => productSlug && navigate(`/produto/${productSlug}`)}
        >
          {productName}
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-primary">
            {formatPrice(productPrice!)}
          </span>
          {productOriginalPrice && productOriginalPrice > productPrice! && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(productOriginalPrice)}
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          ou 3x de {formatPrice(productPrice! / 3)} sem juros
        </div>
      </div>
    </div>
  );
};