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
import { ShippingCalculator } from '@/components/ShippingCalculator';
import { supabase } from '@/integrations/supabase/client';
import { renderTemplateContent } from '@/utils/templateUtils';
import { ProductSizeGuide } from '@/components/ProductSizeGuide';

export default function Product() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { addItem, openCart } = useCart();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedVariationId, setSelectedVariationId] = useState('');
  const [variations, setVariations] = useState<any[]>([]);
  const [productDetails, setProductDetails] = useState<any>({});
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  
  const product = products.find(p => p.slug === slug);
  
  useEffect(() => {
    if (!loading && !product) {
      navigate('/');
    }
  }, [product, loading, navigate]);

  // Load product variations and details
  useEffect(() => {
    if (product?.id) {
      loadProductData(product.id);
    }
  }, [product?.id]);

  const loadProductData = async (productId: string) => {
    try {
      // Load variations from product_variations table
      const { data: variationsData } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', productId)
        .eq('active', true);

      // Load product details with templates
      const { data: detailsData } = await supabase
        .from('product_details')
        .select(`
          *,
          product_details_templates (
            id,
            name,
            type,
            content
          )
        `)
        .eq('product_id', productId);

      if (variationsData) {
        setVariations(variationsData);
        console.log('Loaded variations:', variationsData);
      }

      if (detailsData) {
        const detailsMap = detailsData.reduce((acc: any, detail: any) => {
          const template = detail.product_details_templates;
          acc[template.type] = template;
          return acc;
        }, {});
        setProductDetails(detailsMap);
      }
    } catch (error) {
      console.error('Error loading product data:', error);
    }
  };

  // Handle size selection and find matching variation
  const handleSizeSelection = (size: string) => {
    setSelectedSize(size);
    
    // Find the variation that matches the selected size
    const sizeVariation = variations.find(v => 
      v.variation_type === 'size' && v.variation_value === size
    );
    
    if (sizeVariation) {
      setSelectedVariationId(sizeVariation.id);
      console.log('Selected variation:', sizeVariation);
    }
  };

  // Handle color selection
  const handleColorSelection = (color: string) => {
    setSelectedColor(color);
    
    // If there are both size and color variations, we need more complex logic
    // For now, just find color variation
    const colorVariation = variations.find(v => 
      v.variation_type === 'color' && v.variation_value === color
    );
    
    if (colorVariation) {
      setSelectedVariationId(colorVariation.id);
      console.log('Selected color variation:', colorVariation);
    }
  };

  // Check if we can add to cart
  const canAddToCart = () => {
    const hasVariations = variations.length > 0;
    
    if (!hasVariations) {
      return (product?.stock_quantity || 0) > 0;
    }
    
    // If product has variations, user must select them
    const hasSizeVariations = variations.some(v => v.variation_type === 'size');
    const hasColorVariations = variations.some(v => v.variation_type === 'color');
    
    if (hasSizeVariations && !selectedSize) {
      return false;
    }
    
    if (hasColorVariations && !selectedColor) {
      return false;
    }
    
    // Check if selected variation has stock
    if (selectedVariationId) {
      const selectedVariation = variations.find(v => v.id === selectedVariationId);
      return (selectedVariation?.stock_quantity || 0) > 0;
    }
    
    return false;
  };

  // Get available stock for display
  const getAvailableStock = () => {
    if (selectedVariationId) {
      const selectedVariation = variations.find(v => v.id === selectedVariationId);
      return selectedVariation?.stock_quantity || 0;
    }
    return product?.stock_quantity || 0;
  };

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
    if (!canAddToCart()) {
      if (variations.length > 0) {
        const hasSizeVariations = variations.some(v => v.variation_type === 'size');
        if (hasSizeVariations && !selectedSize) {
          alert('Por favor, selecione um tamanho antes de adicionar ao carrinho.');
          return;
        }
      }
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      image: currentImage,
      quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      variation_id: selectedVariationId || undefined
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

  const availableStock = getAvailableStock();

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
                     className={`flex-shrink-0 w-20 h-32 lg:w-full lg:aspect-[2/3] rounded-lg overflow-hidden border-2 transition-colors ${
                       index === currentImageIndex ? 'border-primary' : 'border-muted'
                     }`}
                   >
                     <img
                       src={image}
                       alt={`${product.name} - ${index + 1}`}
                       className="w-full h-full object-cover object-center"
                     />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Image */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[2/3] bg-muted rounded-lg overflow-hidden group">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
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
              {/* Product SKU and Stock Status */}
              <div className="space-y-2">
                {product.sku && (
                  <p className="text-muted-foreground" style={{ fontSize: '0.6rem' }}>
                    SKU: {product.sku}
                  </p>
                )}
                <div className="flex items-center">
                  {availableStock > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700">Em estoque ({availableStock} unidades)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-red-700">Esgotado</span>
                    </div>
                  )}
                </div>
              </div>
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
            {variations.filter(v => v.variation_type === 'size' && v.active !== false).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    TAMANHO {!selectedSize && <span className="text-red-500">*</span>}
                  </label>
                  {productDetails.size_guide && (
                    <ProductSizeGuide
                      sizeGuideContent={renderTemplateContent(productDetails.size_guide)}
                      productName={product.name}
                      productImage={currentImage}
                      selectedSize={selectedSize}
                      onSizeSelect={handleSizeSelection}
                      onAddToCart={(size) => {
                        handleSizeSelection(size);
                        if (canAddToCart()) {
                          handleAddToCart();
                        }
                      }}
                      price={product.sale_price || product.price}
                      productId={product.id}
                      slug={product.slug}
                    />
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {variations
                    .filter(v => v.variation_type === 'size' && v.active !== false)
                    .map((variation) => (
                      <Button
                        key={variation.id}
                        variant={selectedSize === variation.variation_value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSizeSelection(variation.variation_value)}
                        className="w-12 h-12"
                        disabled={variation.stock_quantity === 0}
                      >
                        {variation.variation_value}
                        {variation.stock_quantity === 0 && (
                          <span className="sr-only">Esgotado</span>
                        )}
                      </Button>
                    ))}
                </div>
                {!selectedSize && variations.some(v => v.variation_type === 'size') && (
                  <p className="text-sm text-red-500">Selecione um tamanho para continuar</p>
                )}
              </div>
            )}

            {/* Color Selector */}
            {variations.filter(v => v.variation_type === 'color' && v.active !== false).length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium">COR</label>
                <div className="flex gap-2 flex-wrap">
                  {variations
                    .filter(v => v.variation_type === 'color' && v.active !== false)
                    .map((variation) => (
                      <Button
                        key={variation.id}
                        variant={selectedColor === variation.variation_value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleColorSelection(variation.variation_value)}
                        className="min-w-16 h-10"
                        disabled={variation.stock_quantity === 0}
                      >
                        {variation.variation_value}
                        {variation.stock_quantity === 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">(Esgotado)</span>
                        )}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* Other Variations (Material, Style, etc.) */}
            {variations.filter(v => !['size', 'color'].includes(v.variation_type) && v.active !== false).length > 0 && (
              <div className="space-y-3">
                {Object.entries(
                  variations
                    .filter(v => !['size', 'color'].includes(v.variation_type) && v.active !== false)
                    .reduce((acc, variation) => {
                      if (!acc[variation.variation_type]) {
                        acc[variation.variation_type] = [];
                      }
                      acc[variation.variation_type].push(variation);
                      return acc;
                    }, {} as Record<string, any[]>)
                ).map(([type, typeVariations]) => (
                  <div key={type} className="space-y-2">
                    <label className="text-sm font-medium">
                      {type === 'material' ? 'MATERIAL' : 
                       type === 'style' ? 'ESTILO' : 
                       type.toUpperCase()}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {(typeVariations as any[]).map((variation) => (
                        <Button
                          key={variation.id}
                          variant="outline"
                          size="sm"
                          className="min-w-16 h-10"
                          disabled={variation.stock_quantity === 0}
                        >
                          {variation.variation_value}
                          {variation.stock_quantity === 0 && (
                            <span className="ml-1 text-xs text-muted-foreground">(Esgotado)</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Collapsible Product Details */}
            <Accordion type="single" collapsible className="w-full">

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

              {productDetails.composition && (
                <AccordionItem value="composition">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Shirt className="h-4 w-4" />
                      COMPOSIÇÃO
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div 
                      className="prose prose-sm max-w-none text-sm"
                      dangerouslySetInnerHTML={{ 
                        __html: renderTemplateContent(productDetails.composition) 
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}

              {productDetails.care_instructions && (
                <AccordionItem value="care">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      CUIDADOS COM A PEÇA
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div 
                      className="prose prose-sm max-w-none text-sm"
                      dangerouslySetInnerHTML={{ 
                        __html: renderTemplateContent(productDetails.care_instructions) 
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Stock Alert */}
            {availableStock <= 5 && availableStock > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm font-medium text-orange-800">
                  ÚLTIMAS {availableStock} UNIDADES DISPONÍVEIS
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
                disabled={quantity >= availableStock}
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
                disabled={!canAddToCart()}
              >
                {availableStock <= 0 ? 'FORA DE ESTOQUE' : 
                 !canAddToCart() && variations.length > 0 ? 'SELECIONE AS OPÇÕES' :
                 'ADICIONAR AO CARRINHO'}
              </Button>
            </div>

            {/* Shipping Calculator */}
            <div className="space-y-3">
              <ShippingCalculator
                onShippingSelect={setSelectedShipping}
                totalWeight={product.weight_grams || 500}
                dimensions={{
                  comprimento: product.length_cm || 20,
                  altura: product.height_cm || 10,
                  largura: product.width_cm || 15
                }}
                cartTotal={(product.sale_price || product.price) * quantity}
              />
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
                     <div>
                       <h4 className="font-semibold mb-4">Especificações do Produto</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-3">
                           <div className="flex justify-between py-2 border-b border-muted">
                             <span className="text-sm font-medium">Peso:</span>
                             <span className="text-sm">{product.weight_grams || 500}g</span>
                           </div>
                           <div className="flex justify-between py-2 border-b border-muted">
                             <span className="text-sm font-medium">Dimensões:</span>
                             <span className="text-sm">{product.length_cm || 20} x {product.width_cm || 15} x {product.height_cm || 10} cm</span>
                           </div>
                         </div>
                         <div className="space-y-3">
                           <div className="flex justify-between py-2 border-b border-muted">
                             <span className="text-sm font-medium">SKU:</span>
                             <span className="text-sm">{product.sku || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between py-2 border-b border-muted">
                             <span className="text-sm font-medium">Categoria:</span>
                             <span className="text-sm">Moda Feminina</span>
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
