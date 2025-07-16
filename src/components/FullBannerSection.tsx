import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useBanners } from '@/hooks/useBanners';

export const FullBannerSection = () => {
  const { getFullBanners, loading } = useBanners();
  const fullBanners = getFullBanners();

  if (loading) {
    return (
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </section>
    );
  }

  if (fullBanners.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto space-y-6">
        {fullBanners.map((banner) => (
          <div key={banner.id} className="relative h-96 overflow-hidden rounded-lg group">
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
              <>
                {/* Desktop Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105 hidden md:block"
                  style={{ backgroundImage: `url(${banner.desktop_image_url})` }}
                />
                {/* Mobile Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105 block md:hidden"
                  style={{ backgroundImage: `url(${banner.mobile_image_url || banner.desktop_image_url})` }}
                />
              </>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30" />
            
            {/* Content */}
            <div className="relative h-full flex flex-col justify-center items-center text-center text-white p-6">
              {banner.title && (
                <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">
                  {banner.title}
                </h2>
              )}
              {banner.subtitle && (
                <p className="text-lg md:text-xl mb-6 max-w-2xl">
                  {banner.subtitle}
                </p>
              )}
              {banner.button_text && banner.button_link && (
                <Button variant="elegant" size="lg" asChild>
                  <Link to={banner.button_link}>
                    {banner.button_text}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};