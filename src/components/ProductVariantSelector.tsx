import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Check, AlertCircle } from 'lucide-react';

interface ProductAttribute {
  attribute_name: string;
  attribute_values: string[];
  display_order: number;
}

interface ProductVariant {
  id: string;
  attributes: Record<string, string>;
  sku: string;
  price_adjustment: number;
  stock_quantity: number;
  images: string[];
  active: boolean;
}

interface AvailableAttribute {
  attribute_name: string;
  available_values: string[];
  has_stock: boolean;
}

interface ProductVariantSelectorProps {
  productId: string;
  basePrice: number;
  onVariantChange?: (variant: ProductVariant | null, finalPrice: number) => void;
  onStockChange?: (stock: number) => void;
}

export const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({
  productId,
  basePrice,
  onVariantChange,
  onStockChange
}) => {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [availableAttributes, setAvailableAttributes] = useState<AvailableAttribute[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [productId]);

  useEffect(() => {
    updateAvailableAttributes();
  }, [selectedAttributes, variants]);

  useEffect(() => {
    // Find matching variant
    const matchingVariant = variants.find(variant => 
      JSON.stringify(variant.attributes) === JSON.stringify(selectedAttributes)
    );

    setSelectedVariant(matchingVariant || null);
    
    const finalPrice = matchingVariant 
      ? basePrice + matchingVariant.price_adjustment 
      : basePrice;

    onVariantChange?.(matchingVariant || null, finalPrice);
    onStockChange?.(matchingVariant?.stock_quantity || 0);
  }, [selectedAttributes, variants, basePrice, onVariantChange, onStockChange]);

  const loadData = async () => {
    try {
      setLoading(true);

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
        .eq('active', true);

      setAttributes((attributesData || []).map(attr => ({
        ...attr,
        attribute_values: attr.attribute_values as string[]
      })));
      setVariants((variantsData || []).map(variant => ({
        ...variant,
        attributes: variant.attributes as Record<string, string>
      })));
    } catch (error) {
      console.error('Error loading variant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailableAttributes = async () => {
    try {
      const { data } = await supabase
        .rpc('get_available_attribute_values', {
          p_product_id: productId,
          p_selected_attributes: selectedAttributes
        });

      setAvailableAttributes((data || []).map(attr => ({
        ...attr,
        available_values: attr.available_values as string[]
      })));
    } catch (error) {
      console.error('Error updating available attributes:', error);
    }
  };

  const handleAttributeSelect = (attributeName: string, value: string) => {
    const newSelectedAttributes = { ...selectedAttributes };
    
    if (newSelectedAttributes[attributeName] === value) {
      // Deselect if clicking the same value
      delete newSelectedAttributes[attributeName];
    } else {
      newSelectedAttributes[attributeName] = value;
    }

    // Clear subsequent selections that might become invalid
    const attributeOrder = attributes.map(attr => attr.attribute_name);
    const currentIndex = attributeOrder.indexOf(attributeName);
    
    attributeOrder.slice(currentIndex + 1).forEach(attr => {
      delete newSelectedAttributes[attr];
    });

    setSelectedAttributes(newSelectedAttributes);
  };

  const isValueAvailable = (attributeName: string, value: string) => {
    const availableAttr = availableAttributes.find(attr => attr.attribute_name === attributeName);
    return availableAttr ? availableAttr.available_values.includes(value) : false;
  };

  const isValueInStock = (attributeName: string, value: string) => {
    const testAttributes = { ...selectedAttributes, [attributeName]: value };
    const matchingVariant = variants.find(variant => 
      JSON.stringify(variant.attributes) === JSON.stringify(testAttributes)
    );
    return matchingVariant ? matchingVariant.stock_quantity > 0 : false;
  };

  const getAttributeDisplayName = (attributeName: string) => {
    const displayNames: Record<string, string> = {
      'size': 'Tamanho',
      'color': 'Cor',
      'material': 'Material',
      'style': 'Estilo'
    };
    return displayNames[attributeName] || attributeName.charAt(0).toUpperCase() + attributeName.slice(1);
  };

  const canSelectAttribute = (attributeName: string) => {
    const attributeOrder = attributes.map(attr => attr.attribute_name);
    const currentIndex = attributeOrder.indexOf(attributeName);
    
    // First attribute can always be selected
    if (currentIndex === 0) return true;
    
    // Check if all previous attributes are selected
    for (let i = 0; i < currentIndex; i++) {
      if (!selectedAttributes[attributeOrder[i]]) {
        return false;
      }
    }
    
    return true;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-20 mb-2"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-muted rounded w-16"></div>
            <div className="h-8 bg-muted rounded w-16"></div>
            <div className="h-8 bg-muted rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  if (attributes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {attributes.map((attribute) => (
        <div key={attribute.attribute_name}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-medium text-sm">
              {getAttributeDisplayName(attribute.attribute_name)}
            </h3>
            {selectedAttributes[attribute.attribute_name] && (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {attribute.attribute_values.map((value) => {
              const isSelected = selectedAttributes[attribute.attribute_name] === value;
              const isAvailable = isValueAvailable(attribute.attribute_name, value);
              const hasStock = isValueInStock(attribute.attribute_name, value);
              const canSelect = canSelectAttribute(attribute.attribute_name);
              
              return (
                <Button
                  key={value}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={`
                    ${!canSelect ? 'opacity-50 cursor-not-allowed' : ''}
                    ${!isAvailable ? 'opacity-30' : ''}
                    ${!hasStock && isAvailable ? 'border-orange-300 text-orange-600' : ''}
                  `}
                  onClick={() => {
                    if (canSelect && isAvailable) {
                      handleAttributeSelect(attribute.attribute_name, value);
                    }
                  }}
                  disabled={!canSelect || !isAvailable}
                >
                  {value}
                  {!hasStock && isAvailable && (
                    <AlertCircle className="h-3 w-3 ml-1 text-orange-500" />
                  )}
                </Button>
              );
            })}
          </div>
          
          {!canSelectAttribute(attribute.attribute_name) && (
            <p className="text-xs text-muted-foreground mt-1">
              Selecione as opções anteriores primeiro
            </p>
          )}
        </div>
      ))}

      {selectedVariant && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">
                  Variação selecionada
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-700">
                  SKU: {selectedVariant.sku}
                </div>
                <div className="text-sm text-green-700">
                  Estoque: {selectedVariant.stock_quantity} unidades
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-2">
              {Object.entries(selectedVariant.attributes).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="bg-green-100 text-green-800">
                  {getAttributeDisplayName(key)}: {value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(selectedAttributes).length > 0 && !selectedVariant && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-orange-800">
                Esta combinação não está disponível
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};