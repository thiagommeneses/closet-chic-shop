-- Add customer_id foreign key to orders table to establish relationship
ALTER TABLE public.orders 
ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Create an index for better performance on the foreign key
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);

-- Update existing orders to link with customers based on email match
UPDATE public.orders 
SET customer_id = customers.id 
FROM public.customers 
WHERE orders.customer_email = customers.email;