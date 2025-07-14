import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Store, Truck, CreditCard, BarChart3 } from 'lucide-react';

interface Setting {
  key: string;
  value: any;
  description: string;
}

export const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      const settingsMap: Record<string, any> = {};
      data?.forEach((setting: Setting) => {
        settingsMap[setting.key] = typeof setting.value === 'string' 
          ? JSON.parse(setting.value) 
          : setting.value;
      });

      setSettings(settingsMap);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key,
          value: JSON.stringify(value)
        });

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    } catch (error: any) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      await Promise.all([
        updateSetting('store_name', formData.get('store_name')),
        updateSetting('store_description', formData.get('store_description')),
        updateSetting('free_shipping_min', parseFloat(formData.get('free_shipping_min') as string) || 0)
      ]);

      toast({
        title: "Configurações gerais salvas com sucesso!"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      await Promise.all([
        updateSetting('correios_user', formData.get('correios_user')),
        updateSetting('correios_password', formData.get('correios_password'))
      ]);

      toast({
        title: "Configurações de frete salvas com sucesso!"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      await updateSetting('pagarme_api_key', formData.get('pagarme_api_key'));

      toast({
        title: "Configurações de pagamento salvas com sucesso!"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnalytics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      await Promise.all([
        updateSetting('google_analytics_id', formData.get('google_analytics_id')),
        updateSetting('facebook_pixel_id', formData.get('facebook_pixel_id'))
      ]);

      toast({
        title: "Configurações de analytics salvas com sucesso!"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse">Carregando configurações...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Configure sua loja e integrações
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Store className="h-4 w-4" />
              <span>Geral</span>
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center space-x-2">
              <Truck className="h-4 w-4" />
              <span>Frete</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Pagamento</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais da Loja</CardTitle>
                <CardDescription>
                  Configure as informações básicas da sua loja
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveGeneral} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="store_name">Nome da Loja</Label>
                    <Input
                      id="store_name"
                      name="store_name"
                      defaultValue={settings.store_name || ''}
                      placeholder="Closet Collection"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store_description">Descrição da Loja</Label>
                    <Textarea
                      id="store_description"
                      name="store_description"
                      defaultValue={settings.store_description || ''}
                      placeholder="Elegância e sofisticação em cada detalhe"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="free_shipping_min">Valor Mínimo para Frete Grátis (R$)</Label>
                    <Input
                      id="free_shipping_min"
                      name="free_shipping_min"
                      type="number"
                      step="0.01"
                      defaultValue={settings.free_shipping_min || 200}
                      placeholder="200.00"
                    />
                  </div>

                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Configurações Gerais'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping Settings */}
          <TabsContent value="shipping">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Frete</CardTitle>
                <CardDescription>
                  Configure a integração com os Correios para cálculo de frete em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveShipping} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="correios_user">Usuário dos Correios</Label>
                    <Input
                      id="correios_user"
                      name="correios_user"
                      defaultValue={settings.correios_user || ''}
                      placeholder="seu_usuario"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="correios_password">Senha dos Correios</Label>
                    <Input
                      id="correios_password"
                      name="correios_password"
                      type="password"
                      defaultValue={settings.correios_password || ''}
                      placeholder="sua_senha"
                    />
                  </div>

                  <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Como obter as credenciais dos Correios:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Acesse o site dos Correios para empresas</li>
                      <li>Faça o cadastro ou login no sistema</li>
                      <li>Solicite acesso ao webservice de cálculo de frete</li>
                      <li>Use as credenciais fornecidas aqui</li>
                    </ol>
                  </div>

                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Configurações de Frete'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Pagamento</CardTitle>
                <CardDescription>
                  Configure a integração com o Pagar.me para processar pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSavePayment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pagarme_api_key">Chave da API do Pagar.me</Label>
                    <Input
                      id="pagarme_api_key"
                      name="pagarme_api_key"
                      type="password"
                      defaultValue={settings.pagarme_api_key || ''}
                      placeholder="ak_test_..."
                    />
                  </div>

                  <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Como obter a chave da API:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Crie uma conta no Pagar.me</li>
                      <li>Acesse o painel administrativo</li>
                      <li>Vá até Configurações → API Keys</li>
                      <li>Copie a chave de teste ou produção</li>
                    </ol>
                    <p className="mt-2 text-yellow-600">
                      ⚠️ Use a chave de teste durante o desenvolvimento
                    </p>
                  </div>

                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Configurações de Pagamento'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Settings */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Analytics</CardTitle>
                <CardDescription>
                  Configure Google Analytics e Facebook Pixel para acompanhar o desempenho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveAnalytics} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google_analytics_id">ID do Google Analytics</Label>
                    <Input
                      id="google_analytics_id"
                      name="google_analytics_id"
                      defaultValue={settings.google_analytics_id || ''}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook_pixel_id">ID do Facebook Pixel</Label>
                    <Input
                      id="facebook_pixel_id"
                      name="facebook_pixel_id"
                      defaultValue={settings.facebook_pixel_id || ''}
                      placeholder="1234567890123456"
                    />
                  </div>

                  <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">Dicas de configuração:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Google Analytics:</strong> Crie uma propriedade GA4 e use o ID que começa com "G-"</li>
                      <li><strong>Facebook Pixel:</strong> Crie um pixel no Meta Business Manager</li>
                      <li>Estes códigos serão automaticamente incluídos em todas as páginas</li>
                    </ul>
                  </div>

                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Configurações de Analytics'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};