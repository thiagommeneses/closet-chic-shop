import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useInventory } from '@/hooks/useInventory';
import { supabase } from '@/integrations/supabase/client';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  variation_id?: string; // Add variation_id to track specific variation
}

// Generate a unique session ID for cart reservations
const generateSessionId = (): string => {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getSessionId = (): string => {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' };

// Função para carregar estado do localStorage
const loadCartFromStorage = (): CartState => {
  try {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      const parsed = JSON.parse(storedCart);
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        isOpen: false,
      };
    }
  } catch (error) {
    console.error('Erro ao carregar carrinho do localStorage:', error);
  }
  return {
    items: [],
    isOpen: false,
  };
};

const initialState: CartState = loadCartFromStorage();

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Use a combination of product ID and variation ID for unique items
      const itemKey = `${action.payload.id}_${action.payload.variation_id || 'base'}`;
      const existingItem = state.items.find(item => 
        item.id === action.payload.id && 
        (item.variation_id || 'base') === (action.payload.variation_id || 'base')
      );
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            (item.id === action.payload.id && 
             (item.variation_id || 'base') === (action.payload.variation_id || 'base'))
              ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
              : item
          ),
        };
      }
      
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }],
      };
    }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => {
          const itemKey = `${item.id}_${item.variation_id || 'base'}`;
          return itemKey !== action.payload;
        }),
      };
    
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => {
            const itemKey = `${item.id}_${item.variation_id || 'base'}`;
            return itemKey !== action.payload.id;
          }),
        };
      }
      
      return {
        ...state,
        items: state.items.map(item => {
          const itemKey = `${item.id}_${item.variation_id || 'base'}`;
          return itemKey === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item;
        }),
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };
    
    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen,
      };
    
    case 'OPEN_CART':
      return {
        ...state,
        isOpen: true,
      };
    
    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false,
      };
    
    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  completeOrder: (orderId: string) => Promise<{ success: boolean; error?: string }>;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalPrice: number;
  sessionId: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { reserveCartItem, releaseCartItem, processOrder } = useInventory();
  const sessionId = getSessionId();

  // Salvar no localStorage sempre que o carrinho mudar
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify({ items: state.items }));
    } catch (error) {
      console.error('Erro ao salvar carrinho no localStorage:', error);
    }
  }, [state.items]);

  // Cleanup reservations on unmount
  useEffect(() => {
    const cleanup = async () => {
      // Release all reserved items when component unmounts
      for (const item of state.items) {
        try {
          await releaseCartItem(sessionId, item.id);
        } catch (error) {
          console.error('Erro ao liberar reserva:', error);
        }
      }
    };

    return () => {
      cleanup();
    };
  }, []);

  // Check product availability with variation support
  const checkProductAvailability = async (productId: string, requestedQuantity: number, variationId?: string) => {
    try {
      console.log(`Checking availability for product ${productId}, variation: ${variationId}, quantity: ${requestedQuantity}`);
      
      let availableStock = 0;
      let productData;
      
      if (variationId) {
        // Check variation stock
        const { data: variation, error: variationError } = await supabase
          .from('product_variations')
          .select('id, variation_type, variation_value, stock_quantity')
          .eq('id', variationId)
          .eq('active', true)
          .single();

        if (variationError) {
          console.error('Error fetching variation:', variationError);
          throw new Error('Variação do produto não encontrada');
        }

        availableStock = variation.stock_quantity || 0;

        // Also check if the main product is active
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, name, active')
          .eq('id', productId)
          .single();

        if (productError || !product.active) {
          throw new Error('Produto não está disponível');
        }

        productData = product;
      } else {
        // Check main product stock
        const { data: product, error } = await supabase
          .from('products')
          .select('id, name, stock_quantity, active')
          .eq('id', productId)
          .single();

        if (error) {
          console.error('Error fetching product:', error);
          throw new Error('Produto não encontrado');
        }

        if (!product.active) {
          throw new Error('Produto não está disponível');
        }

        availableStock = product.stock_quantity || 0;
        productData = product;
      }

      if (availableStock < requestedQuantity) {
        throw new Error(`Estoque insuficiente. Disponível: ${availableStock}, solicitado: ${requestedQuantity}`);
      }

      return { available: true, stock: availableStock };
    } catch (error) {
      console.error('Error checking product availability:', error);
      throw error;
    }
  };

  const addItem = async (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    try {
      const quantity = item.quantity || 1;
      const productId = item.id;
      const variationId = item.variation_id;
      
      console.log(`Adding item to cart: ${item.name} (ID: ${productId}, Variation: ${variationId}), quantity: ${quantity}`);
      
      // Check if item already exists in cart (considering variation)
      const existingItem = state.items.find(cartItem => 
        cartItem.id === item.id && 
        (cartItem.variation_id || 'base') === (item.variation_id || 'base')
      );
      const totalQuantityNeeded = existingItem ? existingItem.quantity + quantity : quantity;
      
      // Check product availability first
      await checkProductAvailability(productId, totalQuantityNeeded, variationId);
      
      // Try to reserve the item in inventory
      await reserveCartItem(sessionId, productId, quantity, variationId);
      
      // If successful, add to cart
      dispatch({ type: 'ADD_ITEM', payload: item });
      
      toast({
        title: 'Produto adicionado ao carrinho',
        description: `${item.name} foi adicionado com sucesso.`,
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      
      let errorMessage = 'Não foi possível adicionar o produto ao carrinho';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro ao adicionar produto',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw error;
    }
  };

  const removeItem = async (itemKey: string) => {
    try {
      console.log(`Removing item from cart: ${itemKey}`);
      
      // Parse itemKey to get productId and variationId
      const [productId, variationKey] = itemKey.split('_');
      const variationId = variationKey === 'base' ? undefined : variationKey;
      
      // Release the reservation before removing from cart
      await releaseCartItem(sessionId, productId, variationId);
      
      dispatch({ type: 'REMOVE_ITEM', payload: itemKey });
      toast({
        title: 'Produto removido',
        description: 'Item removido do carrinho.',
      });
    } catch (error) {
      console.error('Erro ao liberar reserva:', error);
      // Even if reservation release fails, remove from cart
      dispatch({ type: 'REMOVE_ITEM', payload: itemKey });
      
      toast({
        title: 'Produto removido',
        description: 'Item removido do carrinho (aviso: erro ao liberar reserva).',
        variant: 'destructive'
      });
    }
  };

  const updateQuantity = async (itemKey: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeItem(itemKey);
        return;
      }

      console.log(`Updating quantity for item ${itemKey} to ${quantity}`);
      
      // Parse itemKey to get productId and variationId
      const [productId, variationKey] = itemKey.split('_');
      const variationId = variationKey === 'base' ? undefined : variationKey;
      
      // Check product availability for the new quantity
      await checkProductAvailability(productId, quantity, variationId);

      // Update reservation with new quantity
      await reserveCartItem(sessionId, productId, quantity, variationId);
      
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemKey, quantity } });
    } catch (error) {
      console.error('Error updating quantity:', error);
      
      let errorMessage = 'Não foi possível atualizar a quantidade';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro ao atualizar quantidade',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const clearCart = async () => {
    try {
      console.log('Clearing cart');
      
      // Release all reservations
      for (const item of state.items) {
        try {
          await releaseCartItem(sessionId, item.id, item.variation_id);
        } catch (error) {
          console.error(`Error releasing reservation for item ${item.id}:`, error);
        }
      }
      
      dispatch({ type: 'CLEAR_CART' });
      toast({
        title: 'Carrinho limpo',
        description: 'Todos os itens foram removidos do carrinho.',
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Even if some reservations fail to release, clear the cart
      dispatch({ type: 'CLEAR_CART' });
      
      toast({
        title: 'Carrinho limpo',
        description: 'Carrinho limpo (aviso: erro ao liberar algumas reservas).',
        variant: 'destructive'
      });
    }
  };

  const completeOrder = async (orderId: string) => {
    try {
      console.log(`Completing order: ${orderId}`);
      
      await processOrder(sessionId, orderId);
      
      // Clear cart after successful order processing
      dispatch({ type: 'CLEAR_CART' });
      
      // Generate new session ID for next cart
      const newSessionId = generateSessionId();
      localStorage.setItem('cart_session_id', newSessionId);
      
      return { success: true };
    } catch (error) {
      console.error('Error completing order:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao processar pedido' 
      };
    }
  };

  const toggleCart = () => dispatch({ type: 'TOGGLE_CART' });
  const openCart = () => dispatch({ type: 'OPEN_CART' });
  const closeCart = () => dispatch({ type: 'CLOSE_CART' });

  const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = state.items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        completeOrder,
        toggleCart,
        openCart,
        closeCart,
        totalItems,
        totalPrice,
        sessionId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
};
