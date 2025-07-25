import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  images: string[];
  description?: string;
  featured?: boolean;
  active?: boolean;
  created_at: string;
  category_id?: string;
  stock_quantity?: number;
  tags?: string[];
  slug: string;
  sku?: string;
  weight_grams?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  has_variations?: boolean;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // First get all products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (productsError) {
        throw productsError;
      }

      // Get products with variations
      const { data: variationsData, error: variationsError } = await supabase
        .from('product_variations')
        .select('product_id')
        .eq('active', true);

      if (variationsError) {
        throw variationsError;
      }

      // Create a set of product IDs that have variations
      const productsWithVariations = new Set(
        variationsData?.map(v => v.product_id) || []
      );

      // Process products to add has_variations flag
      const processedProducts = (productsData || []).map(product => ({
        ...product,
        has_variations: productsWithVariations.has(product.id)
      }));

      setProducts(processedProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar produtos');
    } finally {
      setLoading(false);
    }
  };

  const getFeaturedProducts = () => {
    return products.filter(product => product.featured);
  };

  const getNewProducts = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return products.filter(product => 
      new Date(product.created_at) > oneWeekAgo
    );
  };

  const getOnSaleProducts = () => {
    return products.filter(product => 
      product.sale_price && product.sale_price < product.price
    );
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    getFeaturedProducts,
    getNewProducts,
    getOnSaleProducts
  };
};