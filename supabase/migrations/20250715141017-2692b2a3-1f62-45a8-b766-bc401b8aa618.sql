-- Create product variations table
CREATE TABLE public.product_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  variation_type VARCHAR(50) NOT NULL, -- 'size', 'color', 'material', etc.
  variation_value VARCHAR(100) NOT NULL,
  sku VARCHAR(100),
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product details templates table
CREATE TABLE public.product_details_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'size_guide', 'composition', 'care_instructions'
  content JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product details relation table
CREATE TABLE public.product_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  template_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_details_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_details ENABLE ROW LEVEL SECURITY;

-- Create policies for product_variations
CREATE POLICY "Active product variations are viewable by everyone" 
ON public.product_variations 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage product variations" 
ON public.product_variations 
FOR ALL 
USING (is_admin());

-- Create policies for product_details_templates
CREATE POLICY "Active templates are viewable by everyone" 
ON public.product_details_templates 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage templates" 
ON public.product_details_templates 
FOR ALL 
USING (is_admin());

-- Create policies for product_details
CREATE POLICY "Product details are viewable by everyone" 
ON public.product_details 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage product details" 
ON public.product_details 
FOR ALL 
USING (is_admin());

-- Create foreign key constraints
ALTER TABLE public.product_variations 
ADD CONSTRAINT product_variations_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.product_details 
ADD CONSTRAINT product_details_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.product_details 
ADD CONSTRAINT product_details_template_id_fkey 
FOREIGN KEY (template_id) REFERENCES public.product_details_templates(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_product_variations_product_id ON public.product_variations(product_id);
CREATE INDEX idx_product_variations_type ON public.product_variations(variation_type);
CREATE INDEX idx_product_details_templates_type ON public.product_details_templates(type);
CREATE INDEX idx_product_details_product_id ON public.product_details(product_id);

-- Create trigger for updated_at
CREATE TRIGGER update_product_variations_updated_at
BEFORE UPDATE ON public.product_variations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_details_templates_updated_at
BEFORE UPDATE ON public.product_details_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default templates
INSERT INTO public.product_details_templates (name, type, content) VALUES
('Guia de Medidas Básica', 'size_guide', '{
  "P": {"bust": "86-90cm", "waist": "66-70cm", "hip": "94-98cm"},
  "M": {"bust": "90-94cm", "waist": "70-74cm", "hip": "98-102cm"},
  "G": {"bust": "94-98cm", "waist": "74-78cm", "hip": "102-106cm"},
  "GG": {"bust": "98-102cm", "waist": "78-82cm", "hip": "106-110cm"}
}'),
('Composição Algodão', 'composition', '{
  "materials": ["100% Algodão"],
  "origin": "Brasil",
  "certifications": ["OEKO-TEX Standard 100"]
}'),
('Composição Viscose', 'composition', '{
  "materials": ["100% Viscose"],
  "origin": "Brasil",
  "certifications": []
}'),
('Cuidados Básicos', 'care_instructions', '{
  "washing": "Lavagem à máquina em água fria (30°C)",
  "drying": "Secar à sombra",
  "ironing": "Passar ferro em temperatura baixa",
  "bleaching": "Não usar alvejante",
  "dry_cleaning": "Lavagem a seco permitida"
}'),
('Cuidados Delicados', 'care_instructions', '{
  "washing": "Lavagem à mão em água fria",
  "drying": "Secar na horizontal à sombra",
  "ironing": "Passar ferro em temperatura baixa com pano",
  "bleaching": "Não usar alvejante",
  "dry_cleaning": "Recomendado lavagem a seco"
}');