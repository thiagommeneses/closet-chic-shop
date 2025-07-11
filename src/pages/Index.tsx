import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { DualBannerSection } from '@/components/BannerSection';
import { ProductGrid } from '@/components/ProductGrid';
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
      
      <ProductGrid 
        title="NEWS"
        subtitle="Confira com as últimas novidades que chegaram na loja!"
        products={newProducts}
      />

      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-hero rounded-lg p-12 text-center text-white">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              FOTO OU IMAGEM
            </h2>
            <p className="text-lg opacity-90">
              Banner promocional destacando ofertas especiais
            </p>
          </div>
        </div>
      </section>

      <ProductGrid 
        title="MAIS VENDIDOS"
        subtitle="Produtos com mais saída no seu estoque, recomendado"
        products={bestSellers}
      />

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
