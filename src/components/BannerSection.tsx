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
            <div key={banner.id} className="relative h-64 md:h-80 overflow-hidden rounded-xl bg-muted group">
              {/* Background Image or Video */}
              {banner.video_url ? (
                <video
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 rounded-xl"
                  src={banner.video_url}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <>
                  {/* Desktop Image */}
                  <div 
                    className={`absolute inset-0 bg-muted bg-no-repeat transition-transform duration-500 group-hover:scale-105 hidden md:block rounded-xl ${
                      banner.image_fit === 'contain' ? 'bg-contain' : 
                      banner.image_fit === 'fill' ? 'bg-cover' : 'bg-cover'
                    } ${
                      banner.image_position === 'top' ? 'bg-top' :
                      banner.image_position === 'bottom' ? 'bg-bottom' :
                      banner.image_position === 'left' ? 'bg-left' :
                      banner.image_position === 'right' ? 'bg-right' :
                      banner.image_position === 'top-left' ? 'bg-left-top' :
                      banner.image_position === 'top-right' ? 'bg-right-top' :
                      banner.image_position === 'bottom-left' ? 'bg-left-bottom' :
                      banner.image_position === 'bottom-right' ? 'bg-right-bottom' : 'bg-center'
                    }`}
                    style={{ backgroundImage: `url(${banner.desktop_image_url})` }}
                  />
                  {/* Mobile Image */}
                  <div 
                    className={`absolute inset-0 bg-muted bg-no-repeat transition-transform duration-500 group-hover:scale-105 block md:hidden rounded-xl ${
                      banner.image_fit === 'contain' ? 'bg-contain' : 
                      banner.image_fit === 'fill' ? 'bg-cover' : 'bg-cover'
                    } ${
                      banner.image_position === 'top' ? 'bg-top' :
                      banner.image_position === 'bottom' ? 'bg-bottom' :
                      banner.image_position === 'left' ? 'bg-left' :
                      banner.image_position === 'right' ? 'bg-right' :
                      banner.image_position === 'top-left' ? 'bg-left-top' :
                      banner.image_position === 'top-right' ? 'bg-right-top' :
                      banner.image_position === 'bottom-left' ? 'bg-left-bottom' :
                      banner.image_position === 'bottom-right' ? 'bg-right-bottom' : 'bg-center'
                    }`}
                    style={{ backgroundImage: `url(${banner.mobile_image_url || banner.desktop_image_url})` }}
                  />
                </>
              )}
              
              {/* Overlay - only show when there's content */}
              {(banner.title || banner.subtitle || banner.button_text) && (
                <div className="absolute inset-0 bg-black/30" />
              )}
              
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