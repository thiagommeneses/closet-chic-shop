import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logo from '@/assets/closet-collection-logo.png';

export const Footer = () => {
  return (
    <footer className="bg-muted py-12 mt-16">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div className="space-y-4">
            <img src={logo} alt="Closet Collection" className="h-10 w-auto" />
            <p className="text-muted-foreground text-sm leading-relaxed">
              Descrição com parágrafo contando a breve história da marca
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Youtube className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">SOBRE</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Quem Somos</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Trabalhe Conosco</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Sustentabilidade</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Programa de Fidelidade</a></li>
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">MEUS DADOS</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Meus Dados</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Meus Pedidos</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Lista de Desejos</a></li>
            </ul>
            
            <h3 className="font-semibold text-foreground mt-6">POLÍTICAS</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Trocas e Devoluções</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Política de Frete</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Formas de Pagamento</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacidade e Segurança</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Promoções e Ofertas</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Blackfriday</a></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">FALE CONOSCO</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">(11) 99999-9999</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">contato@closetcollection.com.br</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-1" />
                <span className="text-muted-foreground">São Paulo - SP</span>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-foreground mb-3">INSCREVA-SE EM NOSSA NEWSLETTER</h4>
              <p className="text-xs text-muted-foreground mb-3">
                E receba novidades por e-mail
              </p>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Digite seu e-mail" 
                  className="flex-1 text-sm"
                />
                <Button variant="elegant" size="sm">
                  OK
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">BANDEIRAS DOS CARTÕES, BOLETO E PIX ACEITOS</h4>
              <div className="text-sm text-muted-foreground">
                Visa, Mastercard, American Express, Elo, Hipercard, Boleto Bancário, PIX
              </div>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-foreground mb-1">SELO DE SEGURANÇA SSL</h4>
              <div className="text-xs text-muted-foreground">
                Site protegido
              </div>
            </div>
          </div>
          
          <div className="text-center text-xs text-muted-foreground mt-6 pt-6 border-t border-border">
            Copyright © 2024 Closet Collection
          </div>
        </div>
      </div>
    </footer>
  );
};