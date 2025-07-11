import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const WhatsAppButton = () => {
  const phoneNumber = "5511999999999"; // Replace with actual WhatsApp number
  const message = encodeURIComponent("Olá! Vim do site da Closet Collection e gostaria de mais informações.");

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(url, '_blank');
  };

  return (
    <Button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
      size="icon"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="sr-only">Contato via WhatsApp</span>
    </Button>
  );
};