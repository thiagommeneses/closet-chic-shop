import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
}

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      id: 1,
      title: "NOVA COLEÇÃO",
      subtitle: "Primavera/Verão 2024",
      image: "/lovable-uploads/15cbb06f-7302-4a5d-92d4-0fc95fb32b48.png",
      cta: "Descobrir Coleção"
    },
    {
      id: 2,
      title: "VESTIDOS",
      subtitle: "Elegância para todos os momentos",
      image: "/lovable-uploads/15cbb06f-7302-4a5d-92d4-0fc95fb32b48.png",
      cta: "Ver Vestidos"
    },
    {
      id: 3,
      title: "LIQUIDAÇÃO",
      subtitle: "Até 50% OFF em peças selecionadas",
      image: "/lovable-uploads/15cbb06f-7302-4a5d-92d4-0fc95fb32b48.png",
      cta: "Aproveitar Ofertas"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

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
            <div 
              className="h-full w-full bg-cover bg-center bg-no-repeat relative"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/20" />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                <div className="space-y-4 px-4">
                  <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-wide">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl font-light tracking-wide">
                    {slide.subtitle}
                  </p>
                  <Button 
                    variant="elegant" 
                    size="lg"
                    className="mt-6 font-medium tracking-wide"
                  >
                    {slide.cta}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
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

      {/* Dots Indicator */}
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
    </section>
  );
};