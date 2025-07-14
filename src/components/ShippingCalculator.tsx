import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, Clock, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ShippingOption {
  servico: string;
  servicoNome: string;
  valor: number;
  prazoEntrega: number;
  erro?: string;
}

interface ShippingCalculatorProps {
  onShippingSelect?: (option: ShippingOption) => void;
  totalWeight?: number;
  dimensions?: {
    comprimento: number;
    altura: number;
    largura: number;
  };
}

export const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({
  onShippingSelect,
  totalWeight = 500, // peso padrão em gramas
  dimensions = { comprimento: 20, altura: 10, largura: 15 } // dimensões padrão em cm
}) => {
  const [cep, setCep] = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<ShippingOption | null>(null);
  const [endereco, setEndereco] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{1,3})/, '$1-$2');
    }
    return numbers.slice(0, 8).replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const calculateShipping = async () => {
    if (!cep || cep.length < 9) {
      toast({
        variant: "destructive",
        title: "CEP inválido",
        description: "Por favor, insira um CEP válido"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-shipping', {
        body: {
          cepDestino: cep,
          peso: totalWeight,
          comprimento: dimensions.comprimento,
          altura: dimensions.altura,
          largura: dimensions.largura
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao calcular frete');
      }

      setShippingOptions(data.opcoes);
      setEndereco(data.endereco);
      setSelectedOption(null);

      toast({
        title: "Frete calculado!",
        description: `Opções de envio para ${data.endereco.cidade}/${data.endereco.uf}`
      });

    } catch (error: any) {
      console.error('Erro ao calcular frete:', error);
      toast({
        variant: "destructive",
        title: "Erro ao calcular frete",
        description: error.message || "Tente novamente mais tarde"
      });
      setShippingOptions([]);
      setEndereco(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (option: ShippingOption) => {
    setSelectedOption(option);
    onShippingSelect?.(option);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Calcular Frete
        </CardTitle>
        <CardDescription>
          Informe seu CEP para calcular o valor e prazo de entrega
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cep">CEP de entrega</Label>
          <div className="flex gap-2">
            <Input
              id="cep"
              type="text"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => setCep(formatCep(e.target.value))}
              maxLength={9}
            />
            <Button 
              onClick={calculateShipping} 
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                'Calcular'
              )}
            </Button>
          </div>
        </div>

        {endereco && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4" />
              <span className="font-semibold">Endereço de entrega:</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {endereco.logradouro}, {endereco.bairro}<br />
              {endereco.cidade}/{endereco.uf} - {endereco.cep}
            </p>
          </div>
        )}

        {shippingOptions.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Opções de envio:</h3>
            {shippingOptions.map((option) => (
              <div
                key={option.servico}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedOption?.servico === option.servico
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSelectOption(option)}
              >
                {option.erro ? (
                  <div className="text-destructive">
                    <strong>{option.servicoNome}</strong> - {option.erro}
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {option.servicoNome}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {option.prazoEntrega} dia{option.prazoEntrega > 1 ? 's' : ''} útil{option.prazoEntrega > 1 ? 'eis' : ''}
                      </div>
                    </div>
                    <div className="text-lg font-bold">
                      R$ {option.valor.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedOption && !selectedOption.erro && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="text-sm font-semibold text-primary">
              Opção selecionada: {selectedOption.servicoNome}
            </div>
            <div className="text-sm text-muted-foreground">
              R$ {selectedOption.valor.toFixed(2).replace('.', ',')} - {selectedOption.prazoEntrega} dia{selectedOption.prazoEntrega > 1 ? 's' : ''} útil{selectedOption.prazoEntrega > 1 ? 'eis' : ''}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
          <strong>Origem:</strong> Jardim da Penha, Vitória/ES - CEP: 29060-670<br />
          <strong>Observação:</strong> Prazo de entrega em dias úteis, após postagem
        </div>
      </CardContent>
    </Card>
  );
};