import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface PaymentResultProps {
  result: {
    success: boolean;
    transaction_id: string;
    order_id: string;
    status: string;
    amount: number;
    boleto?: {
      url: string;
      barcode: string;
      expires_at: string;
    };
    pix?: {
      qr_code: string;
      qr_code_url: string;
    };
  };
  onClose: () => void;
}

export const PaymentResult = ({ result, onClose }: PaymentResultProps) => {
  const [copied, setCopied] = useState(false);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleCopyPixCode = () => {
    if (result.pix?.qr_code) {
      navigator.clipboard.writeText(result.pix.qr_code);
      setCopied(true);
      toast({
        title: 'Código PIX copiado!',
        description: 'Cole no seu app bancário para fazer o pagamento.',
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCopyBarcode = () => {
    if (result.boleto?.barcode) {
      navigator.clipboard.writeText(result.boleto.barcode);
      setCopied(true);
      toast({
        title: 'Código de barras copiado!',
        description: 'Use este código para pagar o boleto.',
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const getStatusInfo = () => {
    switch (result.status) {
      case 'paid':
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: 'Pagamento Aprovado!',
          message: 'Seu pedido foi confirmado e será processado em breve.',
          color: 'text-green-600'
        };
      case 'pending':
        return {
          icon: <Clock className="h-12 w-12 text-yellow-500" />,
          title: 'Pagamento Pendente',
          message: 'Aguardando confirmação do pagamento.',
          color: 'text-yellow-600'
        };
      case 'failed':
      case 'refused':
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: 'Pagamento Recusado',
          message: 'Não foi possível processar seu pagamento. Tente novamente.',
          color: 'text-red-600'
        };
      default:
        return {
          icon: <Clock className="h-12 w-12 text-blue-500" />,
          title: 'Processando Pagamento',
          message: 'Seu pagamento está sendo processado.',
          color: 'text-blue-600'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {statusInfo.icon}
          </div>
          <CardTitle className={statusInfo.color}>
            {statusInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {statusInfo.message}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Pedido:</span>
              <span className="font-mono">{result.order_id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span>Valor:</span>
              <span className="font-semibold">{formatPrice(result.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={statusInfo.color}>
                {result.status === 'paid' ? 'Pago' : 
                 result.status === 'pending' ? 'Pendente' : 
                 result.status === 'failed' ? 'Falhou' : result.status}
              </span>
            </div>
          </div>

          {/* PIX Payment */}
          {result.pix && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Pagamento PIX</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Escaneie o QR Code ou copie o código para pagar
                </p>
                
                {result.pix.qr_code_url && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={result.pix.qr_code_url} 
                      alt="QR Code PIX" 
                      className="w-48 h-48 border rounded"
                    />
                  </div>
                )}
                
                <Button
                  onClick={handleCopyPixCode}
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copiado!' : 'Copiar código PIX'}
                </Button>
              </div>
            </div>
          )}

          {/* Boleto Payment */}
          {result.boleto && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Boleto Bancário</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Pague até {new Date(result.boleto.expires_at).toLocaleDateString('pt-BR')}
                </p>
                
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(result.boleto?.url, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visualizar Boleto
                  </Button>
                  
                  <Button
                    onClick={handleCopyBarcode}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? 'Copiado!' : 'Copiar código de barras'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Button onClick={onClose} className="w-full">
            Fechar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};