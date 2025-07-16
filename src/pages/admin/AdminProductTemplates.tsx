import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, FileText, Ruler, Package, Heart } from 'lucide-react';
import { getEditableContent, prepareContentForSave } from '@/utils/templateUtils';
import { SizeGuideBuilder } from '@/components/admin/SizeGuideBuilder';

interface ProductDetailsTemplate {
  id: string;
  name: string;
  type: string;
  content: any;
  active: boolean;
  created_at: string;
  updated_at: string;
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
    const contentText = getEditableContent(template);
    
    setFormData({
      name: template.name,
      type: template.type,
      content: contentText,
      active: template.active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const templateData = {
        name: formData.name,
        type: formData.type,
        content: prepareContentForSave(formData.content),
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
      size_guide: 'Guia de Medidas',
      composition: 'Composição',
      care_instructions: 'Cuidados com a Peça'
    };
    return types[type] || type;
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      size_guide: Ruler,
      composition: Package,
      care_instructions: Heart
    };
    return icons[type] || FileText;
  };

  const getExampleContent = (type: string) => {
    const examples: { [key: string]: string } = {
      size_guide: `P - Busto: 84-88cm, Cintura: 64-68cm, Quadril: 90-94cm
M - Busto: 88-92cm, Cintura: 68-72cm, Quadril: 94-98cm
G - Busto: 92-96cm, Cintura: 72-76cm, Quadril: 98-102cm
GG - Busto: 96-100cm, Cintura: 76-80cm, Quadril: 102-106cm

Como tirar suas medidas:
• Busto: Meça na parte mais larga do busto
• Cintura: Meça na parte mais fina da cintura
• Quadril: Meça na parte mais larga do quadril

Dica: Use uma fita métrica e mantenha o corpo relaxado durante as medições.`,
      composition: `95% Algodão
5% Elastano

Tecido: Jersey
Peso: 180g/m²
Origem: Brasil

Características:
• Tecido macio e confortável
• Boa elasticidade
• Respirável
• Fácil de cuidar`,
      care_instructions: `• Lavar à máquina em água fria (até 30°C)
• Não usar alvejante
• Secar à sombra
• Passar com ferro morno
• Não usar secadora
• Lavar com cores similares

Dicas importantes:
• Vire a peça do avesso antes de lavar
• Não torça a peça ao escorrer
• Evite exposição direta ao sol
• Guarde em local seco e arejado`
    };
    return examples[type] || '';
  };

  const templatesByType = {
    size_guide: templates.filter(t => t.type === 'size_guide'),
    composition: templates.filter(t => t.type === 'composition'),
    care_instructions: templates.filter(t => t.type === 'care_instructions')
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalhes dos Produtos</h1>
            <p className="text-muted-foreground">
              Configure templates para Guia de Medidas, Composição e Cuidados com a Peça
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
                      placeholder="Ex: Guia de Medidas - Vestidos"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select value={formData.type} onValueChange={(value) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        type: value,
                        content: getExampleContent(value)
                      }));
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="size_guide">Guia de Medidas</SelectItem>
                        <SelectItem value="composition">Composição</SelectItem>
                        <SelectItem value="care_instructions">Cuidados com a Peça</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo *</Label>
                  {formData.type === 'size_guide' ? (
                    <SizeGuideBuilder
                      initialContent={formData.content}
                      onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                    />
                  ) : (
                    <>
                      <RichTextEditor
                        content={formData.content}
                        onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                        placeholder="Digite o conteúdo do template..."
                        className="min-h-[200px]"
                      />
                      <p className="text-sm text-muted-foreground">
                        Use as ferramentas de formatação para criar conteúdo rico com negrito, itálico, listas e títulos
                      </p>
                    </>
                  )}
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

        {/* Seção de Visão Geral */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Visão Geral dos Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Object.entries(templatesByType).map(([type, typeTemplates]) => {
              const Icon = getTypeIcon(type);
              const activeCount = typeTemplates.filter(t => t.active).length;
              const totalCount = typeTemplates.length;
              
              return (
                <Card key={type} className="hover:shadow-lg transition-shadow border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{getTypeLabel(type)}</CardTitle>
                          <CardDescription className="text-sm">
                            {activeCount} ativo{activeCount !== 1 ? 's' : ''} de {totalCount} template{totalCount !== 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={activeCount > 0 ? "default" : "secondary"} className="text-xs">
                        {activeCount > 0 ? 'Configurado' : 'Não configurado'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setFormData({
                            name: '',
                            type: type,
                            content: getExampleContent(type),
                            active: true
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Novo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Seção de Templates Detalhados */}
        <div className="border-t pt-8">
          <Tabs defaultValue="size_guide" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Gerenciar Templates</h2>
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="size_guide" className="flex items-center space-x-2 text-xs">
                  <Ruler className="h-3 w-3" />
                  <span className="hidden sm:inline">Medidas</span>
                </TabsTrigger>
                <TabsTrigger value="composition" className="flex items-center space-x-2 text-xs">
                  <Package className="h-3 w-3" />
                  <span className="hidden sm:inline">Composição</span>
                </TabsTrigger>
                <TabsTrigger value="care_instructions" className="flex items-center space-x-2 text-xs">
                  <Heart className="h-3 w-3" />
                  <span className="hidden sm:inline">Cuidados</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {Object.entries(templatesByType).map(([type, typeTemplates]) => (
              <TabsContent key={type} value={type} className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3 mb-2">
                    {React.createElement(getTypeIcon(type), { className: "h-5 w-5 text-primary" })}
                    <h3 className="font-semibold text-lg">{getTypeLabel(type)}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {type === 'size_guide' && 'Configure guias de medidas para diferentes tipos de produtos (vestidos, camisas, calças, etc.)'}
                    {type === 'composition' && 'Defina informações sobre tecidos, materiais e características dos produtos'}
                    {type === 'care_instructions' && 'Crie instruções de cuidados e conservação para diferentes tipos de peças'}
                  </p>
                </div>

                <div className="grid gap-4">
                  {typeTemplates.map((template) => {
                    const Icon = getTypeIcon(template.type);
                    return (
                      <Card key={template.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Icon className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                <CardDescription className="flex items-center space-x-2">
                                  <span>{getTypeLabel(template.type)}</span>
                                  <span>•</span>
                                  <Badge variant={template.active ? "default" : "secondary"} className="text-xs">
                                    {template.active ? 'Ativo' : 'Inativo'}
                                  </Badge>
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(template)}
                                className="hover:bg-primary/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(template)}
                                className="hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm">
                            <div className="p-4 bg-muted/50 rounded-lg prose prose-sm max-w-none border">
                              <div 
                                dangerouslySetInnerHTML={{
                                  __html: typeof template.content === 'string' 
                                    ? template.content 
                                    : template.content?.html || template.content?.text || JSON.stringify(template.content, null, 2)
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {typeTemplates.length === 0 && (
                    <Card className="border-dashed border-2">
                      <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                          <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                            {React.createElement(getTypeIcon(type), { className: "h-12 w-12 opacity-50" })}
                          </div>
                          <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
                          <p className="text-sm mb-2">Você ainda não criou nenhum template de {getTypeLabel(type).toLowerCase()}</p>
                          <p className="text-xs text-muted-foreground/80 mb-6">
                            Clique no botão abaixo para criar seu primeiro template
                          </p>
                          <Button
                            onClick={() => {
                              setFormData({
                                name: '',
                                type: type,
                                content: getExampleContent(type),
                                active: true
                              });
                              setIsDialogOpen(true);
                            }}
                            className="animate-pulse"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Primeiro Template de {getTypeLabel(type)}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};