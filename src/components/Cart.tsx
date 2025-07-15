import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export const Cart = () => {
  const { state, removeItem, updateQuantity, closeCart, totalPrice } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const shipping = totalPrice > 199 ? 0 : 29.90;
  const finalTotal = totalPrice + shipping;

  return (
    <Sheet open={state.isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Meu Carrinho ({state.items.length})
          </SheetTitle>
          <SheetDescription>
            {state.items.length === 0 
              ? 'Seu carrinho está vazio' 
              : 'Revise seus itens antes de finalizar a compra'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-120px)]">
          {state.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <ShoppingBag className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Seu carrinho está vazio.<br />
                Adicione produtos para continuar.
              </p>
              <Button onClick={closeCart} variant="elegant">
                Continuar Comprando
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto space-y-4 py-6 min-h-0">
                {state.items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 border border-border rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-20 object-cover rounded"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                      <p className="text-primary font-semibold">
                        {formatPrice(item.price)}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <div className="border-t border-border pt-4 pb-6 space-y-3 mt-auto">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                      {shipping === 0 ? 'GRÁTIS' : formatPrice(shipping)}
                    </span>
                  </div>
                  {totalPrice < 199 && (
                    <p className="text-xs text-muted-foreground">
                      Frete grátis acima de R$ 199
                    </p>
                  )}
                </div>
                
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>

                <Button 
                  className="w-full" 
                  variant="elegant" 
                  size="lg"
                  onClick={handleCheckout}
                >
                  Finalizar Compra
                </Button>
                
                <Button 
                  variant="minimal" 
                  className="w-full"
                  onClick={closeCart}
                >
                  Continuar Comprando
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};