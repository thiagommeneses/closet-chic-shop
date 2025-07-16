import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Banner } from '@/hooks/useBanners';

interface HalfBannerCardProps {
  banner: Banner;
}

export const HalfBannerCard = ({ banner }: HalfBannerCardProps) => {
  const hasContent = banner.title || banner.subtitle || banner.button_text;
  
  return (
    <div className="relative group">
      {/* Container with aspect ratio */}
      <div className="relative aspect-[29/10] overflow-hidden rounded-xl bg-muted">
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
              className={`absolute inset-0 bg-muted bg-no-repeat transition-transform duration-500 group-hover:scale-105 hidden md:block ${
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
              style={{ backgroundImage: banner.desktop_image_url ? `url(${banner.desktop_image_url})` : 'none' }}
            />
            {/* Mobile Image */}
            <div 
              className={`absolute inset-0 bg-muted bg-no-repeat transition-transform duration-500 group-hover:scale-105 block md:hidden ${
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
              style={{ backgroundImage: (banner.mobile_image_url || banner.desktop_image_url) ? `url(${banner.mobile_image_url || banner.desktop_image_url})` : 'none' }}
            />
          </>
        )}
        
        {/* Overlay - only show when there's content */}
        {hasContent && (
          <div className="absolute inset-0 bg-black/30" />
        )}
        
        {/* Content */}
        {hasContent && (
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-4 md:p-6">
            {banner.title && (
              <h3 className="font-serif text-xl md:text-2xl lg:text-3xl font-bold mb-2">
                {banner.title}
              </h3>
            )}
            {banner.subtitle && (
              <p className="text-xs md:text-sm lg:text-base mb-4 max-w-sm">
                {banner.subtitle}
              </p>
            )}
            {banner.button_text && (
              <Button variant="elegant" size="sm" asChild>
                <Link to={banner.button_link || '/'}>
                  {banner.button_text}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};