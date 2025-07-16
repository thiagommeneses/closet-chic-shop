import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useBanners } from '@/hooks/useBanners';
import { HalfBannerCard } from './HalfBannerCard';

interface BannerProps {
  title: string;
  subtitle?: string;
  image: string;
  ctaText?: string;
  ctaUrl?: string;
  size?: 'small' | 'medium' | 'large';
  imagePosition?: string;
  imageFit?: string;
}

export const BannerSection = ({ 
  title, 
  subtitle, 
  image, 
  ctaText, 
  ctaUrl, 
  size = 'medium',
  imagePosition = 'center',
  imageFit = 'cover'
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
        className={`absolute inset-0 bg-no-repeat transition-transform duration-500 group-hover:scale-105 ${
          imageFit === 'contain' ? 'bg-contain' : 
          imageFit === 'fill' ? 'bg-cover' : 'bg-cover'
        } ${
          imagePosition === 'top' ? 'bg-top' :
          imagePosition === 'bottom' ? 'bg-bottom' :
          imagePosition === 'left' ? 'bg-left' :
          imagePosition === 'right' ? 'bg-right' :
          imagePosition === 'top-left' ? 'bg-left-top' :
          imagePosition === 'top-right' ? 'bg-right-top' :
          imagePosition === 'bottom-left' ? 'bg-left-bottom' :
          imagePosition === 'bottom-right' ? 'bg-right-bottom' : 'bg-center'
        }`}
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
            <div className="aspect-[4/3] md:aspect-[3/2] bg-muted animate-pulse rounded-xl" />
            <div className="aspect-[4/3] md:aspect-[3/2] bg-muted animate-pulse rounded-xl" />
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
            <HalfBannerCard key={banner.id} banner={banner} />
          ))}
        </div>
      </div>
    </section>
  );
};