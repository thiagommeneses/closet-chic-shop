import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useBanners } from '@/hooks/useBanners';

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
  const { getHalfBanners, loading } = useBanners();
  const halfBanners = getHalfBanners();

  if (loading) {
    return (
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 md:h-80 bg-muted animate-pulse rounded-lg" />
            <div className="h-64 md:h-80 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </section>
    );
  }

  if (halfBanners.length === 0) {
    return (
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="text-center text-muted-foreground">
            <p>Nenhum banner lateral configurado</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {halfBanners.map((banner) => (
            <div key={banner.id} className="relative h-64 md:h-80 overflow-hidden rounded-lg group">
              {/* Background Image or Video */}
              {banner.video_url ? (
                <video
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={banner.video_url}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${banner.image_url})` }}
                />
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/30" />
              
              {/* Content */}
              <div className="relative h-full flex flex-col justify-center items-center text-center text-white p-6">
                {banner.title && (
                  <h3 className="font-serif text-2xl md:text-3xl font-bold mb-2">
                    {banner.title}
                  </h3>
                )}
                {banner.subtitle && (
                  <p className="text-sm md:text-base mb-4 max-w-md">
                    {banner.subtitle}
                  </p>
                )}
                {banner.button_text && (
                  <Button variant="elegant" size="lg" asChild>
                    <Link to={banner.button_link || '/'}>
                      {banner.button_text}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};