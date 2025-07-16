import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Users, Eye, Mail, Phone, Calendar, DollarSign, Package, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  created_at: string;
  order_count?: number;
  total_spent?: number;
}

export const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.cpf.includes(searchTerm)
    );
    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          orders!customer_id(id, total, status, created_at)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const customersWithStats = data.map(customer => ({
        ...customer,
        order_count: customer.orders?.length || 0,
        total_spent: customer.orders?.reduce((total: number, order: any) => 
          total + (parseFloat(order.total) || 0), 0) || 0
      }));

      setCustomers(customersWithStats);
    } catch (error: any) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Erro ao carregar clientes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerOrders = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (error: any) {
      console.error('Error loading customer orders:', error);
      toast({
        title: 'Erro ao carregar pedidos',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: 'Pendente', variant: 'secondary' },
      confirmed: { label: 'Confirmado', variant: 'default' },
      processing: { label: 'Processando', variant: 'secondary' },
      shipped: { label: 'Enviado', variant: 'default' },
      delivered: { label: 'Entregue', variant: 'secondary' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
      refunded: { label: 'Reembolsado', variant: 'secondary' }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando clientes...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = customers.reduce((sum, customer) => sum + (customer.total_spent || 0), 0);
  const averageOrderValue = customers.length > 0 ? totalRevenue / customers.reduce((sum, customer) => sum + (customer.order_count || 0), 0) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie os clientes da sua loja
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Clientes</p>
                  <p className="text-2xl font-bold">{customers.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
                  <p className="text-2xl font-bold">{customers.reduce((sum, customer) => sum + (customer.order_count || 0), 0)}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold">{formatPrice(averageOrderValue || 0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Total Gasto</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          {customer.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {customer.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {customer.phone || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{customer.cpf || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {customer.order_count} pedidos
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(customer.total_spent || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(customer.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                loadCustomerOrders(customer.id);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                  {selectedCustomer?.name.charAt(0).toUpperCase()}
                                </div>
                                Detalhes do Cliente - {selectedCustomer?.name}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedCustomer && (
                              <div className="space-y-6">
                                {/* Customer Info Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium">{selectedCustomer.name}</p>
                                          <p className="text-sm text-muted-foreground">Nome completo</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium">{selectedCustomer.email}</p>
                                          <p className="text-sm text-muted-foreground">E-mail</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium">{selectedCustomer.phone || 'Não informado'}</p>
                                          <p className="text-sm text-muted-foreground">Telefone</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="h-4 w-4 text-muted-foreground flex items-center justify-center">📄</div>
                                        <div>
                                          <p className="font-medium font-mono">{selectedCustomer.cpf || 'Não informado'}</p>
                                          <p className="text-sm text-muted-foreground">CPF</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium">{formatDate(selectedCustomer.created_at)}</p>
                                          <p className="text-sm text-muted-foreground">Data de cadastro</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">Estatísticas</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium">{selectedCustomer.order_count} pedidos</p>
                                          <p className="text-sm text-muted-foreground">Total de pedidos</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium">{formatPrice(selectedCustomer.total_spent || 0)}</p>
                                          <p className="text-sm text-muted-foreground">Valor total gasto</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium">{
                                            selectedCustomer.order_count ? 
                                            formatPrice((selectedCustomer.total_spent || 0) / selectedCustomer.order_count) : 
                                            formatPrice(0)
                                          }</p>
                                          <p className="text-sm text-muted-foreground">Ticket médio</p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Orders History */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Histórico de Pedidos</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {customerOrders.length > 0 ? (
                                      <div className="overflow-x-auto">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Pedido</TableHead>
                                              <TableHead>Data</TableHead>
                                              <TableHead>Status</TableHead>
                                              <TableHead>Valor</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {customerOrders.map((order) => (
                                              <TableRow key={order.id}>
                                                <TableCell className="font-mono">
                                                  #{order.id.slice(0, 8)}
                                                </TableCell>
                                                <TableCell>{formatDate(order.created_at)}</TableCell>
                                                <TableCell>{getStatusBadge(order.status)}</TableCell>
                                                <TableCell className="font-medium">
                                                  {formatPrice(parseFloat(order.total))}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    ) : (
                                      <div className="text-center py-8">
                                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">
                                          Nenhum pedido encontrado para este cliente
                                        </p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhum cliente encontrado para a busca.' : 'Nenhum cliente cadastrado ainda.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};