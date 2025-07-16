import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface TopBannerSettings {
  enabled: boolean;
  text: string;
  background_color: string;
  text_color: string;
  font_size: string;
  dismissible: boolean;
}

export const TopBanner = () => {
  const [settings, setSettings] = useState<TopBannerSettings | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'top_banner')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading top banner settings:', error);
        return;
      }

      if (data?.value) {
        setSettings(data.value as unknown as TopBannerSettings);
      }
    } catch (error) {
      console.error('Error loading top banner settings:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('top_banner_dismissed', 'true');
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('top_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  if (!settings?.enabled || isDismissed) {
    return null;
  }

  return (
    <div 
      className="w-full py-2 px-4 relative flex items-center justify-center"
      style={{ 
        backgroundColor: settings.background_color,
        color: settings.text_color
      }}
    >
      <p 
        className="text-center font-medium"
        style={{ fontSize: settings.font_size }}
      >
        {settings.text}
      </p>
      
      {settings.dismissible && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 h-6 w-6 p-0 hover:bg-black/10"
          onClick={handleDismiss}
          style={{ color: settings.text_color }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};