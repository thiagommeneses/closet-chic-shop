import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TopBannerSettings {
  enabled: boolean;
  text: string;
  background_color: string;
  text_color: string;
  font_size: string;
  dismissible: boolean;
}

const defaultSettings: TopBannerSettings = {
  enabled: false,
  text: '',
  background_color: '#000000',
  text_color: '#ffffff',
  font_size: '14px',
  dismissible: true
};

export const AdminTopBanner = () => {
  const [settings, setSettings] = useState<TopBannerSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'top_banner')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.value) {
        setSettings({ ...defaultSettings, ...(data.value as unknown as TopBannerSettings) });
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'top_banner',
          value: JSON.parse(JSON.stringify(settings)),
          description: 'Configurações da tarja superior'
        });

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
      // Clear localStorage to allow banner to show again if enabled
      if (settings.enabled) {
        localStorage.removeItem('top_banner_dismissed');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(`Erro ao salvar configurações: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof TopBannerSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarja Superior</h1>
          <p className="text-muted-foreground">
            Configure a tarja que aparece no topo do site
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurações da Tarja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
              />
              <Label htmlFor="enabled">Ativar tarja superior</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">Texto da tarja</Label>
              <Textarea
                id="text"
                placeholder="Digite o texto que aparecerá na tarja..."
                value={settings.text}
                onChange={(e) => handleSettingChange('text', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="background_color">Cor de fundo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="background_color"
                    type="color"
                    value={settings.background_color}
                    onChange={(e) => handleSettingChange('background_color', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={settings.background_color}
                    onChange={(e) => handleSettingChange('background_color', e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text_color">Cor do texto</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="text_color"
                    type="color"
                    value={settings.text_color}
                    onChange={(e) => handleSettingChange('text_color', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={settings.text_color}
                    onChange={(e) => handleSettingChange('text_color', e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font_size">Tamanho da fonte</Label>
              <Select value={settings.font_size} onValueChange={(value) => handleSettingChange('font_size', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12px">12px - Pequeno</SelectItem>
                  <SelectItem value="14px">14px - Médio</SelectItem>
                  <SelectItem value="16px">16px - Grande</SelectItem>
                  <SelectItem value="18px">18px - Muito Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="dismissible"
                checked={settings.dismissible}
                onCheckedChange={(checked) => handleSettingChange('dismissible', checked)}
              />
              <Label htmlFor="dismissible">Permitir que usuários fechem a tarja</Label>
            </div>

            {settings.enabled && (
              <div className="border rounded-lg p-4">
                <Label className="text-sm font-medium mb-2 block">Prévia:</Label>
                <div 
                  className="w-full py-2 px-4 rounded text-center"
                  style={{ 
                    backgroundColor: settings.background_color,
                    color: settings.text_color,
                    fontSize: settings.font_size
                  }}
                >
                  {settings.text || 'Texto de exemplo'}
                </div>
              </div>
            )}

            <Button 
              onClick={saveSettings} 
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};