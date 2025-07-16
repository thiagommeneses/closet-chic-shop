import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBanners } from '@/hooks/useBanners';

export const HeroSection = () => {
  const { getHeroBanners, loading } = useBanners();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = getHeroBanners();

  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (loading) {
    return (
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden bg-muted animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            Carregando banners...
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <h2 className="text-2xl font-bold mb-2">Nenhum banner configurado</h2>
            <p>Configure banners no painel administrativo</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
      {/* Slides */}
      <div className="relative h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Image or Video */}
            {slide.video_url ? (
              <video
                className="h-full w-full object-cover"
                src={slide.video_url}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <>
                {/* Desktop Image */}
                <div 
                  className="h-full w-full bg-cover bg-center bg-no-repeat relative hidden md:block"
                  style={{ backgroundImage: `url(${slide.desktop_image_url})` }}
                />
                {/* Mobile Image */}
                <div 
                  className="h-full w-full bg-cover bg-center bg-no-repeat relative block md:hidden"
                  style={{ backgroundImage: `url(${slide.mobile_image_url || slide.desktop_image_url})` }}
                />
              </>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center text-center text-white">
              <div className="space-y-4 px-4">
                {slide.title && (
                  <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-wide">
                    {slide.title}
                  </h1>
                )}
                {slide.subtitle && (
                  <p className="text-lg md:text-xl font-light tracking-wide">
                    {slide.subtitle}
                  </p>
                )}
                {slide.button_text && (
                  <Button 
                    variant="elegant" 
                    size="lg"
                    className="mt-6 font-medium tracking-wide"
                    asChild
                  >
                    <Link to={slide.button_link || '/'}>
                      {slide.button_text}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
            onClick={nextSlide}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white scale-110'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
};