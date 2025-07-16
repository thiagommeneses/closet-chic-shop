import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Users, Eye } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes da sua loja
          </p>
        </div>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">{customers.length} clientes</p>
              <p className="text-xs text-muted-foreground">Total cadastrados</p>
            </div>
          </div>
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
                    {customer.name}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.cpf}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {customer.order_count} pedidos
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(customer.total_spent || 0)}
                  </TableCell>
                  <TableCell>{formatDate(customer.created_at)}</TableCell>
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
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Cliente</DialogTitle>
                        </DialogHeader>
                        {selectedCustomer && (
                          <div className="space-y-6">
                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h3 className="font-semibold mb-2">Informações Pessoais</h3>
                                <div className="space-y-2 text-sm">
                                  <p><strong>Nome:</strong> {selectedCustomer.name}</p>
                                  <p><strong>E-mail:</strong> {selectedCustomer.email}</p>
                                  <p><strong>Telefone:</strong> {selectedCustomer.phone}</p>
                                  <p><strong>CPF:</strong> {selectedCustomer.cpf}</p>
                                  <p><strong>Cadastro:</strong> {formatDate(selectedCustomer.created_at)}</p>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-semibold mb-2">Estatísticas</h3>
                                <div className="space-y-2 text-sm">
                                  <p><strong>Total de Pedidos:</strong> {selectedCustomer.order_count}</p>
                                  <p><strong>Valor Total Gasto:</strong> {formatPrice(selectedCustomer.total_spent || 0)}</p>
                                  <p><strong>Ticket Médio:</strong> {
                                    selectedCustomer.order_count ? 
                                    formatPrice((selectedCustomer.total_spent || 0) / selectedCustomer.order_count) : 
                                    formatPrice(0)
                                  }</p>
                                </div>
                              </div>
                            </div>

                            {/* Orders History */}
                            <div>
                              <h3 className="font-semibold mb-4">Histórico de Pedidos</h3>
                              {customerOrders.length > 0 ? (
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
                                          {order.id.slice(0, 8)}
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
                              ) : (
                                <p className="text-muted-foreground text-center py-4">
                                  Nenhum pedido encontrado
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum cliente encontrado para a busca.' : 'Nenhum cliente cadastrado ainda.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};