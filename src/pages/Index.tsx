import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { DualBannerSection } from '@/components/BannerSection';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductCard } from '@/components/ProductCard';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';

// Import product images
import productDress1 from '@/assets/product-dress-1.jpg';
import productBlouse1 from '@/assets/product-blouse-1.jpg';
import productSkirt1 from '@/assets/product-skirt-1.jpg';
import productJacket1 from '@/assets/product-jacket-1.jpg';

const Index = () => {
  // Mock product data
  const newProducts = [
    {
      id: 1,
      name: "Vestido Midi Elegante",
      price: 189.90,
      originalPrice: 259.90,
      image: productDress1,
      isNew: true,
      isOnSale: true,
      discount: 27
    },
    {
      id: 2,
      name: "Blusa Clássica Branca",
      price: 99.90,
      image: productBlouse1,
      isNew: true
    },
    {
      id: 3,
      name: "Saia Midi Preta",
      price: 129.90,
      originalPrice: 179.90,
      image: productSkirt1,
      isOnSale: true,
      discount: 28
    },
    {
      id: 4,
      name: "Jaqueta Jeans Casual",
      price: 159.90,
      image: productJacket1,
      isNew: true
    },
    {
      id: 5,
      name: "Vestido Floral Verão",
      price: 199.90,
      originalPrice: 279.90,
      image: productDress1,
      isOnSale: true,
      discount: 29
    },
    {
      id: 6,
      name: "Blusa Decote V",
      price: 89.90,
      image: productBlouse1
    },
    {
      id: 7,
      name: "Saia Plissada",
      price: 149.90,
      image: productSkirt1,
      isNew: true
    },
    {
      id: 8,
      name: "Blazer Estruturado",
      price: 219.90,
      originalPrice: 289.90,
      image: productJacket1,
      isOnSale: true,
      discount: 24
    }
  ];

  const bestSellers = [
    {
      id: 9,
      name: "Vestido Festa Elegante",
      price: 299.90,
      image: productDress1
    },
    {
      id: 10,
      name: "Camisa Social Feminina",
      price: 119.90,
      image: productBlouse1
    },
    {
      id: 11,
      name: "Saia Lápis Executiva",
      price: 139.90,
      image: productSkirt1
    },
    {
      id: 12,
      name: "Casaco Inverno",
      price: 189.90,
      image: productJacket1
    }
  ];

  return (
    <div className="min-h-screen bg-background">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newProducts.slice(4, 8).map((product) => (
              <ProductCard
                key={product.id}
                {...product}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Large promotional banner */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-hero rounded-lg p-12 text-center text-white min-h-[400px] flex items-center justify-center">
            <div>
              <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">
                CLOSET COLLECTION
              </h2>
              <p className="text-lg md:text-xl opacity-90">
                Elegância e sofisticação em cada detalhe
              </p>
            </div>
          </div>
        </div>
      </section>

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
