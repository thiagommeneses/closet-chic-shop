import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get total products
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        // Get total orders
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        // Get pending orders
        const { count: pendingOrdersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Get total revenue
        const { data: revenueData } = await supabase
          .from('orders')
          .select('total')
          .eq('payment_status', 'paid');

        const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

        setStats({
          totalProducts: productsCount || 0,
          totalOrders: ordersCount || 0,
          pendingOrders: pendingOrdersCount || 0,
          totalRevenue
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, []);

  const statsCards = [
    {
      title: 'Total de Produtos',
      value: stats.totalProducts,
      description: 'Produtos cadastrados',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Total de Pedidos',
      value: stats.totalOrders,
      description: 'Pedidos realizados',
      icon: ShoppingCart,
      color: 'text-green-600'
    },
    {
      title: 'Pedidos Pendentes',
      value: stats.pendingOrders,
      description: 'Aguardando processamento',
      icon: Users,
      color: 'text-yellow-600'
    },
    {
      title: 'Receita Total',
      value: `R$ ${stats.totalRevenue.toFixed(2)}`,
      description: 'Vendas confirmadas',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu e-commerce
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesse as funcionalidades mais utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/admin/products/new"
                className="block w-full text-left p-2 rounded hover:bg-accent transition-colors"
              >
                → Adicionar novo produto
              </a>
              <a
                href="/admin/orders"
                className="block w-full text-left p-2 rounded hover:bg-accent transition-colors"
              >
                → Ver pedidos pendentes
              </a>
              <a
                href="/admin/settings"
                className="block w-full text-left p-2 rounded hover:bg-accent transition-colors"
              >
                → Configurar integrações
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
              <CardDescription>
                Informações sobre o funcionamento da loja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Loja Online</span>
                <span className="text-green-600">✓ Ativa</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Produtos Ativos</span>
                <span className="text-green-600">{stats.totalProducts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Últimas 24h</span>
                <span className="text-muted-foreground">0 vendas</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};