-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  sku TEXT UNIQUE,
  stock_quantity INTEGER DEFAULT 0,
  category_id UUID REFERENCES public.categories(id),
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_users table for admin authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  tracking_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table for store configuration
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND active = true
  );
$$;

-- RLS Policies for categories (public read, admin write)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.categories FOR ALL 
USING (public.is_admin());

-- RLS Policies for products (public read, admin write)
CREATE POLICY "Active products are viewable by everyone" 
ON public.products FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can view all products" 
ON public.products FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can manage products" 
ON public.products FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products" 
ON public.products FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admins can delete products" 
ON public.products FOR DELETE 
USING (public.is_admin());

-- RLS Policies for admin_users (admin only)
CREATE POLICY "Admins can view admin users" 
ON public.admin_users FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can manage admin users" 
ON public.admin_users FOR ALL 
USING (public.is_admin());

-- RLS Policies for orders (admin only)
CREATE POLICY "Admins can manage orders" 
ON public.orders FOR ALL 
USING (public.is_admin());

-- RLS Policies for settings (admin only)
CREATE POLICY "Admins can manage settings" 
ON public.settings FOR ALL 
USING (public.is_admin());

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
('store_name', '"Closet Collection"', 'Nome da loja'),
('store_description', '"Elegância e sofisticação em cada detalhe"', 'Descrição da loja'),
('free_shipping_min', '200', 'Valor mínimo para frete grátis'),
('correios_user', '""', 'Usuário dos Correios'),
('correios_password', '""', 'Senha dos Correios'),
('pagarme_api_key', '""', 'Chave API do Pagar.me'),
('google_analytics_id', '""', 'ID do Google Analytics'),
('facebook_pixel_id', '""', 'ID do Facebook Pixel');

-- Insert default categories
INSERT INTO public.categories (name, slug, description) VALUES
('Vestidos', 'vestidos', 'Vestidos elegantes e sofisticados'),
('Blusas', 'blusas', 'Blusas modernas e versáteis'),
('Saias', 'saias', 'Saias estilosas para todos os momentos'),
('Casacos', 'casacos', 'Casacos e jaquetas da moda');

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);

-- Create storage policies for product images
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'products');

CREATE POLICY "Admins can upload product images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'products' AND public.is_admin());

CREATE POLICY "Admins can update product images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'products' AND public.is_admin());

CREATE POLICY "Admins can delete product images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'products' AND public.is_admin());