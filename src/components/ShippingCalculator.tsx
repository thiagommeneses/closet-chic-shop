import { useState } from 'react';
import { Truck, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import InputMask from 'react-input-mask';

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  days: string;
  description: string;
}

export const ShippingCalculator = () => {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [error, setError] = useState('');

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateShipping = async () => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      setError('CEP inválido. Digite um CEP válido.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call - In real implementation, integrate with Correios API or shipping service
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock shipping options
      const mockOptions: ShippingOption[] = [
        {
          id: 'sedex',
          name: 'SEDEX',
          price: 24.90,
          days: '1-2',
          description: 'Entrega rápida'
        },
        {
          id: 'pac',
          name: 'PAC',
          price: 15.90,
          days: '3-5',
          description: 'Entrega econômica'
        },
        {
          id: 'express',
          name: 'Entrega Expressa',
          price: 39.90,
          days: '1',
          description: 'Entrega no mesmo dia (regiões selecionadas)'
        }
      ];

      setShippingOptions(mockOptions);
    } catch (err) {
      setError('Erro ao calcular frete. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Truck className="h-4 w-4 text-primary" />
        Calcular Frete e Prazo
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <InputMask
            mask="99999-999"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            disabled={loading}
          >
            {(inputProps: any) => (
              <Input
                {...inputProps}
                placeholder="Digite seu CEP"
                className="text-sm"
              />
            )}
          </InputMask>
        </div>
        <Button
          onClick={calculateShipping}
          disabled={loading || !cep}
          size="sm"
          variant="minimal"
        >
          {loading ? (
            <Calculator className="h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {shippingOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Opções de entrega:</p>
          {shippingOptions.map((option) => (
            <div
              key={option.id}
              className="flex justify-between items-center p-2 border border-border rounded text-sm hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div>
                <span className="font-medium">{option.name}</span>
                <span className="text-muted-foreground ml-2">
                  {option.days} dia{option.days !== '1' ? 's' : ''} útil{option.days !== '1' ? 'is' : ''}
                </span>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </div>
              <span className="font-semibold text-primary">
                {option.price === 0 ? 'GRÁTIS' : formatPrice(option.price)}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <strong>Frete grátis</strong> para compras acima de R$ 199,00
      </p>
    </Card>
  );
};