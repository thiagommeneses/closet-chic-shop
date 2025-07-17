import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Trash2, Package, Edit3, Save, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductAttribute {
  id?: string;
  attribute_name: string;
  attribute_values: string[];
  display_order: number;
}

interface ProductVariant {
  id?: string;
  attributes: Record<string, string>;
  sku: string;
  price_adjustment: number;
  stock_quantity: number;
  low_stock_threshold: number;
  reorder_point: number;
  images: string[];
  active: boolean;
}

interface ProductVariationManagerProps {
  productId?: string;
  onStockChange?: (totalStock: number) => void;
}

export const ProductVariationManager: React.FC<ProductVariationManagerProps> = ({ 
  productId, 
  onStockChange 
}) => {
  const { toast } = useToast();
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  
  // New attribute form
  const [newAttribute, setNewAttribute] = useState({
    name: '',
    values: ['']
  });

  useEffect(() => {
    if (productId) {
      loadData();
    }
  }, [productId]);

  useEffect(() => {
    // Calculate total stock and notify parent
    const totalStock = variants.reduce((sum, variant) => sum + variant.stock_quantity, 0);
    onStockChange?.(totalStock);
  }, [variants, onStockChange]);

  const loadData = async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      // Load attributes
      const { data: attributesData } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      // Load variants
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at');

      setAttributes((attributesData || []).map(attr => ({
        ...attr,
        attribute_values: attr.attribute_values as string[]
      })));
      setVariants((variantsData || []).map(variant => ({
        ...variant,
        attributes: variant.attributes as Record<string, string>
      })));
    } catch (error) {
      console.error('Error loading variation data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de variações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAttribute = async (attribute: ProductAttribute) => {
    if (!productId) return;

    try {
      if (attribute.id) {
        // Update existing
        await supabase
          .from('product_attributes')
          .update({
            attribute_name: attribute.attribute_name,
            attribute_values: attribute.attribute_values,
            display_order: attribute.display_order
          })
          .eq('id', attribute.id);
      } else {
        // Create new
        await supabase
          .from('product_attributes')
          .insert({
            product_id: productId,
            attribute_name: attribute.attribute_name,
            attribute_values: attribute.attribute_values,
            display_order: attribute.display_order
          });
      }

      await loadData();
      toast({
        title: "Sucesso",
        description: "Atributo salvo com sucesso",
      });
    } catch (error) {
      console.error('Error saving attribute:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar atributo",
        variant: "destructive",
      });
    }
  };

  const deleteAttribute = async (attributeId: string) => {
    try {
      await supabase
        .from('product_attributes')
        .delete()
        .eq('id', attributeId);

      await loadData();
      toast({
        title: "Sucesso",
        description: "Atributo removido com sucesso",
      });
    } catch (error) {
      console.error('Error deleting attribute:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover atributo",
        variant: "destructive",
      });
    }
  };

  const generateCombinations = () => {
    if (attributes.length === 0) return [];

    const combinations: Record<string, string>[] = [];
    
    const generateRecursive = (index: number, current: Record<string, string>) => {
      if (index === attributes.length) {
        combinations.push({ ...current });
        return;
      }

      const attribute = attributes[index];
      attribute.attribute_values.forEach(value => {
        current[attribute.attribute_name] = value;
        generateRecursive(index + 1, current);
      });
    };

    generateRecursive(0, {});
    return combinations;
  };

  const generateVariants = async () => {
    if (!productId) return;

    const combinations = generateCombinations();
    const newVariants: ProductVariant[] = [];

    for (const combination of combinations) {
      // Check if variant already exists
      const existingVariant = variants.find(v => 
        JSON.stringify(v.attributes) === JSON.stringify(combination)
      );

      if (!existingVariant) {
        // Generate SKU
        const { data: skuData } = await supabase
          .rpc('generate_variant_sku', {
            p_product_id: productId,
            p_attributes: combination
          });

        newVariants.push({
          attributes: combination,
          sku: skuData || '',
          price_adjustment: 0,
          stock_quantity: 0,
          low_stock_threshold: 5,
          reorder_point: 10,
          images: [],
          active: true
        });
      }
    }

    setVariants(prev => [...prev, ...newVariants]);
  };

  const saveVariant = async (variant: ProductVariant) => {
    if (!productId) return;

    try {
      if (variant.id) {
        // Update existing
        await supabase
          .from('product_variants')
          .update({
            attributes: variant.attributes,
            sku: variant.sku,
            price_adjustment: variant.price_adjustment,
            stock_quantity: variant.stock_quantity,
            low_stock_threshold: variant.low_stock_threshold,
            reorder_point: variant.reorder_point,
            images: variant.images,
            active: variant.active
          })
          .eq('id', variant.id);
      } else {
        // Create new
        await supabase
          .from('product_variants')
          .insert({
            product_id: productId,
            attributes: variant.attributes,
            sku: variant.sku,
            price_adjustment: variant.price_adjustment,
            stock_quantity: variant.stock_quantity,
            low_stock_threshold: variant.low_stock_threshold,
            reorder_point: variant.reorder_point,
            images: variant.images,
            active: variant.active
          });
      }

      await loadData();
      setEditingVariant(null);
      toast({
        title: "Sucesso",
        description: "Variação salva com sucesso",
      });
    } catch (error) {
      console.error('Error saving variant:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar variação",
        variant: "destructive",
      });
    }
  };

  const deleteVariant = async (variantId: string) => {
    try {
      await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      await loadData();
      toast({
        title: "Sucesso",
        description: "Variação removida com sucesso",
      });
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover variação",
        variant: "destructive",
      });
    }
  };

  const addAttributeValue = () => {
    setNewAttribute(prev => ({
      ...prev,
      values: [...prev.values, '']
    }));
  };

  const removeAttributeValue = (index: number) => {
    setNewAttribute(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  };

  const updateAttributeValue = (index: number, value: string) => {
    setNewAttribute(prev => ({
      ...prev,
      values: prev.values.map((v, i) => i === index ? value : v)
    }));
  };

  const addNewAttribute = () => {
    if (!newAttribute.name || newAttribute.values.some(v => !v.trim())) {
      toast({
        title: "Erro",
        description: "Preencha o nome do atributo e todos os valores",
        variant: "destructive",
      });
      return;
    }

    const attribute: ProductAttribute = {
      attribute_name: newAttribute.name,
      attribute_values: newAttribute.values.filter(v => v.trim()),
      display_order: attributes.length
    };

    saveAttribute(attribute);
    setNewAttribute({ name: '', values: [''] });
  };

  const renderAttributeManager = () => (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Atributos</CardTitle>
        <CardDescription>
          Defina os tipos de variação (tamanho, cor, etc.) e seus valores
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing attributes */}
        {attributes.map((attribute) => (
          <div key={attribute.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium capitalize">{attribute.attribute_name}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteAttribute(attribute.id!)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attribute.attribute_values.map((value, index) => (
                <Badge key={index} variant="outline">
                  {value}
                </Badge>
              ))}
            </div>
          </div>
        ))}

        {/* New attribute form */}
        <div className="border-2 border-dashed border-border rounded-lg p-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="attribute-name">Nome do Atributo</Label>
              <Input
                id="attribute-name"
                placeholder="Ex: Tamanho, Cor, Material"
                value={newAttribute.name}
                onChange={(e) => setNewAttribute(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label>Valores</Label>
              <div className="space-y-2">
                {newAttribute.values.map((value, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Ex: P, M, G"
                      value={value}
                      onChange={(e) => updateAttributeValue(index, e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttributeValue(index)}
                      disabled={newAttribute.values.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addAttributeValue}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Valor
                </Button>
              </div>
            </div>

            <Button onClick={addNewAttribute} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Atributo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderVariantMatrix = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Matriz de Variações</CardTitle>
            <CardDescription>
              Gerencie estoque e preços para cada combinação
            </CardDescription>
          </div>
          <Button onClick={generateVariants} disabled={attributes.length === 0}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Gerar Combinações
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {variants.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma variação criada ainda</p>
            <p className="text-sm">Defina os atributos e clique em "Gerar Combinações"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div key={variant.id || index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {Object.entries(variant.attributes).map(([key, value]) => (
                      <Badge key={key} variant="secondary">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingVariant(variant.id || index.toString())}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteVariant(variant.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {editingVariant === (variant.id || index.toString()) ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label>SKU</Label>
                      <Input
                        value={variant.sku}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[index].sku = e.target.value;
                          setVariants(updated);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Ajuste de Preço</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variant.price_adjustment}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[index].price_adjustment = Number(e.target.value);
                          setVariants(updated);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Estoque</Label>
                      <Input
                        type="number"
                        value={variant.stock_quantity}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[index].stock_quantity = Number(e.target.value);
                          setVariants(updated);
                        }}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        size="sm"
                        onClick={() => saveVariant(variant)}
                        className="mr-2"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingVariant(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">SKU:</span>
                      <div className="font-medium">{variant.sku}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ajuste:</span>
                      <div className="font-medium">
                        {variant.price_adjustment > 0 ? '+' : ''}
                        R$ {variant.price_adjustment.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estoque:</span>
                      <div className="font-medium">{variant.stock_quantity}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="font-medium">
                        {variant.active ? 'Ativo' : 'Inativo'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="attributes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attributes">Atributos</TabsTrigger>
          <TabsTrigger value="variants">Variações</TabsTrigger>
        </TabsList>
        <TabsContent value="attributes" className="space-y-4">
          {renderAttributeManager()}
        </TabsContent>
        <TabsContent value="variants" className="space-y-4">
          {renderVariantMatrix()}
        </TabsContent>
      </Tabs>
    </div>
  );
};
