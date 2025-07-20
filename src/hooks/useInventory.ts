
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StockMovement {
  id: string;
  product_id: string;
  variation_id?: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'reserved' | 'released';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  order_id?: string;
  reference_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface InventoryAlert {
  id: string;
  product_id: string;
  variation_id?: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'reorder_point';
  threshold_value?: number;
  current_stock: number;
  status: 'active' | 'resolved' | 'ignored';
  created_at: string;
  updated_at: string;
  products?: {
    name: string;
    sku?: string;
  };
  product_variations?: {
    variation_type: string;
    variation_value: string;
  };
}

export const useInventory = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products (name, sku),
          product_variations (variation_type, variation_value)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: StockMovement[] = (data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        variation_id: item.variation_id,
        movement_type: item.movement_type as 'in' | 'out' | 'adjustment' | 'reserved' | 'released',
        quantity: item.quantity,
        previous_stock: item.previous_stock,
        new_stock: item.new_stock,
        reason: item.reason,
        order_id: item.order_id,
        reference_id: item.reference_id,
        notes: item.notes,
        created_by: item.created_by,
        created_at: item.created_at
      }));
      
      setMovements(transformedData);
    } catch (err) {
      console.error('Error fetching movements:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar movimentações');
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('inventory-management', {
        body: { action: 'get_alerts' }
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Error in response:', data.error);
        throw new Error(data.error);
      }

      setAlerts(data?.alerts || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar alertas');
    }
  };

  const recordMovement = async (
    productId: string,
    movementType: 'in' | 'out' | 'adjustment',
    quantity: number,
    variationId?: string,
    reason?: string,
    notes?: string
  ) => {
    try {
      console.log('Recording movement:', { productId, movementType, quantity, variationId });
      
      const { data, error } = await supabase.functions.invoke('inventory-management', {
        body: {
          action: 'record_movement',
          product_id: productId,
          movement_type: movementType,
          quantity,
          variation_id: variationId,
          reason,
          notes,
          created_by: 'admin' // TODO: Get actual user
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Error in response:', data.error);
        throw new Error(data.error);
      }

      await fetchMovements();
      await fetchAlerts();
      return data;
    } catch (err) {
      console.error('Error recording movement:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao registrar movimentação');
    }
  };

  const reserveCartItem = async (
    sessionId: string,
    productId: string,
    quantity: number,
    variationId?: string
  ) => {
    try {
      console.log('Reserving cart item:', { sessionId, productId, quantity, variationId });
      
      const { data, error } = await supabase.functions.invoke('inventory-management', {
        body: {
          action: 'reserve_cart',
          session_id: sessionId,
          product_id: productId,
          quantity,
          variation_id: variationId
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Error in response:', data.error);
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      console.error('Error reserving cart item:', err);
      // Provide more user-friendly error messages
      let errorMessage = 'Erro ao reservar item';
      
      if (err instanceof Error) {
        if (err.message.includes('Estoque insuficiente') || err.message.includes('Insufficient stock')) {
          errorMessage = 'Estoque insuficiente para este produto';
        } else if (err.message.includes('not found')) {
          errorMessage = 'Produto não encontrado';
        } else if (err.message.includes('not available')) {
          errorMessage = 'Produto não disponível';
        } else {
          errorMessage = err.message;
        }
      }
      
      throw new Error(errorMessage);
    }
  };

  const releaseCartItem = async (
    sessionId: string,
    productId: string,
    variationId?: string
  ) => {
    try {
      console.log('Releasing cart item:', { sessionId, productId, variationId });
      
      const { data, error } = await supabase.functions.invoke('inventory-management', {
        body: {
          action: 'release_cart',
          session_id: sessionId,
          product_id: productId,
          variation_id: variationId
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Error in response:', data.error);
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      console.error('Error releasing cart item:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao liberar item');
    }
  };

  const processOrder = async (sessionId: string, orderId: string) => {
    try {
      console.log('Processing order:', { sessionId, orderId });
      
      const { data, error } = await supabase.functions.invoke('inventory-management', {
        body: {
          action: 'process_order',
          session_id: sessionId,
          order_id: orderId
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Error in response:', data.error);
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      console.error('Error processing order:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao processar pedido');
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      await fetchAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao resolver alerta');
    }
  };

  const ignoreAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({ status: 'ignored' })
        .eq('id', alertId);

      if (error) throw error;
      await fetchAlerts();
    } catch (err) {
      console.error('Error ignoring alert:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao ignorar alerta');
    }
  };

  const cleanupExpiredReservations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('inventory-management', {
        body: { action: 'cleanup_reservations' }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('Error in response:', data.error);
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      console.error('Error in cleanup:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro na limpeza');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchMovements(), fetchAlerts()]);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    movements,
    alerts,
    loading,
    error,
    recordMovement,
    reserveCartItem,
    releaseCartItem,
    processOrder,
    resolveAlert,
    ignoreAlert,
    cleanupExpiredReservations,
    refetch: () => Promise.all([fetchMovements(), fetchAlerts()])
  };
};
