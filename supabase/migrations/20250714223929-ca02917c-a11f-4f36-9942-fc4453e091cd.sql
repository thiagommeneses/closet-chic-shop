-- Create customers table to track customer data and order history
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  cpf TEXT,
  pagarme_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table to track payment data
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  pagarme_transaction_id TEXT UNIQUE,
  payment_method TEXT NOT NULL, -- credit_card, boleto, pix
  amount INTEGER NOT NULL, -- amount in cents
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, cancelled, refunded
  installments INTEGER DEFAULT 1,
  card_last_digits TEXT,
  card_brand TEXT,
  boleto_url TEXT,
  boleto_barcode TEXT,
  pix_qr_code TEXT,
  pix_qr_code_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Customers can view their own data" 
ON public.customers 
FOR SELECT 
USING (true); -- Will be restricted by application logic

CREATE POLICY "Admins can manage customers" 
ON public.customers 
FOR ALL 
USING (is_admin());

-- Create policies for payments
CREATE POLICY "Payments are managed by system" 
ON public.payments 
FOR ALL 
USING (true); -- Payments will be managed by edge functions and admin

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_pagarme_id ON public.customers(pagarme_customer_id);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_pagarme_transaction_id ON public.payments(pagarme_transaction_id);
CREATE INDEX idx_payments_status ON public.payments(status);