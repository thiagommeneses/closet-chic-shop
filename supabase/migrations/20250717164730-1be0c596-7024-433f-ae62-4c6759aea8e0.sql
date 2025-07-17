-- Create stock movements table for inventory tracking
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variation_id UUID REFERENCES public.product_variations(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'reserved', 'released')),
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  order_id UUID REFERENCES public.orders(id),
  reference_id TEXT, -- For external references
  notes TEXT,
  created_by TEXT, -- Admin user who made the change
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory alerts table
CREATE TABLE public.inventory_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variation_id UUID REFERENCES public.product_variations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'reorder_point')),
  threshold_value INTEGER,
  current_stock INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart reservations table for temporary stock holds
CREATE TABLE public.cart_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variation_id UUID REFERENCES public.product_variations(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add inventory settings columns to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS auto_reorder BOOLEAN DEFAULT false;

-- Add inventory settings to product variations
ALTER TABLE public.product_variations 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10;

-- Enable RLS on new tables
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_reservations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_movements
CREATE POLICY "Admins can manage stock movements" ON public.stock_movements
FOR ALL USING (is_admin());

CREATE POLICY "Stock movements are viewable by admins" ON public.stock_movements
FOR SELECT USING (is_admin());

-- RLS Policies for inventory_alerts
CREATE POLICY "Admins can manage inventory alerts" ON public.inventory_alerts
FOR ALL USING (is_admin());

-- RLS Policies for cart_reservations
CREATE POLICY "Cart reservations are managed by system" ON public.cart_reservations
FOR ALL USING (true);

-- Function to record stock movement
CREATE OR REPLACE FUNCTION public.record_stock_movement(
  p_product_id UUID,
  p_variation_id UUID DEFAULT NULL,
  p_movement_type TEXT,
  p_quantity INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_previous_stock INTEGER;
  v_new_stock INTEGER;
  v_movement_id UUID;
BEGIN
  -- Get current stock
  IF p_variation_id IS NOT NULL THEN
    SELECT stock_quantity INTO v_previous_stock 
    FROM public.product_variations 
    WHERE id = p_variation_id;
  ELSE
    SELECT stock_quantity INTO v_previous_stock 
    FROM public.products 
    WHERE id = p_product_id;
  END IF;

  -- Calculate new stock
  IF p_movement_type IN ('in', 'adjustment') THEN
    v_new_stock := v_previous_stock + p_quantity;
  ELSIF p_movement_type IN ('out', 'reserved') THEN
    v_new_stock := v_previous_stock - p_quantity;
  ELSIF p_movement_type = 'released' THEN
    v_new_stock := v_previous_stock + p_quantity;
  END IF;

  -- Prevent negative stock
  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Insufficient stock. Current: %, Requested: %', v_previous_stock, p_quantity;
  END IF;

  -- Update stock
  IF p_variation_id IS NOT NULL THEN
    UPDATE public.product_variations 
    SET stock_quantity = v_new_stock, updated_at = now()
    WHERE id = p_variation_id;
  ELSE
    UPDATE public.products 
    SET stock_quantity = v_new_stock, updated_at = now()
    WHERE id = p_product_id;
  END IF;

  -- Record movement
  INSERT INTO public.stock_movements (
    product_id, variation_id, movement_type, quantity, 
    previous_stock, new_stock, reason, order_id, 
    reference_id, notes, created_by
  ) VALUES (
    p_product_id, p_variation_id, p_movement_type, p_quantity,
    v_previous_stock, v_new_stock, p_reason, p_order_id,
    p_reference_id, p_notes, p_created_by
  ) RETURNING id INTO v_movement_id;

  RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and create inventory alerts
CREATE OR REPLACE FUNCTION public.check_inventory_alerts()
RETURNS void AS $$
DECLARE
  product_record RECORD;
  variation_record RECORD;
BEGIN
  -- Check product stock levels
  FOR product_record IN 
    SELECT id, name, stock_quantity, low_stock_threshold, reorder_point
    FROM public.products 
    WHERE active = true
  LOOP
    -- Check for out of stock
    IF product_record.stock_quantity = 0 THEN
      INSERT INTO public.inventory_alerts (product_id, alert_type, current_stock, threshold_value)
      VALUES (product_record.id, 'out_of_stock', product_record.stock_quantity, 0)
      ON CONFLICT DO NOTHING;
    -- Check for low stock
    ELSIF product_record.stock_quantity <= product_record.low_stock_threshold THEN
      INSERT INTO public.inventory_alerts (product_id, alert_type, current_stock, threshold_value)
      VALUES (product_record.id, 'low_stock', product_record.stock_quantity, product_record.low_stock_threshold)
      ON CONFLICT DO NOTHING;
    -- Check for reorder point
    ELSIF product_record.stock_quantity <= product_record.reorder_point THEN
      INSERT INTO public.inventory_alerts (product_id, alert_type, current_stock, threshold_value)
      VALUES (product_record.id, 'reorder_point', product_record.stock_quantity, product_record.reorder_point)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Check variation stock levels
  FOR variation_record IN 
    SELECT pv.id, pv.product_id, pv.stock_quantity, pv.low_stock_threshold, pv.reorder_point, p.name
    FROM public.product_variations pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.active = true AND p.active = true
  LOOP
    -- Check for out of stock
    IF variation_record.stock_quantity = 0 THEN
      INSERT INTO public.inventory_alerts (product_id, variation_id, alert_type, current_stock, threshold_value)
      VALUES (variation_record.product_id, variation_record.id, 'out_of_stock', variation_record.stock_quantity, 0)
      ON CONFLICT DO NOTHING;
    -- Check for low stock
    ELSIF variation_record.stock_quantity <= variation_record.low_stock_threshold THEN
      INSERT INTO public.inventory_alerts (product_id, variation_id, alert_type, current_stock, threshold_value)
      VALUES (variation_record.product_id, variation_record.id, 'low_stock', variation_record.stock_quantity, variation_record.low_stock_threshold)
      ON CONFLICT DO NOTHING;
    -- Check for reorder point
    ELSIF variation_record.stock_quantity <= variation_record.reorder_point THEN
      INSERT INTO public.inventory_alerts (product_id, variation_id, alert_type, current_stock, threshold_value)
      VALUES (variation_record.product_id, variation_record.id, 'reorder_point', variation_record.stock_quantity, variation_record.reorder_point)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired cart reservations
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS void AS $$
DECLARE
  reservation_record RECORD;
BEGIN
  -- Get expired reservations
  FOR reservation_record IN 
    SELECT * FROM public.cart_reservations 
    WHERE expires_at < now()
  LOOP
    -- Release the reserved stock
    PERFORM public.record_stock_movement(
      reservation_record.product_id,
      reservation_record.variation_id,
      'released',
      reservation_record.quantity,
      'Expired cart reservation cleanup',
      NULL,
      'cart_cleanup_' || reservation_record.id::text,
      'Automatic cleanup of expired cart reservation'
    );
  END LOOP;

  -- Delete expired reservations
  DELETE FROM public.cart_reservations WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically check alerts after stock changes
CREATE OR REPLACE FUNCTION public.trigger_inventory_check()
RETURNS trigger AS $$
BEGIN
  PERFORM public.check_inventory_alerts();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic inventory checking
CREATE TRIGGER check_inventory_after_product_update
  AFTER UPDATE OF stock_quantity ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.trigger_inventory_check();

CREATE TRIGGER check_inventory_after_variation_update
  AFTER UPDATE OF stock_quantity ON public.product_variations
  FOR EACH ROW EXECUTE FUNCTION public.trigger_inventory_check();

-- Create indexes for performance
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at DESC);
CREATE INDEX idx_inventory_alerts_status ON public.inventory_alerts(status) WHERE status = 'active';
CREATE INDEX idx_cart_reservations_expires_at ON public.cart_reservations(expires_at);
CREATE INDEX idx_cart_reservations_session_id ON public.cart_reservations(session_id);

-- Add updated_at trigger for inventory_alerts
CREATE TRIGGER update_inventory_alerts_updated_at
  BEFORE UPDATE ON public.inventory_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();