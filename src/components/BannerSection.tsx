import { Button } from '@/components/ui/button';

interface BannerProps {
  title: string;
  subtitle?: string;
  image: string;
  ctaText?: string;
  ctaUrl?: string;
  size?: 'small' | 'medium' | 'large';
}

export const BannerSection = ({ 
  title, 
  subtitle, 
  image, 
  ctaText, 
  ctaUrl, 
  size = 'medium' 
}: BannerProps) => {
  const heightClass = {
    small: 'h-48 md:h-64',
    medium: 'h-64 md:h-80',
    large: 'h-80 md:h-96'
  }[size];

  return (
    <div className={`relative ${heightClass} overflow-hidden rounded-lg group`}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url(${image})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-center items-center text-center text-white p-6">
        <h3 className="font-serif text-2xl md:text-3xl font-bold mb-2">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm md:text-base mb-4 max-w-md">
            {subtitle}
          </p>
        )}
        {ctaText && (
          <Button variant="elegant" size="lg">
            {ctaText}
          </Button>
        )}
      </div>
    </div>
  );
};

export const DualBannerSection = () => {
  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BannerSection
            title="VESTIDOS"
            subtitle="Seja um esplendor"
            image="/lovable-uploads/15cbb06f-7302-4a5d-92d4-0fc95fb32b48.png"
            ctaText="Comprar Agora"
            size="medium"
          />
          <BannerSection
            title="SEJA UM ESPLENDOR"
            subtitle="Descubra os últimos hits"
            image="/lovable-uploads/15cbb06f-7302-4a5d-92d4-0fc95fb32b48.png"
            ctaText="Descobrir"
            size="medium"
          />
        </div>
      </div>
    </section>
  );
};