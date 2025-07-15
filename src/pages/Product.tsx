import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  ShoppingBag, 
  Star, 
  Shield, 
  Truck, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Minus,
  Plus,
  Check,
  ArrowLeft,
  Ruler,
  FileText,
  Shirt,
  Droplets,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { mapProductToCardData } from '@/utils/productUtils';

export default function Product() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { addItem, openCart } = useCart();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [cep, setCep] = useState('');
  
  const product = products.find(p => p.slug === slug);
  
  useEffect(() => {
    if (!loading && !product) {
      navigate('/');
    }
  }, [product, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const images = product.images || [];
  const currentImage = images[currentImageIndex] || '/placeholder.svg';
  
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleAddToCart = () => {
    addItem({
      id: parseInt(product.id),
      name: product.name,
      price: product.sale_price || product.price,
      image: currentImage,
      quantity
    });
    openCart();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const relatedProducts = products
    .filter(p => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 4);

  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="p-0 h-auto hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Thumbnail Images */}
          <div className="lg:col-span-2">
            {images.length > 1 && (
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 lg:w-full lg:h-24 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? 'border-primary' : 'border-muted'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Image */}
          <div className="lg:col-span-6">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.featured && (
                  <Badge className="bg-accent text-accent-foreground">
                    DESTAQUE
                  </Badge>
                )}
                {hasDiscount && (
                  <Badge className="bg-primary text-primary-foreground">
                    -{discountPercentage}%
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {product.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {product.sku || 'N/A'} - EM ESTOQUE - P/M/G DE 2,18/1,SEM JUROS
              </p>
            </div>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-foreground">
                  {formatPrice(product.sale_price || product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                ou 3x de {formatPrice((product.sale_price || product.price) / 3)} sem juros
              </p>
            </div>

            {/* Size Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium">TAMANHO</label>
              <div className="flex gap-2">
                {['36', '38', '40', '42'].map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                    className="w-12 h-12"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Collapsible Product Details */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="measurements">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    GUIA DE MEDIDAS
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p>Consulte nossa tabela de medidas para escolher o tamanho ideal.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>P: 36-38</div>
                      <div>M: 40-42</div>
                      <div>G: 44-46</div>
                      <div>GG: 48-50</div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="description">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    DESCRIÇÃO
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm">
                    {product.description || 'Produto de alta qualidade, confeccionado com materiais selecionados e acabamento impecável.'}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="composition">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Shirt className="h-4 w-4" />
                    COMPOSIÇÃO
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm">
                    COMPOSIÇÃO: 100% VISCOSE
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="care">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    CUIDADOS COM A PEÇA
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 text-sm">
                    <p>• Lavagem à máquina em água fria</p>
                    <p>• Não usar alvejante</p>
                    <p>• Secar à sombra</p>
                    <p>• Passar ferro em temperatura baixa</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Stock Alert */}
            {(product.stock_quantity || 0) <= 5 && (product.stock_quantity || 0) > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm font-medium text-orange-800">
                  ÚLTIMAS {product.stock_quantity} UNIDADES DISPONÍVEIS
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                disabled={quantity >= (product.stock_quantity || 100)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleAddToCart}
                disabled={(product.stock_quantity || 0) <= 0}
              >
                {(product.stock_quantity || 0) <= 0 ? 'FORA DE ESTOQUE' : 'ADICIONAR AO CARRINHO'}
              </Button>
            </div>

            {/* Shipping Calculator */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">CALCULAR FRETE E PRAZO</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="CEP"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm">
                  CALCULAR
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                RETIRADA EM MÃOS
              </p>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mb-16">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="shipping">Entrega</TabsTrigger>
              <TabsTrigger value="reviews">Avaliações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Especificações</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Peso:</span>
                            <span>{product.weight_grams || 500}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Dimensões:</span>
                            <span>{product.length_cm || 20} x {product.width_cm || 15} x {product.height_cm || 10} cm</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Material:</span>
                            <span>Algodão Premium</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Cuidados</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" />
                            <span>Lavagem à máquina</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" />
                            <span>Não usar alvejante</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" />
                            <span>Secar à sombra</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="shipping" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Opções de Entrega</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">Frete Grátis</p>
                              <p className="text-sm text-muted-foreground">Acima de R$ 199</p>
                            </div>
                            <span className="text-sm">5-7 dias</span>
                          </div>
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">Frete Expresso</p>
                              <p className="text-sm text-muted-foreground">R$ 19,90</p>
                            </div>
                            <span className="text-sm">2-3 dias</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Política de Troca</h4>
                        <div className="space-y-2 text-sm">
                          <p>• Troca grátis em até 30 dias</p>
                          <p>• Produto deve estar em perfeito estado</p>
                          <p>• Etiquetas devem estar intactas</p>
                          <p>• Enviamos uma nova etiqueta de devolução</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">4.2</div>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">42 avaliações</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {[1, 2, 3].map((review) => (
                        <div key={review} className="border-b pb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < 5 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">Maria S.</span>
                            <span className="text-xs text-muted-foreground">há 2 dias</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Produto de excelente qualidade, tecido muito macio e o caimento perfeito. Recomendo!
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Produtos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  {...mapProductToCardData(relatedProduct)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}