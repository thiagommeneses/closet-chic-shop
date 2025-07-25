import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, Grid3X3, LayoutList, Eye, RotateCcw } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [priceRange, setPriceRange] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRanges, setPriceRanges] = useState<Array<{value: string, label: string, min: number, max?: number}>>([]);

  useEffect(() => {
    if (slug) {
      fetchCategoryAndProducts();
    }
  }, [slug]);

  useEffect(() => {
    if (products.length > 0) {
      calculatePriceRanges();
    }
  }, [products]);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, sortBy, priceRange]);

  const fetchCategoryAndProducts = async () => {
    try {
      setLoading(true);
      
      // Buscar categoria
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (categoryError) {
        console.error('Erro ao buscar categoria:', categoryError);
        return;
      }

      setCategory(categoryData);

      // Buscar produtos da categoria através da tabela product_categories
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_categories!inner(category_id)
        `)
        .eq('product_categories.category_id', categoryData.id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Erro ao buscar produtos:', productsError);
        return;
      }

      setProducts(productsData || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePriceRanges = () => {
    if (products.length === 0) {
      setPriceRanges([]);
      return;
    }

    // Get all effective prices (sale_price if available, otherwise price)
    const prices = products.map(product => product.sale_price || product.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // If all products have similar prices (less than R$ 20 difference), don't create ranges
    if (maxPrice - minPrice < 20) {
      setPriceRanges([]);
      return;
    }

    // Round prices to nice numbers
    const roundPrice = (price: number) => {
      if (price < 50) return Math.ceil(price / 10) * 10;
      if (price < 200) return Math.ceil(price / 25) * 25;
      if (price < 500) return Math.ceil(price / 50) * 50;
      return Math.ceil(price / 100) * 100;
    };

    const roundedMin = Math.floor(minPrice / 10) * 10;
    const roundedMax = roundPrice(maxPrice);
    
    // Create 4-5 price ranges
    const ranges = [];
    const step = (roundedMax - roundedMin) / 4;
    
    for (let i = 0; i < 4; i++) {
      const rangeMin = roundedMin + (step * i);
      const rangeMax = i === 3 ? roundedMax : roundedMin + (step * (i + 1));
      
      // Round the range boundaries
      const min = Math.ceil(rangeMin / 10) * 10;
      const max = Math.floor(rangeMax / 10) * 10;
      
      if (i === 0) {
        ranges.push({
          value: `under-${max}`,
          label: `Até R$ ${max.toFixed(0)}`,
          min: 0,
          max
        });
      } else if (i === 3) {
        ranges.push({
          value: `over-${min}`,
          label: `Acima de R$ ${min.toFixed(0)}`,
          min
        });
      } else {
        ranges.push({
          value: `${min}-${max}`,
          label: `R$ ${min.toFixed(0)} - R$ ${max.toFixed(0)}`,
          min,
          max
        });
      }
    }

    setPriceRanges(ranges);
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por faixa de preço
    if (priceRange !== 'all') {
      // Find the selected range configuration
      const selectedRange = priceRanges.find(range => range.value === priceRange);
      
      if (selectedRange) {
        filtered = filtered.filter(product => {
          const effectivePrice = product.sale_price || product.price;
          
          if (selectedRange.max) {
            // Range with min and max
            return effectivePrice >= selectedRange.min && effectivePrice <= selectedRange.max;
          } else {
            // Range with only min (over X)
            return effectivePrice >= selectedRange.min;
          }
        });
      }
    }

    // Ordenação
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        filtered.sort((a, b) => {
          const priceA = a.sale_price || a.price;
          const priceB = b.sale_price || b.price;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          const priceA = a.sale_price || a.price;
          const priceB = b.sale_price || b.price;
          return priceB - priceA;
        });
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'most-viewed':
        // Para "mais vistos", vamos ordenar por featured primeiro, depois por data de criação
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        break;
    }

    setFilteredProducts(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange('all');
    setSortBy('name');
  };

  const hasActiveFilters = searchTerm !== '' || priceRange !== 'all' || sortBy !== 'name';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-64 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Categoria não encontrada</h1>
            <p className="text-muted-foreground">A categoria que você procura não existe.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section da Categoria */}
      <section className="relative bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {category.description}
              </p>
            )}
            <div className="mt-8 flex items-center justify-center text-sm text-muted-foreground">
              <span>{filteredProducts.length} produtos encontrados</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {priceRanges.length > 0 && (
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Faixa de preço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os preços</SelectItem>
                    {priceRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="hover-scale text-muted-foreground hover:text-foreground transition-colors animate-fade-in"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar filtros
                </Button>
              )}
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome A-Z</SelectItem>
                  <SelectItem value="price-low">Menor preço</SelectItem>
                  <SelectItem value="price-high">Maior preço</SelectItem>
                  <SelectItem value="newest">Mais recentes</SelectItem>
                  <SelectItem value="most-viewed">Mais vistos</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Botões de modo de visualização */}
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none border-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none border-0"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Produtos */}
      <main className="container mx-auto px-4 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Tente ajustar os filtros ou buscar por outros termos.
            </p>
            <Button onClick={() => {
              setSearchTerm('');
              setPriceRange('all');
              setSortBy('name');
              setViewMode('grid');
            }}>
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "flex flex-col gap-4"
          }>
            {filteredProducts.map((product) => (
              <div key={product.id} className={viewMode === 'list' ? "w-full" : ""}>
                {viewMode === 'list' ? (
                  <div className="flex bg-card rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="w-32 sm:w-48 h-32 sm:h-48 flex-shrink-0">
                      <img
                        src={product.images?.[0] || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                        {product.featured && (
                          <div className="flex items-center gap-1 text-xs text-primary mb-2">
                            <Eye className="h-3 w-3" />
                            <span>Mais visto</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          {product.sale_price ? (
                            <>
                              <span className="text-sm text-muted-foreground line-through">
                                R$ {product.price.toFixed(2)}
                              </span>
                              <span className="text-lg font-bold text-primary">
                                R$ {product.sale_price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold">
                              R$ {product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <Button size="sm">Ver Produto</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ProductCard product={product} />
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Category;