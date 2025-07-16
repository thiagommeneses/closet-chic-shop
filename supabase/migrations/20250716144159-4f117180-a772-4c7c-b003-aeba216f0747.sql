-- Create banners table for managing website banners
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'hero', 'half', 'full'
  title TEXT,
  subtitle TEXT,
  button_text TEXT,
  button_link TEXT,
  image_url TEXT,
  video_url TEXT,
  position INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on banners table
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Create policies for banners
CREATE POLICY "Banners are viewable by everyone" 
ON public.banners 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage banners" 
ON public.banners 
FOR ALL 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial banner data
INSERT INTO public.banners (name, type, title, subtitle, button_text, button_link, image_url, position, active) VALUES
('Banner Principal 1', 'hero', 'PREVIEW', 'PRIMAVERA VERÃO', 'SHOP NOW', '/', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80', 0, true),
('Banner Principal 2', 'hero', 'PREVIEW', 'PRIMAVERA VERÃO', 'SHOP NOW', '/', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80', 1, true),
('Banner Lateral 1', 'half', 'NOVA', 'COLEÇÃO', 'VER MAIS', '/', 'https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80', 0, true),
('Banner Lateral 2', 'half', 'COLEÇÃO', 'PRIMAVERA', 'VER MAIS', '/', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2088&q=80', 1, true);