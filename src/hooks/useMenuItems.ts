import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MenuItem {
  id: string;
  name: string;
  link?: string;
  position: number;
  active: boolean;
  is_category: boolean;
  category_id?: string;
  tag_id?: string;
}

export const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('active', true)
        .order('position', { ascending: true });

      if (error) {
        throw error;
      }

      setMenuItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar itens do menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  return {
    menuItems,
    loading,
    error,
    refetch: fetchMenuItems
  };
};