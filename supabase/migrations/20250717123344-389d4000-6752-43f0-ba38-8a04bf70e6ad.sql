-- Create tags table for better tag management
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  description text,
  color character varying DEFAULT '#3b82f6',
  active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on tags table
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create policies for tags
CREATE POLICY "Tags are viewable by everyone" 
ON public.tags 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage tags" 
ON public.tags 
FOR ALL 
USING (is_admin());

-- Create trigger for tags updated_at
CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update menu_items table to support tags
ALTER TABLE public.menu_items 
ADD COLUMN tag_id uuid;

-- Create trigger to sync tags to menu items
CREATE OR REPLACE FUNCTION public.sync_tags_to_menu()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.menu_items (name, link, position, active, is_category, tag_id)
    VALUES (NEW.name, '/tag/' || NEW.slug, 200 + (SELECT COALESCE(MAX(position), 0) FROM public.menu_items WHERE tag_id IS NOT NULL), true, false, NEW.id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.menu_items 
    SET name = NEW.name, link = '/tag/' || NEW.slug, active = NEW.active, updated_at = now()
    WHERE tag_id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.menu_items WHERE tag_id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_tags_to_menu_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tags
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_tags_to_menu();

-- Create a product_tags junction table for many-to-many relationship
CREATE TABLE public.product_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, tag_id)
);

-- Enable RLS on product_tags table
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for product_tags
CREATE POLICY "Product tags are viewable by everyone" 
ON public.product_tags 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage product tags" 
ON public.product_tags 
FOR ALL 
USING (is_admin());

-- Add foreign key constraints
ALTER TABLE public.product_tags 
ADD CONSTRAINT product_tags_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.product_tags 
ADD CONSTRAINT product_tags_tag_id_fkey 
FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;

ALTER TABLE public.menu_items 
ADD CONSTRAINT menu_items_tag_id_fkey 
FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;

-- Insert some default tags
INSERT INTO public.tags (name, slug, description, color) VALUES 
('Novidades', 'novidades', 'Produtos recém-chegados', '#10b981'),
('Promoção', 'promocao', 'Produtos em promoção', '#f59e0b'),
('Bestsellers', 'bestsellers', 'Produtos mais vendidos', '#8b5cf6'),
('Verão', 'verao', 'Coleção de verão', '#f97316'),
('Inverno', 'inverno', 'Coleção de inverno', '#3b82f6'),
('Casual', 'casual', 'Roupas casuais', '#6b7280'),
('Elegante', 'elegante', 'Roupas elegantes', '#dc2626'),
('Festa', 'festa', 'Roupas para festas', '#ec4899');