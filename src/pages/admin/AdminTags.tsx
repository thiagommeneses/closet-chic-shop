import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Tag, Palette } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface TagFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
  active: boolean;
}

const COLOR_PRESETS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6b7280'
];

export const AdminTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
    active: true,
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar tags",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && { slug: generateSlug(value as string) })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const tagData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        color: formData.color,
        active: formData.active,
      };

      if (editingTag) {
        const { error } = await supabase
          .from('tags')
          .update(tagData)
          .eq('id', editingTag.id);

        if (error) throw error;
        toast({ title: "Tag atualizada com sucesso!" });
      } else {
        const { error } = await supabase
          .from('tags')
          .insert([tagData]);

        if (error) throw error;
        toast({ title: "Tag criada com sucesso!" });
      }

      setDialogOpen(false);
      setEditingTag(null);
      setFormData({ name: '', slug: '', description: '', color: '#3b82f6', active: true });
      loadTags();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar tag",
        description: error.message
      });
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      slug: tag.slug,
      description: tag.description || '',
      color: tag.color,
      active: tag.active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTags(tags.filter(t => t.id !== id));
      toast({ title: "Tag excluída com sucesso!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir tag",
        description: error.message
      });
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;
      
      setTags(tags.map(t => 
        t.id === id ? { ...t, active: !active } : t
      ));
      
      toast({ title: `Tag ${!active ? 'ativada' : 'desativada'} com sucesso!` });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar tag",
        description: error.message
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', color: '#3b82f6', active: true });
    setEditingTag(null);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse">Carregando tags...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
            <p className="text-muted-foreground">
              Gerencie as tags dos produtos
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Tag
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTag ? 'Editar Tag' : 'Nova Tag'}
                </DialogTitle>
                <DialogDescription>
                  {editingTag 
                    ? 'Edite as informações da tag'
                    : 'Crie uma nova tag para organizar os produtos'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Promoção"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="promocao"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descrição da tag"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleInputChange('color', color)}
                        className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-400"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => handleInputChange('active', checked)}
                  />
                  <Label htmlFor="active">Ativa</Label>
                </div>

                <DialogFooter>
                  <Button type="submit">
                    {editingTag ? 'Atualizar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {tags.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma tag encontrada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece criando sua primeira tag
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Tag
                </Button>
              </CardContent>
            </Card>
          ) : (
            tags.map((tag) => (
              <Card key={tag.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-16 h-16 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${tag.color}20` }}
                      >
                        <Tag className="h-6 w-6" style={{ color: tag.color }} />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{tag.name}</h3>
                          <Badge 
                            variant="secondary" 
                            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                          >
                            {tag.slug}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">/{tag.slug}</p>
                        {tag.description && (
                          <p className="text-sm text-muted-foreground max-w-md">
                            {tag.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={tag.active}
                        onCheckedChange={() => toggleActive(tag.id, tag.active)}
                      />
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tag)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir tag</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir "{tag.name}"? 
                              Esta ação não pode ser desfeita e removerá a tag do menu.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(tag.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};