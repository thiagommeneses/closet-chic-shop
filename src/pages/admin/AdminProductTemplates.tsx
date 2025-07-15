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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';

interface ProductDetailsTemplate {
  id: string;
  name: string;
  type: string;
  content: any;
  active: boolean;
  created_at: string;
}

interface TemplateFormData {
  name: string;
  type: string;
  content: string;
  active: boolean;
}

export const AdminProductTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ProductDetailsTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProductDetailsTemplate | null>(null);
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    type: 'size_guide',
    content: '',
    active: true
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('product_details_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar templates",
        description: error.message
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'size_guide',
      content: '',
      active: true
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: ProductDetailsTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      content: typeof template.content === 'string' ? template.content : JSON.stringify(template.content, null, 2),
      active: template.active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let content: any;
      try {
        // Try to parse as JSON first
        content = JSON.parse(formData.content);
      } catch {
        // If JSON parsing fails, store as plain text
        content = formData.content;
      }

      const templateData = {
        name: formData.name,
        type: formData.type,
        content: content,
        active: formData.active
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('product_details_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        
        toast({
          title: "Template atualizado com sucesso!"
        });
      } else {
        const { error } = await supabase
          .from('product_details_templates')
          .insert([templateData]);

        if (error) throw error;
        
        toast({
          title: "Template criado com sucesso!"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadTemplates();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: `Erro ao ${editingTemplate ? 'atualizar' : 'criar'} template`,
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: ProductDetailsTemplate) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const { error } = await supabase
        .from('product_details_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;
      
      toast({
        title: "Template excluído com sucesso!"
      });
      
      loadTemplates();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir template",
        description: error.message
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      size_guide: 'Guia de Tamanhos',
      composition: 'Composição',
      care_instructions: 'Cuidados',
      shipping: 'Envio',
      warranty: 'Garantia'
    };
    return types[type] || type;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Templates de Detalhes</h1>
            <p className="text-muted-foreground">
              Gerencie templates reutilizáveis para detalhes de produtos
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Editar Template' : 'Novo Template'}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplate ? 'Atualize as informações do template' : 'Crie um novo template para detalhes de produtos'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Template *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Guia de Tamanhos Vestidos"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="size_guide">Guia de Tamanhos</SelectItem>
                        <SelectItem value="composition">Composição</SelectItem>
                        <SelectItem value="care_instructions">Cuidados</SelectItem>
                        <SelectItem value="shipping">Envio</SelectItem>
                        <SelectItem value="warranty">Garantia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Digite o conteúdo do template (texto ou JSON)..."
                    rows={10}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Você pode usar texto simples ou JSON para conteúdo estruturado
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    />
                    <Label htmlFor="active">Template ativo</Label>
                  </div>

                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Salvando...' : (editingTemplate ? 'Atualizar' : 'Criar')}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>
                        {getTypeLabel(template.type)} • {template.active ? 'Ativo' : 'Inativo'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={template.active ? "default" : "secondary"}>
                      {template.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <strong>Conteúdo:</strong>
                  <div className="mt-1 p-3 bg-muted rounded-md max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-xs">
                      {typeof template.content === 'string' 
                        ? template.content 
                        : JSON.stringify(template.content, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {templates.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum template encontrado</p>
                  <p className="text-sm">Clique em "Novo Template" para criar o primeiro template</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};