import { useState, useMemo, useRef } from 'react';
import { CreditCard, Lock, User, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { ShippingCalculator } from './ShippingCalculator';
import { PaymentResult } from './PaymentResult';
import { RecaptchaComponent, RecaptchaRef } from './RecaptchaComponent';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import InputMask from 'react-input-mask';

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
}

interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface PaymentData {
  method: 'credit_card' | 'boleto' | 'pix';
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCvv?: string;
  installments?: number;
}

interface ShippingOption {
  servico: string;
  servicoNome: string;
  valor: number;
  prazoEntrega: number;
  erro?: string;
}

export const CheckoutForm = () => {
  const { state, totalPrice } = useCart();
  const recaptchaRef = useRef<RecaptchaRef>(null);
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    phone: '',
    cpf: ''
  });
  const [addressData, setAddressData] = useState<AddressData>({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });
  const [paymentData, setPaymentData] = useState<PaymentData>({
    method: 'credit_card',
    installments: 1
  });
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  // Calcular peso total e dimensões médias dos produtos no carrinho
  const cartData = useMemo(() => {
    const totalWeight = state.items.reduce((total, item) => {
      // Peso padrão por produto (500g), multiplicado pela quantidade
      const weight = 500; // Valor padrão até termos peso nos produtos
      return total + (weight * item.quantity);
    }, 0);

    // Dimensões médias baseadas nos produtos (valores padrão)
    const avgDimensions = {
      comprimento: 25,
      altura: 10,
      largura: 20
    };

    return {
      totalWeight,
      dimensions: avgDimensions
    };
  }, [state.items]);

  // Calcular total com frete
  const totalWithShipping = useMemo(() => {
    const shipping = selectedShipping ? selectedShipping.valor : 0;
    return totalPrice + shipping;
  }, [totalPrice, selectedShipping]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!customerData.name || !customerData.email || !customerData.phone || !customerData.cpf) {
      toast({
        title: 'Dados pessoais incompletos',
        description: 'Por favor, preencha todos os dados pessoais.',
        variant: 'destructive',
      });
      return;
    }

    if (!addressData.cep || !addressData.street || !addressData.number || !addressData.neighborhood || !addressData.city || !addressData.state) {
      toast({
        title: 'Endereço incompleto',
        description: 'Por favor, preencha todos os dados de endereço.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedShipping) {
      toast({
        title: 'Frete obrigatório',
        description: 'Por favor, calcule o frete antes de finalizar a compra.',
        variant: 'destructive',
      });
      return;
    }

    if (paymentData.method === 'credit_card' && (!paymentData.cardNumber || !paymentData.cardName || !paymentData.cardExpiry || !paymentData.cardCvv)) {
      toast({
        title: 'Dados do cartão incompletos',
        description: 'Por favor, preencha todos os dados do cartão.',
        variant: 'destructive',
      });
      return;
    }

    if (!recaptchaToken) {
      toast({
        title: 'Verificação de segurança obrigatória',
        description: 'Por favor, complete a verificação reCAPTCHA.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          customerData,
          addressData,
          paymentData,
          cartItems: state.items,
          shippingCost: selectedShipping.valor,
          totalAmount: totalWithShipping
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Erro na comunicação com o servidor');
      }

      // Check if the response indicates an error
      if (data?.error) {
        throw new Error(data.message || 'Erro no processamento do pagamento');
      }

      if (data?.success) {
        setPaymentResult(data);
        toast({
          title: 'Pedido criado com sucesso!',
          description: `Pedido #${data.order_id.slice(0, 8)} foi processado.`,
        });
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Parse error response if it's from the API
      let errorMessage = 'Não foi possível processar seu pagamento. Tente novamente.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Reset recaptcha on error
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
      
      toast({
        title: 'Erro no pagamento',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInstallmentOptions = () => {
    const maxInstallments = Math.min(12, Math.floor(totalWithShipping / 20)); // Min R$20 per installment
    const options = [];
    
    for (let i = 1; i <= maxInstallments; i++) {
      const installmentValue = totalWithShipping / i;
      const label = i === 1 
        ? `À vista - ${formatPrice(totalWithShipping)}`
        : `${i}x de ${formatPrice(installmentValue)} ${i <= 3 ? 'sem juros' : 'com juros'}`;
      
      options.push({ value: i, label });
    }
    
    return options;
  };

  if (state.items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Seu carrinho está vazio.</p>
      </div>
    );
  }

  return (
    <>
      {paymentResult && (
        <PaymentResult 
          result={paymentResult} 
          onClose={() => setPaymentResult(null)} 
        />
      )}
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-muted-foreground text-sm">Qtd: {item.quantity}</p>
                    <p className="text-primary font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>
                    {selectedShipping 
                      ? formatPrice(selectedShipping.valor) 
                      : 'A calcular'
                    }
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(totalWithShipping)}</span>
                </div>
              </div>

              <ShippingCalculator 
                onShippingSelect={setSelectedShipping}
                totalWeight={cartData.totalWeight}
                dimensions={cartData.dimensions}
                cartTotal={totalPrice}
              />
            </CardContent>
          </Card>
        </div>

        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    required
                    value={customerData.name}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={customerData.email}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <InputMask
                    mask="(99) 99999-9999"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                  >
                    {(inputProps: any) => <Input {...inputProps} id="phone" required />}
                  </InputMask>
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <InputMask
                    mask="999.999.999-99"
                    value={customerData.cpf}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, cpf: e.target.value }))}
                  >
                    {(inputProps: any) => <Input {...inputProps} id="cpf" required />}
                  </InputMask>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <InputMask
                    mask="99999-999"
                    value={addressData.cep}
                    onChange={(e) => setAddressData(prev => ({ ...prev, cep: e.target.value }))}
                  >
                    {(inputProps: any) => <Input {...inputProps} id="cep" required />}
                  </InputMask>
                </div>
                <div>
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    required
                    value={addressData.street}
                    onChange={(e) => setAddressData(prev => ({ ...prev, street: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    required
                    value={addressData.number}
                    onChange={(e) => setAddressData(prev => ({ ...prev, number: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={addressData.complement}
                    onChange={(e) => setAddressData(prev => ({ ...prev, complement: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    required
                    value={addressData.neighborhood}
                    onChange={(e) => setAddressData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    required
                    value={addressData.city}
                    onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Select required value={addressData.state} onValueChange={(value) => setAddressData(prev => ({ ...prev, state: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AC">Acre</SelectItem>
                      <SelectItem value="AL">Alagoas</SelectItem>
                      <SelectItem value="AP">Amapá</SelectItem>
                      <SelectItem value="AM">Amazonas</SelectItem>
                      <SelectItem value="BA">Bahia</SelectItem>
                      <SelectItem value="CE">Ceará</SelectItem>
                      <SelectItem value="DF">Distrito Federal</SelectItem>
                      <SelectItem value="ES">Espírito Santo</SelectItem>
                      <SelectItem value="GO">Goiás</SelectItem>
                      <SelectItem value="MA">Maranhão</SelectItem>
                      <SelectItem value="MT">Mato Grosso</SelectItem>
                      <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      <SelectItem value="PA">Pará</SelectItem>
                      <SelectItem value="PB">Paraíba</SelectItem>
                      <SelectItem value="PR">Paraná</SelectItem>
                      <SelectItem value="PE">Pernambuco</SelectItem>
                      <SelectItem value="PI">Piauí</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                      <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                      <SelectItem value="RO">Rondônia</SelectItem>
                      <SelectItem value="RR">Roraima</SelectItem>
                      <SelectItem value="SC">Santa Catarina</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="SE">Sergipe</SelectItem>
                      <SelectItem value="TO">Tocantins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={paymentData.method} onValueChange={(value) => setPaymentData(prev => ({ ...prev, method: value as any }))}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="credit_card">Cartão de Crédito</TabsTrigger>
                    <TabsTrigger value="pix">PIX</TabsTrigger>
                    <TabsTrigger value="boleto">Boleto</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="credit_card" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="cardNumber">Número do Cartão</Label>
                        <InputMask
                          mask="9999 9999 9999 9999"
                          value={paymentData.cardNumber || ''}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: e.target.value }))}
                        >
                          {(inputProps: any) => <Input {...inputProps} id="cardNumber" required />}
                        </InputMask>
                      </div>
                      <div>
                        <Label htmlFor="cardName">Nome no Cartão</Label>
                        <Input
                          id="cardName"
                          required
                          value={paymentData.cardName || ''}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, cardName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardExpiry">Validade</Label>
                        <InputMask
                          mask="99/99"
                          value={paymentData.cardExpiry || ''}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, cardExpiry: e.target.value }))}
                        >
                          {(inputProps: any) => <Input {...inputProps} id="cardExpiry" required />}
                        </InputMask>
                      </div>
                      <div>
                        <Label htmlFor="cardCvv">CVV</Label>
                        <Input
                          id="cardCvv"
                          maxLength={4}
                          required
                          value={paymentData.cardCvv || ''}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, cardCvv: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="installments">Parcelas</Label>
                        <Select onValueChange={(value) => setPaymentData(prev => ({ ...prev, installments: parseInt(value) }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione as parcelas" />
                          </SelectTrigger>
                          <SelectContent>
                            {generateInstallmentOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="pix" className="text-center py-6">
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Pagamento via PIX</h3>
                        <p className="text-sm text-muted-foreground">
                          Após confirmar o pedido, você receberá um QR Code para pagamento via PIX.
                          O pagamento é processado instantaneamente.
                        </p>
                      </div>
                      <p className="text-sm">
                        <strong>Valor:</strong> {formatPrice(totalWithShipping)}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="boleto" className="text-center py-6">
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Pagamento via Boleto</h3>
                        <p className="text-sm text-muted-foreground">
                          Após confirmar o pedido, você receberá um boleto bancário.
                          O prazo de vencimento é de 3 dias úteis.
                        </p>
                      </div>
                      <p className="text-sm">
                        <strong>Valor:</strong> {formatPrice(totalWithShipping)}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* reCAPTCHA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Verificação de Segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecaptchaComponent
                  ref={recaptchaRef}
                  onVerify={setRecaptchaToken}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Complete a verificação acima para prosseguir com a compra
                </p>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              Seus dados estão protegidos por criptografia SSL
            </div>

            <Button
              type="submit"
              size="lg"
              variant="elegant"
              className="w-full"
              disabled={isProcessing || !recaptchaToken}
            >
              {isProcessing ? (
                <>
                  <Calendar className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                `Finalizar Compra - ${formatPrice(totalWithShipping)}`
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};