import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Store, Truck, CreditCard, BarChart3, Shield, Clock, DollarSign } from 'lucide-react';

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
      // First try to update existing setting
      const { data: existingSetting } = await supabase
        .from('settings')
        .select('id')
        .eq('key', key)
        .single();

      if (existingSetting) {
        // Update existing setting
        const { error } = await supabase
          .from('settings')
          .update({
            value: JSON.stringify(value),
            updated_at: new Date().toISOString()
          })
          .eq('key', key);

        if (error) throw error;
      } else {
        // Insert new setting
        const { error } = await supabase
          .from('settings')
          .insert({
            key,
            value: JSON.stringify(value)
          });

        if (error) throw error;
      }

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
      
      await Promise.all([
        updateSetting('pagarme_api_key', formData.get('pagarme_api_key')),
        updateSetting('pagarme_public_key', formData.get('pagarme_public_key')),
        updateSetting('pagarme_environment', formData.get('pagarme_environment')),
        updateSetting('pagarme_enable_credit_card', formData.get('pagarme_enable_credit_card') === 'on'),
        updateSetting('pagarme_enable_boleto', formData.get('pagarme_enable_boleto') === 'on'),
        updateSetting('pagarme_enable_pix', formData.get('pagarme_enable_pix') === 'on'),
        updateSetting('pagarme_max_installments', parseInt(formData.get('pagarme_max_installments') as string) || 12),
        updateSetting('pagarme_installment_min_amount', parseFloat(formData.get('pagarme_installment_min_amount') as string) || 30),
        updateSetting('pagarme_boleto_days_to_expire', parseInt(formData.get('pagarme_boleto_days_to_expire') as string) || 7),
        updateSetting('pagarme_antifraud_enabled', formData.get('pagarme_antifraud_enabled') === 'on')
      ]);

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
            <div className="space-y-6">
              {/* API Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Configuração da API Pagar.me</span>
                  </CardTitle>
                  <CardDescription>
                    Configure suas chaves de API e ambiente do Pagar.me
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSavePayment} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pagarme_public_key">Chave Pública</Label>
                        <Input
                          id="pagarme_public_key"
                          name="pagarme_public_key"
                          defaultValue={settings.pagarme_public_key || ''}
                          placeholder="pk_test_..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pagarme_api_key">Chave Secreta</Label>
                        <Input
                          id="pagarme_api_key"
                          name="pagarme_api_key"
                          type="password"
                          defaultValue={settings.pagarme_api_key || ''}
                          placeholder="sk_test_..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pagarme_environment">Ambiente</Label>
                      <Select name="pagarme_environment" defaultValue={settings.pagarme_environment || 'test'}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ambiente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="test">Teste (Sandbox)</SelectItem>
                          <SelectItem value="live">Produção (Live)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Métodos de Pagamento</h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="pagarme_enable_credit_card">Cartão de Crédito</Label>
                          <p className="text-sm text-muted-foreground">
                            Aceitar pagamentos com cartão de crédito
                          </p>
                        </div>
                        <Switch
                          id="pagarme_enable_credit_card"
                          name="pagarme_enable_credit_card"
                          defaultChecked={settings.pagarme_enable_credit_card !== false}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="pagarme_enable_boleto">Boleto Bancário</Label>
                          <p className="text-sm text-muted-foreground">
                            Aceitar pagamentos via boleto bancário
                          </p>
                        </div>
                        <Switch
                          id="pagarme_enable_boleto"
                          name="pagarme_enable_boleto"
                          defaultChecked={settings.pagarme_enable_boleto !== false}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="pagarme_enable_pix">PIX</Label>
                          <p className="text-sm text-muted-foreground">
                            Aceitar pagamentos via PIX
                          </p>
                        </div>
                        <Switch
                          id="pagarme_enable_pix"
                          name="pagarme_enable_pix"
                          defaultChecked={settings.pagarme_enable_pix !== false}
                        />
                      </div>
                    </div>

                    {/* Credit Card Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Configurações de Parcelamento</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="pagarme_max_installments">Máximo de Parcelas</Label>
                          <Select name="pagarme_max_installments" defaultValue={String(settings.pagarme_max_installments || 12)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                <SelectItem key={num} value={String(num)}>{num}x</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pagarme_installment_min_amount">Valor Mínimo por Parcela (R$)</Label>
                          <Input
                            id="pagarme_installment_min_amount"
                            name="pagarme_installment_min_amount"
                            type="number"
                            step="0.01"
                            defaultValue={settings.pagarme_installment_min_amount || 30}
                            placeholder="30.00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Boleto Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Configurações de Boleto</span>
                      </h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="pagarme_boleto_days_to_expire">Dias para Vencimento do Boleto</Label>
                        <Select name="pagarme_boleto_days_to_expire" defaultValue={String(settings.pagarme_boleto_days_to_expire || 7)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 dia</SelectItem>
                            <SelectItem value="3">3 dias</SelectItem>
                            <SelectItem value="7">7 dias</SelectItem>
                            <SelectItem value="15">15 dias</SelectItem>
                            <SelectItem value="30">30 dias</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Security Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Configurações de Segurança</span>
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="pagarme_antifraud_enabled">Antifraude</Label>
                          <p className="text-sm text-muted-foreground">
                            Ativar análise antifraude da Pagar.me
                          </p>
                        </div>
                        <Switch
                          id="pagarme_antifraud_enabled"
                          name="pagarme_antifraud_enabled"
                          defaultChecked={settings.pagarme_antifraud_enabled !== false}
                        />
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                      <p className="font-medium mb-2">📋 Como configurar:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Acesse seu dashboard da Pagar.me</li>
                        <li>Vá em Configurações → API Keys</li>
                        <li>Copie a chave pública e secreta</li>
                        <li>Para produção, altere o ambiente para "Live"</li>
                      </ol>
                      <p className="mt-2 text-amber-600">
                        ⚠️ Em ambiente de teste, use sempre as chaves que começam com "pk_test_" e "sk_test_"
                      </p>
                    </div>

                    <Button type="submit" disabled={saving} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Salvando...' : 'Salvar Configurações de Pagamento'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
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