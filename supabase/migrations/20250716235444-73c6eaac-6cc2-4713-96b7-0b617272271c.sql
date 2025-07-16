-- Create menu_items table for configurable navigation
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  link VARCHAR,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  is_category BOOLEAN NOT NULL DEFAULT false,
  category_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Menu items are viewable by everyone" 
ON public.menu_items 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage menu items" 
ON public.menu_items 
FOR ALL 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default menu items
INSERT INTO public.menu_items (name, link, position, active, is_category) VALUES
('Toda Loja', '/', 1, true, false),
('Novidades', '/novidades', 2, true, false),
('Outlet', '/outlet', 3, true, false);

-- Create a function to automatically sync categories as menu items
CREATE OR REPLACE FUNCTION sync_categories_to_menu()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.menu_items (name, link, position, active, is_category, category_id)
    VALUES (NEW.name, '/categoria/' || NEW.slug, 100 + (SELECT COALESCE(MAX(position), 0) FROM public.menu_items WHERE is_category = true), true, true, NEW.id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.menu_items 
    SET name = NEW.name, link = '/categoria/' || NEW.slug, updated_at = now()
    WHERE category_id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.menu_items WHERE category_id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync categories
CREATE TRIGGER sync_categories_to_menu_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION sync_categories_to_menu();