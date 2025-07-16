import { Header } from '@/components/Header';
import { TopBanner } from '@/components/TopBanner';
import { HeroSection } from '@/components/HeroSection';
import { DualBannerSection } from '@/components/BannerSection';
import { FullBannerSection } from '@/components/FullBannerSection';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductCard } from '@/components/ProductCard';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { useProducts } from '@/hooks/useProducts';
import { mapProductToCardData } from '@/utils/productUtils';

// Import fallback product images
import productDress1 from '@/assets/product-dress-1.jpg';
import productBlouse1 from '@/assets/product-blouse-1.jpg';
import productSkirt1 from '@/assets/product-skirt-1.jpg';
import productJacket1 from '@/assets/product-jacket-1.jpg';

const Index = () => {
  const { products, loading, error } = useProducts();

  // Fallback mock products for when there are no products in the database
  const fallbackProducts = [
    {
      id: '1',
      name: "Vestido Midi Elegante",
      price: 189.90,
      originalPrice: 259.90,
      image: [productDress1],
      isNew: true,
      isOnSale: true,
      discount: 27,
      slug: 'vestido-midi-elegante'
    },
    {
      id: '2',
      name: "Blusa Clássica Branca",
      price: 99.90,
      image: [productBlouse1],
      isNew: true,
      slug: 'blusa-classica-branca'
    },
    {
      id: '3',
      name: "Saia Midi Preta",
      price: 129.90,
      originalPrice: 179.90,
      image: [productSkirt1],
      isOnSale: true,
      discount: 28,
      slug: 'saia-midi-preta'
    },
    {
      id: '4',
      name: "Jaqueta Jeans Casual",
      price: 159.90,
      image: [productJacket1],
      isNew: true,
      slug: 'jaqueta-jeans-casual'
    },
    {
      id: '5',
      name: "Vestido Floral Verão",
      price: 199.90,
      originalPrice: 279.90,
      image: [productDress1],
      isOnSale: true,
      discount: 29,
      slug: 'vestido-floral-verao'
    },
    {
      id: '6',
      name: "Blusa Decote V",
      price: 89.90,
      image: [productBlouse1],
      slug: 'blusa-decote-v'
    },
    {
      id: '7',
      name: "Saia Plissada",
      price: 149.90,
      image: [productSkirt1],
      isNew: true,
      slug: 'saia-plissada'
    },
    {
      id: '8',
      name: "Blazer Estruturado",
      price: 219.90,
      originalPrice: 289.90,
      image: [productJacket1],
      isOnSale: true,
      discount: 24,
      slug: 'blazer-estruturado'
    }
  ];

  // Process real products or use fallbacks
  const processedProducts = products.length > 0 
    ? products.map(mapProductToCardData)
    : fallbackProducts;

  // Get new products (first 8)
  const newProducts = processedProducts.slice(0, 8);
  
  // Get featured/best sellers (next 4 or first 4 if not enough products)
  const bestSellers = processedProducts.length > 8 
    ? processedProducts.slice(8, 12)
    : processedProducts.slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading products:', error);
    // Continue with fallback products on error
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBanner />
      <Header />
      <HeroSection />
      <DualBannerSection />
      
      {/* NEWS Section - Grid 4x2 */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
              NEWS
            </h2>
            {products.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Exibindo produtos de demonstração
              </p>
            )}
          </div>

          {/* First row - 4 products */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
            {newProducts.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                {...product}
              />
            ))}
          </div>

          {/* Second row - 4 products */}
          {newProducts.length > 4 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {newProducts.slice(4, 8).map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Full Banner Section */}
      <FullBannerSection />

      {/* BEST SELLERS Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
              BEST SELLERS
            </h2>
          </div>

          {/* Horizontal scroll for best sellers */}
          <div className="overflow-x-auto">
            <div className="flex gap-4 md:gap-6 min-w-max pb-4">
              {bestSellers.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-64">
                  <ProductCard {...product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;