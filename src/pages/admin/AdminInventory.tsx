import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Package, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useProducts } from '@/hooks/useProducts';
import { format } from 'date-fns';
import { toast } from 'sonner';

const AdminInventory = () => {
  const { movements, alerts, loading, recordMovement, resolveAlert, ignoreAlert, cleanupExpiredReservations } = useInventory();
  const { products } = useProducts();
  
  const [selectedProduct, setSelectedProduct] = useState('');
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) return;

    setSubmitting(true);
    try {
      await recordMovement(
        selectedProduct,
        movementType,
        parseInt(quantity),
        undefined, // TODO: Add variation support
        reason,
        notes
      );
      
      toast.success('Movimentação registrada com sucesso!');
      setSelectedProduct('');
      setQuantity('');
      setReason('');
      setNotes('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar movimentação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      toast.success('Alerta resolvido!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao resolver alerta');
    }
  };

  const handleIgnoreAlert = async (alertId: string) => {
    try {
      await ignoreAlert(alertId);
      toast.success('Alerta ignorado!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao ignorar alerta');
    }
  };

  const handleCleanupReservations = async () => {
    try {
      await cleanupExpiredReservations();
      toast.success('Reservas expiradas limpas!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro na limpeza');
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'out': return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'adjustment': return <Package className="w-4 h-4 text-blue-500" />;
      case 'reserved': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'released': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getMovementBadge = (type: string) => {
    const variants = {
      in: 'bg-green-100 text-green-800',
      out: 'bg-red-100 text-red-800',
      adjustment: 'bg-blue-100 text-blue-800',
      reserved: 'bg-yellow-100 text-yellow-800',
      released: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {getMovementIcon(type)}
        <span className="ml-1 capitalize">{type}</span>
      </Badge>
    );
  };

  const getAlertBadge = (type: string) => {
    const variants = {
      low_stock: 'bg-yellow-100 text-yellow-800',
      out_of_stock: 'bg-red-100 text-red-800',
      reorder_point: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const criticalAlerts = activeAlerts.filter(alert => alert.alert_type === 'out_of_stock');
  const lowStockAlerts = activeAlerts.filter(alert => alert.alert_type === 'low_stock');

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gestão de Estoque</h1>
          <Button onClick={handleCleanupReservations} variant="outline">
            Limpar Reservas Expiradas
          </Button>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Produtos sem estoque</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockAlerts.length}</div>
              <p className="text-xs text-muted-foreground">Produtos com estoque baixo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Movimentações Hoje</CardTitle>
                <Package className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {movements.filter(m => 
                  format(new Date(m.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                ).length}
              </div>
              <p className="text-xs text-muted-foreground">Movimentações registradas</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="movements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="new-movement">Nova Movimentação</TabsTrigger>
          </TabsList>

          <TabsContent value="movements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Movimentações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {movements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getMovementBadge(movement.movement_type)}
                        <div>
                          <p className="font-medium">
                            {products.find(p => p.id === movement.product_id)?.name || 'Produto não encontrado'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {movement.reason || 'Sem motivo especificado'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {movement.movement_type === 'in' || movement.movement_type === 'released' ? '+' : '-'}
                          {movement.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alertas de Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getAlertBadge(alert.alert_type)}
                        <div>
                          <p className="font-medium">
                            {alert.products?.name || 'Produto não encontrado'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Estoque atual: {alert.current_stock}
                            {alert.threshold_value && ` | Limite: ${alert.threshold_value}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          Resolver
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleIgnoreAlert(alert.id)}
                        >
                          Ignorar
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {activeAlerts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum alerta ativo no momento
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new-movement" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Nova Movimentação</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitMovement} className="space-y-4">
                  <div>
                    <Label htmlFor="product">Produto</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} (Estoque: {product.stock_quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="type">Tipo de Movimentação</Label>
                    <Select value={movementType} onValueChange={(value: 'in' | 'out' | 'adjustment') => setMovementType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">Entrada</SelectItem>
                        <SelectItem value="out">Saída</SelectItem>
                        <SelectItem value="adjustment">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Digite a quantidade"
                      min="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reason">Motivo</Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Digite o motivo da movimentação"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Digite observações adicionais"
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={submitting || !selectedProduct || !quantity}>
                    {submitting ? 'Registrando...' : 'Registrar Movimentação'}
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

export default AdminInventory;