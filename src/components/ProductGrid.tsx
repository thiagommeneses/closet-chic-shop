import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  isNew?: boolean;
  isOnSale?: boolean;
  discount?: number;
}

interface ProductGridProps {
  title: string;
  subtitle?: string;
  products: Product[];
  showViewMore?: boolean;
}

export const ProductGrid = ({ 
  title, 
  subtitle, 
  products, 
  showViewMore = true 
}: ProductGridProps) => {
  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground text-lg">
              {subtitle}
            </p>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
            />
          ))}
        </div>

        {/* View More Button */}
        {showViewMore && (
          <div className="text-center mt-8">
            <Button 
              variant="minimal" 
              size="lg"
              className="min-w-[200px]"
            >
              Ver mais
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};