-- Create new tables for improved variation management

-- Table for product attributes (size, color, material, etc.)
CREATE TABLE public.product_attributes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_name VARCHAR(50) NOT NULL, -- 'size', 'color', 'material'
  attribute_values JSONB NOT NULL, -- ['P', 'M', 'G'] or ['Verde', 'Azul', 'Vermelho']
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for product variants (combinations of attributes)
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attributes JSONB NOT NULL, -- {'size': 'P', 'color': 'Verde', 'material': 'Algodão'}
  sku VARCHAR(100) UNIQUE,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  reorder_point INTEGER DEFAULT 10,
  images TEXT[] DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for product_attributes
CREATE POLICY "Admins can manage product attributes" 
ON public.product_attributes FOR ALL 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Product attributes are viewable by everyone" 
ON public.product_attributes FOR SELECT 
TO anon, authenticated
USING (true);

-- Create policies for product_variants
CREATE POLICY "Admins can manage product variants" 
ON public.product_variants FOR ALL 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Active product variants are viewable by everyone" 
ON public.product_variants FOR SELECT 
TO anon, authenticated
USING (active = true);

-- Create indexes for better performance
CREATE INDEX idx_product_attributes_product_id ON public.product_attributes(product_id);
CREATE INDEX idx_product_attributes_name ON public.product_attributes(attribute_name);
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_attributes ON public.product_variants USING GIN(attributes);
CREATE INDEX idx_product_variants_active ON public.product_variants(active);
CREATE INDEX idx_product_variants_stock ON public.product_variants(stock_quantity);

-- Create triggers for updated_at
CREATE TRIGGER update_product_attributes_updated_at
  BEFORE UPDATE ON public.product_attributes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for inventory alerts on product_variants
CREATE TRIGGER trigger_inventory_check_variants
  AFTER INSERT OR UPDATE OF stock_quantity ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_inventory_check();

-- Function to auto-generate SKUs
CREATE OR REPLACE FUNCTION public.generate_variant_sku(
  p_product_id UUID,
  p_attributes JSONB
) RETURNS TEXT AS $$
DECLARE
  product_record products%ROWTYPE;
  attr_parts TEXT[] := '{}';
  attr_key TEXT;
  attr_value TEXT;
  base_sku TEXT;
  counter INTEGER := 1;
  final_sku TEXT;
BEGIN
  -- Get product info
  SELECT * INTO product_record FROM public.products WHERE id = p_product_id;
  
  -- Base SKU from product name or existing SKU
  base_sku := COALESCE(product_record.sku, UPPER(SUBSTRING(REPLACE(product_record.name, ' ', ''), 1, 4)));
  
  -- Add attribute parts
  FOR attr_key IN SELECT jsonb_object_keys(p_attributes) ORDER BY attr_key
  LOOP
    attr_value := p_attributes->>attr_key;
    attr_parts := attr_parts || UPPER(SUBSTRING(attr_value, 1, 3));
  END LOOP;
  
  -- Combine parts
  final_sku := base_sku || '-' || array_to_string(attr_parts, '-');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.product_variants WHERE sku = final_sku || CASE WHEN counter = 1 THEN '' ELSE '-' || counter::TEXT END) LOOP
    counter := counter + 1;
  END LOOP;
  
  RETURN final_sku || CASE WHEN counter = 1 THEN '' ELSE '-' || counter::TEXT END;
END;
$$ LANGUAGE plpgsql;

-- Function to get available attribute values based on current selection
CREATE OR REPLACE FUNCTION public.get_available_attribute_values(
  p_product_id UUID,
  p_selected_attributes JSONB DEFAULT '{}'::jsonb
) RETURNS TABLE (
  attribute_name TEXT,
  available_values JSONB,
  has_stock BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    attr.attribute_name::TEXT,
    jsonb_agg(DISTINCT (variant.attributes->>attr.attribute_name)) as available_values,
    bool_or(variant.stock_quantity > 0) as has_stock
  FROM public.product_attributes attr
  LEFT JOIN public.product_variants variant ON (
    variant.product_id = attr.product_id 
    AND variant.active = true
    AND (
      p_selected_attributes = '{}'::jsonb 
      OR variant.attributes @> p_selected_attributes
    )
  )
  WHERE attr.product_id = p_product_id
  GROUP BY attr.attribute_name, attr.display_order
  ORDER BY attr.display_order;
END;
$$ LANGUAGE plpgsql;