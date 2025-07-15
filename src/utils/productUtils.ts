import { Product } from '@/hooks/useProducts';

export interface ProductCardData {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string[];
  isNew?: boolean;
  isOnSale?: boolean;
  discount?: number;
  slug?: string;
}

export const mapProductToCardData = (product: Product): ProductCardData => {
  const isOnSale = product.sale_price && product.sale_price < product.price;
  const discount = isOnSale 
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : undefined;

  // Check if product is new (created in the last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const isNew = new Date(product.created_at) > oneWeekAgo;

  return {
    id: product.id,
    name: product.name,
    price: isOnSale ? product.sale_price! : product.price,
    originalPrice: isOnSale ? product.price : undefined,
    image: product.images || [],
    isNew,
    isOnSale: !!isOnSale,
    discount,
    slug: product.slug
  };
};