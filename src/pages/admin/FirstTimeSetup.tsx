import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Store, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const FirstTimeSetup = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  console.log('FirstTimeSetup rendered');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Calling create-first-admin function...');
      const { data, error } = await supabase.functions.invoke('create-first-admin', {
        body: { email, password }
      });

      console.log('create-first-admin response:', { data, error });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      if (data.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      toast({
        title: "Sucesso!",
        description: "Primeiro administrador criado com sucesso. Faça login para continuar."
      });

      // Force a page reload to refresh the admin context
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao criar administrador"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Store className="h-10 w-10 text-primary" />
              <Shield className="h-6 w-6 text-primary absolute -top-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
          <CardDescription>
            Crie o primeiro administrador para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Administrador</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@closetcollection.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Criando..." : "Criar Administrador"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};