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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
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
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
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

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        sale_price: data.sale_price?.toString() || '',
        stock_quantity: data.stock_quantity?.toString() || '0',
        category_id: data.category_id || '',
        sku: data.sku || '',
        tags: data.tags?.join(', ') || '',
        featured: data.featured || false,
        active: data.active !== false,
        images: data.images || [],
        weight_grams: data.weight_grams?.toString() || '500',
        length_cm: data.length_cm?.toString() || '20',
        width_cm: data.width_cm?.toString() || '15',
        height_cm: data.height_cm?.toString() || '10'
      });
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

    // Auto-generate slug from name
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

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        if (error) throw error;
        
        toast({
          title: "Produto atualizado com sucesso!"
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        
        toast({
          title: "Produto criado com sucesso!"
        });
      }

      navigate('/admin/products');
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
          </div>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Imagens do Produto</CardTitle>
              <CardDescription>
                Adicione imagens para mostrar seu produto
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Produto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
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

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')} Produto
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};