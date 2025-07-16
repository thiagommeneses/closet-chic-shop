import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Banner {
  id: string;
  name: string;
  type: 'hero' | 'half' | 'full';
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_link?: string;
  image_url?: string;
  video_url?: string;
  description?: string;
  tips?: string;
  information?: string;
  position: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('active', true)
        .order('type', { ascending: true })
        .order('position', { ascending: true });

      if (error) throw error;
      setBanners((data as Banner[]) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBannersByType = (type: 'hero' | 'half' | 'full') => {
    return banners.filter(banner => banner.type === type);
  };

  const getHeroBanners = () => getBannersByType('hero');
  const getHalfBanners = () => getBannersByType('half');
  const getFullBanners = () => getBannersByType('full');

  return {
    banners,
    loading,
    error,
    getBannersByType,
    getHeroBanners,
    getHalfBanners,
    getFullBanners,
    refetch: loadBanners
  };
};