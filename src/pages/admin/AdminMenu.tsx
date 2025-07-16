import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: string;
  name: string;
  link?: string;
  position: number;
  active: boolean;
  is_category: boolean;
  category_id?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    link: '',
    active: true
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar itens do menu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: formData.name,
            link: formData.link || null,
            active: formData.active
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Item do menu atualizado com sucesso!"
        });
      } else {
        // Create new item
        const maxPosition = Math.max(...menuItems.map(item => item.position), 0);
        
        const { error } = await supabase
          .from('menu_items')
          .insert({
            name: formData.name,
            link: formData.link || null,
            position: maxPosition + 1,
            active: formData.active,
            is_category: false
          });

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Item do menu criado com sucesso!"
        });
      }

      fetchMenuItems();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar item do menu",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item do menu?')) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item do menu excluído com sucesso!"
      });
      
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir item do menu",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ active })
        .eq('id', id);

      if (error) throw error;
      
      fetchMenuItems();
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar item do menu",
        variant: "destructive"
      });
    }
  };

  const updatePosition = async (id: string, newPosition: number) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ position: newPosition })
        .eq('id', id);

      if (error) throw error;
      fetchMenuItems();
    } catch (error) {
      console.error('Error updating position:', error);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= menuItems.length) return;

    const item1 = menuItems[index];
    const item2 = menuItems[newIndex];

    updatePosition(item1.id, item2.position);
    updatePosition(item2.id, item1.position);
  };

  const resetForm = () => {
    setFormData({ name: '', link: '', active: true });
    setEditingItem(null);
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      link: item.link || '',
      active: item.active
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Menu de Navegação</h1>
            <p className="text-muted-foreground">
              Gerencie os links do menu principal do site
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Editar Item do Menu' : 'Novo Item do Menu'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="link">Link (opcional)</Label>
                  <Input
                    id="link"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="/categoria/vestidos"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Ativo</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingItem ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Itens do Menu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {menuItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        ▲
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === menuItems.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        ▼
                      </Button>
                    </div>
                    
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.is_category && (
                          <Badge variant="secondary">Categoria</Badge>
                        )}
                        {!item.active && (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </div>
                      {item.link && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ExternalLink className="h-3 w-3" />
                          {item.link}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.active}
                      onCheckedChange={(checked) => toggleActive(item.id, checked)}
                    />
                    
                    {!item.is_category && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}