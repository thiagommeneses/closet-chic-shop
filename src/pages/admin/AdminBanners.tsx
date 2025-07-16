import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Image, Video, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';

interface Banner {
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

interface BannerFormData {
  name: string;
  type: 'hero' | 'half' | 'full';
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_url: string;
  video_url: string;
  description: string;
  tips: string;
  information: string;
  position: number;
  active: boolean;
}

export const AdminBanners = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<BannerFormData>({
    name: '',
    type: 'hero',
    title: '',
    subtitle: '',
    button_text: '',
    button_link: '',
    image_url: '',
    video_url: '',
    description: '',
    tips: '',
    information: '',
    position: 0,
    active: true
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('type', { ascending: true })
        .order('position', { ascending: true });

      if (error) throw error;
      setBanners((data as Banner[]) || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar banners",
        description: error.message
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'hero',
      title: '',
      subtitle: '',
      button_text: '',
      button_link: '',
      image_url: '',
      video_url: '',
      description: '',
      tips: '',
      information: '',
      position: 0,
      active: true
    });
    setEditingBanner(null);
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      if (type === 'image') {
        setFormData(prev => ({ ...prev, image_url: publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, video_url: publicUrl }));
      }

      toast({
        title: "Sucesso!",
        description: `${type === 'image' ? 'Imagem' : 'Vídeo'} carregado com sucesso.`,
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro",
        description: `Erro ao carregar ${type === 'image' ? 'imagem' : 'vídeo'}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      name: banner.name,
      type: banner.type,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      button_text: banner.button_text || '',
      button_link: banner.button_link || '',
      image_url: banner.image_url || '',
      video_url: banner.video_url || '',
      description: banner.description || '',
      tips: banner.tips || '',
      information: banner.information || '',
      position: banner.position,
      active: banner.active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bannerData = {
        name: formData.name,
        type: formData.type,
        title: formData.title || null,
        subtitle: formData.subtitle || null,
        button_text: formData.button_text || null,
        button_link: formData.button_link || null,
        image_url: formData.image_url || null,
        video_url: formData.video_url || null,
        description: formData.description || null,
        tips: formData.tips || null,
        information: formData.information || null,
        position: formData.position,
        active: formData.active
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
        
        toast({
          title: "Banner atualizado com sucesso!"
        });
      } else {
        const { error } = await supabase
          .from('banners')
          .insert([bannerData]);

        if (error) throw error;
        
        toast({
          title: "Banner criado com sucesso!"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadBanners();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: `Erro ao ${editingBanner ? 'atualizar' : 'criar'} banner`,
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm('Tem certeza que deseja excluir este banner?')) return;

    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', banner.id);

      if (error) throw error;
      
      toast({
        title: "Banner excluído com sucesso!"
      });
      
      loadBanners();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir banner",
        description: error.message
      });
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ active: !banner.active })
        .eq('id', banner.id);

      if (error) throw error;
      
      toast({
        title: `Banner ${!banner.active ? 'ativado' : 'desativado'} com sucesso!`
      });
      
      loadBanners();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar status do banner",
        description: error.message
      });
    }
  };

  const handleChangePosition = async (banner: Banner, direction: 'up' | 'down') => {
    const sameBanners = banners.filter(b => b.type === banner.type);
    const currentIndex = sameBanners.findIndex(b => b.id === banner.id);
    
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === sameBanners.length - 1) return;

    const newPosition = direction === 'up' ? banner.position - 1 : banner.position + 1;
    const swapBanner = sameBanners[direction === 'up' ? currentIndex - 1 : currentIndex + 1];

    try {
      const { error } = await supabase
        .from('banners')
        .update({ position: newPosition })
        .eq('id', banner.id);

      if (error) throw error;

      const { error: error2 } = await supabase
        .from('banners')
        .update({ position: banner.position })
        .eq('id', swapBanner.id);

      if (error2) throw error2;

      toast({
        title: "Posição alterada com sucesso!"
      });
      
      loadBanners();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar posição",
        description: error.message
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      hero: 'Banner Principal',
      half: 'Banner Lateral',
      full: 'Banner Completo'
    };
    return types[type] || type;
  };

  const bannersByType = {
    hero: banners.filter(b => b.type === 'hero'),
    half: banners.filter(b => b.type === 'half'),
    full: banners.filter(b => b.type === 'full')
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
            <p className="text-muted-foreground">
              Gerencie os banners da página inicial
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingBanner ? 'Editar Banner' : 'Novo Banner'}
                </DialogTitle>
                <DialogDescription>
                  {editingBanner ? 'Atualize as informações do banner' : 'Crie um novo banner para a página inicial'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Banner *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Banner Principal - Primavera"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select value={formData.type} onValueChange={(value: 'hero' | 'half' | 'full') => {
                      setFormData(prev => ({ ...prev, type: value }));
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hero">Banner Principal</SelectItem>
                        <SelectItem value="half">Banner Lateral</SelectItem>
                        <SelectItem value="full">Banner Completo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: PREVIEW"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtítulo</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="Ex: PRIMAVERA VERÃO"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="button_text">Texto do Botão</Label>
                    <Input
                      id="button_text"
                      value={formData.button_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                      placeholder="Ex: SHOP NOW"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="button_link">Link do Botão</Label>
                    <Input
                      id="button_link"
                      value={formData.button_link}
                      onChange={(e) => setFormData(prev => ({ ...prev, button_link: e.target.value }))}
                      placeholder="Ex: /produtos"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Imagem</Label>
                  <div className="flex gap-2">
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, 'image');
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={uploading}
                        className="w-full"
                      >
                        {uploading ? 'Carregando...' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video_url">Vídeo (opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="video_url"
                      value={formData.video_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                      placeholder="https://example.com/video.mp4"
                    />
                    <div className="relative">
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, 'video');
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={uploading}
                        className="w-full"
                      >
                        {uploading ? 'Carregando...' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do banner"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tips">Dicas</Label>
                  <Textarea
                    id="tips"
                    value={formData.tips}
                    onChange={(e) => setFormData(prev => ({ ...prev, tips: e.target.value }))}
                    placeholder="Dicas relacionadas ao banner"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="information">Informações</Label>
                  <Textarea
                    id="information"
                    value={formData.information}
                    onChange={(e) => setFormData(prev => ({ ...prev, information: e.target.value }))}
                    placeholder="Informações adicionais"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Posição</Label>
                    <Input
                      id="position"
                      type="number"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: parseInt(e.target.value) }))}
                      min="0"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-7">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                    />
                    <Label htmlFor="active">Banner ativo</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : (editingBanner ? 'Atualizar' : 'Criar')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hero">Banners Principais</TabsTrigger>
            <TabsTrigger value="half">Banners Laterais</TabsTrigger>
            <TabsTrigger value="full">Banners Completos</TabsTrigger>
          </TabsList>

          {Object.entries(bannersByType).map(([type, typeBanners]) => (
            <TabsContent key={type} value={type} className="space-y-4">
              <div className="grid gap-4">
                {typeBanners.map((banner) => (
                  <Card key={banner.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {banner.image_url && <Image className="h-4 w-4 text-primary" />}
                            {banner.video_url && <Video className="h-4 w-4 text-primary" />}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{banner.name}</CardTitle>
                            <CardDescription className="flex items-center space-x-2">
                              <span>{getTypeLabel(banner.type)}</span>
                              <span>•</span>
                              <span>Posição: {banner.position}</span>
                              <span>•</span>
                              <Badge variant={banner.active ? "default" : "secondary"} className="text-xs">
                                {banner.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleChangePosition(banner, 'up')}
                            disabled={banner.position === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleChangePosition(banner, 'down')}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(banner)}
                          >
                            {banner.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(banner)}
                            className="hover:bg-primary/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(banner)}
                            className="hover:bg-destructive/10 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Conteúdo</p>
                          <div className="text-sm text-muted-foreground">
                            {banner.title && <p><strong>Título:</strong> {banner.title}</p>}
                            {banner.subtitle && <p><strong>Subtítulo:</strong> {banner.subtitle}</p>}
                            {banner.button_text && <p><strong>Botão:</strong> {banner.button_text}</p>}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Mídia</p>
                          <div className="text-sm text-muted-foreground">
                            {banner.image_url && (
                              <div className="flex items-center space-x-2">
                                <Image className="h-4 w-4" />
                                <span>Imagem configurada</span>
                              </div>
                            )}
                            {banner.video_url && (
                              <div className="flex items-center space-x-2">
                                <Video className="h-4 w-4" />
                                <span>Vídeo configurado</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Preview</p>
                          {banner.image_url && (
                            <div className="w-full h-16 bg-muted rounded-lg overflow-hidden">
                              <img
                                src={banner.image_url}
                                alt={banner.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {typeBanners.length === 0 && (
                  <Card className="text-center py-8">
                    <CardContent>
                      <p className="text-muted-foreground">
                        Nenhum banner {getTypeLabel(type as 'hero' | 'half' | 'full').toLowerCase()} encontrado.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, type: type as 'hero' | 'half' | 'full' }));
                          setIsDialogOpen(true);
                        }}
                        className="mt-4"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Criar primeiro banner
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
};