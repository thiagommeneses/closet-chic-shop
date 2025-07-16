import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, X, Plus, Trash2, Ruler, Package, Heart, FileText, CheckCircle2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface ProductVariation {
  id?: string;
  variation_type: string;
  variation_value: string;
  price_adjustment: number;
  stock_quantity: number;
  sku: string;
  active: boolean;
}

interface ProductDetailsTemplate {
  id: string;
  name: string;
  type: string;
  content: any;
}

interface ProductDetail {
  id?: string;
  template_id: string;
  template?: ProductDetailsTemplate;
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  price: string;
  sale_price: string;
  stock_quantity: string;
  category_id: string;
  sku: string;
  tags: string;
  featured: boolean;
  active: boolean;
  images: string[];
  weight_grams: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
}

export const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<ProductDetailsTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    price: '',
    sale_price: '',
    stock_quantity: '0',
    category_id: '',
    sku: '',
    tags: '',
    featured: false,
    active: true,
    images: [],
    weight_grams: '500',
    length_cm: '20',
    width_cm: '15',
    height_cm: '10'
  });

  useEffect(() => {
    loadCategories();
    loadTemplates();
    if (isEditing) {
      loadProduct();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar categorias",
        description: error.message
      });
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('product_details_templates')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar templates",
        description: error.message
      });
    }
  };

  const loadProduct = async () => {
    try {
      // Load product basic info
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) throw productError;

      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        sale_price: product.sale_price?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '0',
        category_id: product.category_id || '',
        sku: product.sku || '',
        tags: product.tags?.join(', ') || '',
        featured: product.featured || false,
        active: product.active !== false,
        images: product.images || [],
        weight_grams: product.weight_grams?.toString() || '500',
        length_cm: product.length_cm?.toString() || '20',
        width_cm: product.width_cm?.toString() || '15',
        height_cm: product.height_cm?.toString() || '10'
      });

      // Load product variations
      const { data: variationsData, error: variationsError } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', id);

      if (variationsError) throw variationsError;
      setVariations(variationsData || []);

      // Load product details
      const { data: detailsData, error: detailsError } = await supabase
        .from('product_details')
        .select(`
          *,
          template:product_details_templates(*)
        `)
        .eq('product_id', id);

      if (detailsError) throw detailsError;
      setProductDetails(detailsData || []);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar produto",
        description: error.message
      });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'name' && typeof value === 'string') {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const url = await uploadImage(file);
        if (url) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, url]
          }));
        }
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addVariation = () => {
    setVariations(prev => [...prev, {
      variation_type: 'size',
      variation_value: '',
      price_adjustment: 0,
      stock_quantity: 0,
      sku: '',
      active: true
    }]);
  };

  const updateVariation = (index: number, field: string, value: any) => {
    setVariations(prev => prev.map((variation, i) => 
      i === index ? { ...variation, [field]: value } : variation
    ));
  };

  const removeVariation = (index: number) => {
    setVariations(prev => prev.filter((_, i) => i !== index));
  };

  const toggleDetailTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    setProductDetails(prev => {
      // Remove all templates of the same type first
      const filteredDetails = prev.filter(detail => {
        const detailTemplate = templates.find(t => t.id === detail.template_id);
        return detailTemplate?.type !== template.type;
      });
      
      // Check if this template was already selected
      const wasSelected = prev.some(detail => detail.template_id === templateId);
      
      if (wasSelected) {
        // If it was selected, just remove it (already filtered above)
        return filteredDetails;
      } else {
        // If it wasn't selected, add it (replacing any other template of the same type)
        return [...filteredDetails, { template_id: templateId }];
      }
    });
  };

  // Utility functions for templates
  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      size_guide: 'Guia de Medidas',
      composition: 'Composição',
      care_instructions: 'Cuidados com a Peça'
    };
    return types[type] || type;
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      size_guide: Ruler,
      composition: Package,
      care_instructions: Heart
    };
    return icons[type] || FileText;
  };

  const getTypeDescription = (type: string) => {
    const descriptions: { [key: string]: string } = {
      size_guide: 'Informações sobre tamanhos e medidas',
      composition: 'Materiais e características do produto',
      care_instructions: 'Instruções de cuidados e conservação'
    };
    return descriptions[type] || '';
  };

  // Function to get template content preview
  const getTemplatePreview = (template: ProductDetailsTemplate) => {
    if (!template.content) return 'Conteúdo não disponível';
    
    if (typeof template.content === 'string') {
      // Remove HTML tags and get first 100 characters
      const textContent = template.content.replace(/<[^>]*>/g, '').trim();
      return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
    }
    
    // Handle JSON content
    if (typeof template.content === 'object') {
      if (template.content.text) {
        return template.content.text.length > 100 
          ? template.content.text.substring(0, 100) + '...' 
          : template.content.text;
      }
      if (template.content.html) {
        const textContent = template.content.html.replace(/<[^>]*>/g, '').trim();
        return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
      }
    }
    
    return 'Conteúdo disponível';
  };

  // Group templates by type
  const templatesByType = templates.reduce((acc, template) => {
    if (!acc[template.type]) {
      acc[template.type] = [];
    }
    acc[template.type].push(template);
    return acc;
  }, {} as { [key: string]: ProductDetailsTemplate[] });

  const selectedTemplatesByType = Object.keys(templatesByType).reduce((acc, type) => {
    acc[type] = templatesByType[type].filter(template =>
      productDetails.some(detail => detail.template_id === template.id)
    );
    return acc;
  }, {} as { [key: string]: ProductDetailsTemplate[] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        price: parseFloat(formData.price),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        category_id: formData.category_id || null,
        sku: formData.sku || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        featured: formData.featured,
        active: formData.active,
        images: formData.images,
        weight_grams: parseInt(formData.weight_grams) || 500,
        length_cm: parseInt(formData.length_cm) || 20,
        width_cm: parseInt(formData.width_cm) || 15,
        height_cm: parseInt(formData.height_cm) || 10
      };

      let productId = id;

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select('id')
          .single();

        if (error) throw error;
        productId = data.id;
      }

      // Handle variations
      if (isEditing) {
        // Delete existing variations
        await supabase
          .from('product_variations')
          .delete()
          .eq('product_id', id);
      }

      // Insert new variations
      if (variations.length > 0) {
        const variationData = variations.map(variation => ({
          product_id: productId,
          variation_type: variation.variation_type,
          variation_value: variation.variation_value,
          price_adjustment: variation.price_adjustment,
          stock_quantity: variation.stock_quantity,
          sku: variation.sku,
          active: variation.active
        }));

        const { error: variationError } = await supabase
          .from('product_variations')
          .insert(variationData);

        if (variationError) throw variationError;
      }

      // Handle product details
      if (isEditing) {
        // Delete existing details
        await supabase
          .from('product_details')
          .delete()
          .eq('product_id', id);
      }

      // Insert new details
      if (productDetails.length > 0) {
        const detailsData = productDetails.map(detail => ({
          product_id: productId,
          template_id: detail.template_id
        }));

        const { error: detailsError } = await supabase
          .from('product_details')
          .insert(detailsData);

        if (detailsError) throw detailsError;
      }

      toast({
        title: `Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`
      });

      // Only redirect to products list when creating new product
      if (!isEditing) {
        navigate('/admin/products');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: `Erro ao ${isEditing ? 'atualizar' : 'criar'} produto`,
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/admin/products')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Atualize as informações do produto' : 'Adicione um novo produto ao catálogo'}
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Informações Gerais</TabsTrigger>
            <TabsTrigger value="variations">Variações</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="images">Imagens</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="general" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Produto *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Ex: Vestido Elegante"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug">URL do Produto *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        placeholder="vestido-elegante"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Descreva o produto..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing & Inventory */}
                <Card>
                  <CardHeader>
                    <CardTitle>Preço e Estoque</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Preço Regular *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sale_price">Preço Promocional</Label>
                        <Input
                          id="sale_price"
                          type="number"
                          step="0.01"
                          value={formData.sale_price}
                          onChange={(e) => handleInputChange('sale_price', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          value={formData.stock_quantity}
                          onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => handleInputChange('sku', e.target.value)}
                          placeholder="PROD-001"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        placeholder="elegante, festa, premium"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping & Dimensions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dimensões e Frete</CardTitle>
                    <CardDescription>
                      Informações necessárias para cálculo de frete
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight_grams">Peso (gramas)</Label>
                        <Input
                          id="weight_grams"
                          type="number"
                          value={formData.weight_grams}
                          onChange={(e) => handleInputChange('weight_grams', e.target.value)}
                          placeholder="500"
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="length_cm">Comprimento (cm)</Label>
                        <Input
                          id="length_cm"
                          type="number"
                          value={formData.length_cm}
                          onChange={(e) => handleInputChange('length_cm', e.target.value)}
                          placeholder="20"
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="width_cm">Largura (cm)</Label>
                        <Input
                          id="width_cm"
                          type="number"
                          value={formData.width_cm}
                          onChange={(e) => handleInputChange('width_cm', e.target.value)}
                          placeholder="15"
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="height_cm">Altura (cm)</Label>
                        <Input
                          id="height_cm"
                          type="number"
                          value={formData.height_cm}
                          onChange={(e) => handleInputChange('height_cm', e.target.value)}
                          placeholder="10"
                          min="1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => handleInputChange('featured', !!checked)}
                      />
                      <Label htmlFor="featured">Produto em destaque</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => handleInputChange('active', !!checked)}
                      />
                      <Label htmlFor="active">Produto ativo (visível na loja)</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="variations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Variações do Produto</CardTitle>
                  <CardDescription>
                    Configure tamanhos, cores e outras variações do produto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button type="button" onClick={addVariation} className="mb-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Variação
                  </Button>

                  {variations.map((variation, index) => (
                    <div key={index} className="grid grid-cols-6 gap-4 items-end p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={variation.variation_type}
                          onValueChange={(value) => updateVariation(index, 'variation_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="size">Tamanho</SelectItem>
                            <SelectItem value="color">Cor</SelectItem>
                            <SelectItem value="material">Material</SelectItem>
                            <SelectItem value="style">Estilo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Valor</Label>
                        <Input
                          value={variation.variation_value}
                          onChange={(e) => updateVariation(index, 'variation_value', e.target.value)}
                          placeholder="P, M, G..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Ajuste de Preço</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variation.price_adjustment}
                          onChange={(e) => updateVariation(index, 'price_adjustment', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Estoque</Label>
                        <Input
                          type="number"
                          value={variation.stock_quantity}
                          onChange={(e) => updateVariation(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>SKU</Label>
                        <Input
                          value={variation.sku}
                          onChange={(e) => updateVariation(index, 'sku', e.target.value)}
                          placeholder="SKU-001"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeVariation(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {variations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma variação configurada. Clique em "Adicionar Variação" para começar.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              {/* Resumo de Seleção */}
              <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>Resumo dos Detalhes Selecionados</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(selectedTemplatesByType).map(([type, selectedTemplates]) => {
                      const Icon = getTypeIcon(type);
                      return (
                        <div key={type} className="flex items-center space-x-3 p-3 bg-background rounded-lg border">
                          <div className="p-2 bg-primary/10 rounded-md">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{getTypeLabel(type)}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedTemplates.length} template{selectedTemplates.length !== 1 ? 's' : ''} selecionado{selectedTemplates.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {productDetails.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>Nenhum template selecionado</p>
                      <p className="text-sm">Selecione os templates que se aplicam ao produto</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Seleção de Templates por Tipo */}
              <div className="space-y-6">
                {Object.entries(templatesByType).map(([type, typeTemplates]) => {
                  const Icon = getTypeIcon(type);
                  const selectedInType = selectedTemplatesByType[type] || [];
                  
                  return (
                    <Card key={type} className="border-2">
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{getTypeLabel(type)}</CardTitle>
                            <CardDescription>
                              {getTypeDescription(type)} • {selectedInType.length} de {typeTemplates.length} selecionado{selectedInType.length !== 1 ? 's' : ''}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {typeTemplates.map((template) => {
                            const isSelected = productDetails.some(detail => detail.template_id === template.id);
                            return (
                              <div
                                key={template.id}
                                className={`group p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                  isSelected 
                                    ? 'border-primary bg-primary/10 shadow-sm' 
                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                }`}
                                onClick={() => toggleDetailTemplate(template.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-md transition-colors ${
                                      isSelected 
                                        ? 'bg-primary/20' 
                                        : 'bg-muted group-hover:bg-primary/10'
                                    }`}>
                                      <Icon className={`h-4 w-4 ${
                                        isSelected 
                                          ? 'text-primary' 
                                          : 'text-muted-foreground group-hover:text-primary'
                                      }`} />
                                    </div>
                                    <div>
                                      <h3 className="font-medium">{template.name}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        {getTypeLabel(template.type)}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    {isSelected && (
                                      <Badge variant="default" className="text-xs">
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Selecionado
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Preview do conteúdo */}
                                <div className="mt-3 p-3 bg-muted/50 rounded-md">
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {getTemplatePreview(template)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {typeTemplates.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                              <Icon className="h-8 w-8 opacity-50" />
                            </div>
                            <p>Nenhum template de {getTypeLabel(type).toLowerCase()} disponível</p>
                            <p className="text-sm">Configure templates na seção de configurações</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {templates.length === 0 && (
                <Card className="border-dashed border-2">
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                        <FileText className="h-12 w-12 opacity-50" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Nenhum template disponível</h3>
                      <p className="text-sm mb-2">Configure templates de detalhes na seção de configurações</p>
                      <p className="text-xs text-muted-foreground/80">
                        Crie templates para Guia de Medidas, Composição e Cuidados com a Peça
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="images" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Imagens do Produto</CardTitle>
                  <CardDescription>
                    Adicione imagens para mostrar seu produto (formato ideal: 2:3)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading && <span className="text-sm text-muted-foreground">Enviando...</span>}
                  </div>

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-[2/3] overflow-hidden rounded-lg border">
                            <img
                              src={image}
                              alt={`Produto ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')} Produto
              </Button>
            </div>
          </form>
        </Tabs>
      </div>
    </AdminLayout>
  );
};