import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Ruler, User, X } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface ProductSizeGuideProps {
  sizeGuideContent: string;
  productName: string;
  productImage?: string;
  selectedSize?: string;
  onSizeSelect?: (size: string) => void;
  onAddToCart?: (size: string) => void;
  price?: number;
  productId?: string | number;
  slug?: string;
}

export const ProductSizeGuide: React.FC<ProductSizeGuideProps> = ({
  sizeGuideContent,
  productName,
  productImage,
  selectedSize,
  onSizeSelect,
  onAddToCart,
  price,
  productId,
  slug
}) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('size-guide');

  const parseSizeGuide = (content: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      
      const table = doc.querySelector('table');
      const instructionsDiv = doc.querySelector('.instructions');
      
      let sizes: any[] = [];
      let headers: string[] = [];
      
      if (table) {
        const headerRow = table.querySelector('thead tr');
        if (headerRow) {
          headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
        }
        
        const rows = table.querySelectorAll('tbody tr');
        sizes = Array.from(rows).map(row => {
          const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent?.trim() || '');
          const sizeData: any = { size: cells[0] };
          
          for (let i = 1; i < cells.length; i++) {
            const header = headers[i]?.toLowerCase();
            if (header) {
              sizeData[header] = cells[i];
            }
          }
          
          return sizeData;
        });
      }
      
      const instructions = instructionsDiv?.textContent || '';
      
      return { sizes, headers, instructions };
    } catch (error) {
      console.error('Error parsing size guide:', error);
      return { sizes: [], headers: [], instructions: '' };
    }
  };

  const { sizes, headers, instructions } = parseSizeGuide(sizeGuideContent);

  const handleSizeSelect = (size: string) => {
    if (onSizeSelect) {
      onSizeSelect(size);
    }
    // Não fechar o popup automaticamente ao selecionar tamanho
  };

  const handleAddToWishlist = () => {
    if (productId && price) {
      toggleFavorite({
        id: productId,
        name: productName,
        price,
        image: productImage || '',
        slug
      });
    }
  };

  const handleAddToCart = () => {
    if (selectedSize && onAddToCart) {
      onAddToCart(selectedSize);
      setIsOpen(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isInWishlist = productId ? isFavorite(productId) : false;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-sm">
          <Ruler className="h-4 w-4 mr-2" />
          Guia de tamanho
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Guia de tamanho
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="size-guide">Guia de tamanho</TabsTrigger>
            <TabsTrigger value="how-to-measure">Como medir</TabsTrigger>
          </TabsList>
          
          <TabsContent value="size-guide" className="space-y-4">
            <div className="flex items-start gap-4">
              {productImage && (
                <div className="flex-shrink-0">
                  <img 
                    src={productImage} 
                    alt={productName}
                    className="w-20 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{productName}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  As medidas apresentadas na tabela ao lado são baseadas nas dimensões do produto
                </p>
              </div>
            </div>
            
            {sizes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border rounded-lg">
                  <thead>
                    <tr className="bg-muted/50">
                      {headers.map((header, index) => (
                        <th 
                          key={index}
                          className="border border-border p-3 text-left font-semibold text-sm"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizes.map((size, index) => (
                      <tr 
                        key={index}
                        className={`hover:bg-muted/30 transition-colors ${
                          selectedSize === size.size ? 'bg-primary/10' : ''
                        }`}
                      >
                        <td className="border border-border p-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSizeSelect(size.size)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                selectedSize === size.size
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border hover:border-primary'
                              }`}
                            >
                              {selectedSize === size.size && (
                                <div className="w-2 h-2 bg-current rounded-full" />
                              )}
                            </button>
                            <span className="font-medium">{size.size}</span>
                          </div>
                        </td>
                        {headers.slice(1).map((header, headerIndex) => (
                          <td 
                            key={headerIndex}
                            className="border border-border p-3 text-sm text-center"
                          >
                            {size[header.toLowerCase()] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleAddToWishlist} 
                variant="outline" 
                className="flex-1"
                disabled={!productId}
              >
                {isInWishlist ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              </Button>
              <Button 
                onClick={handleAddToCart} 
                className="flex-1" 
                disabled={!selectedSize}
              >
                {selectedSize ? `Adicionar à sacola - ${price ? formatPrice(price) : ''}` : 'Selecione um tamanho'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="how-to-measure" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-32 bg-muted rounded-lg flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-4">Como medir</h3>
                    {instructions ? (
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {instructions}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 text-sm">
                        <p className="font-medium">Para selecionar o tamanho correto do look, recomendamos que verifique as seguintes medidas com uma fita métrica. Se necessário, peça a ajuda de alguém</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">1</Badge>
                            <div>
                              <p className="font-medium">Busto</p>
                              <p className="text-muted-foreground">Vestindo um sutiã, passe a fita métrica em linha reta pelas costas, sob os braços e sobre o ponto mais saliente do busto</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">2</Badge>
                            <div>
                              <p className="font-medium">Cintura</p>
                              <p className="text-muted-foreground">Passe a fita métrica ao redor da cintura em seu ponto mais estreito. A fita deve ficar rente ao corpo, mas não apertada</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">3</Badge>
                            <div>
                              <p className="font-medium">Quadril</p>
                              <p className="text-muted-foreground">Passe a fita métrica ao redor do quadril em seu ponto mais volumoso. A fita deve ficar rente ao corpo, mas não apertada</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};