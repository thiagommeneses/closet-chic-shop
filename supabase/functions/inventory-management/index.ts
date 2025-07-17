import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InventoryRequest {
  action: 'record_movement' | 'reserve_cart' | 'release_cart' | 'process_order' | 'cleanup_reservations' | 'get_alerts';
  product_id?: string;
  variation_id?: string;
  movement_type?: 'in' | 'out' | 'adjustment' | 'reserved' | 'released';
  quantity?: number;
  reason?: string;
  order_id?: string;
  session_id?: string;
  created_by?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body: InventoryRequest = await req.json();
    console.log("Inventory request:", body);

    switch (body.action) {
      case 'record_movement':
        return await recordMovement(supabase, body);
      case 'reserve_cart':
        return await reserveCart(supabase, body);
      case 'release_cart':
        return await releaseCart(supabase, body);
      case 'process_order':
        return await processOrder(supabase, body);
      case 'cleanup_reservations':
        return await cleanupReservations(supabase);
      case 'get_alerts':
        return await getAlerts(supabase);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { 
            status: 400, 
            headers: { "Content-Type": "application/json", ...corsHeaders }
          }
        );
    }
  } catch (error) {
    console.error("Error in inventory management:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

async function recordMovement(supabase: any, body: InventoryRequest) {
  const { data, error } = await supabase.rpc('record_stock_movement', {
    p_product_id: body.product_id,
    p_movement_type: body.movement_type,
    p_quantity: body.quantity,
    p_variation_id: body.variation_id,
    p_reason: body.reason,
    p_order_id: body.order_id,
    p_created_by: body.created_by
  });

  if (error) {
    console.error("Error recording movement:", error);
    throw error;
  }

  return new Response(
    JSON.stringify({ success: true, movement_id: data }),
    { 
      status: 200, 
      headers: { "Content-Type": "application/json", ...corsHeaders }
    }
  );
}

async function reserveCart(supabase: any, body: InventoryRequest) {
  // First, check if there's enough stock
  const stockQuery = body.variation_id 
    ? supabase.from('product_variations').select('stock_quantity').eq('id', body.variation_id)
    : supabase.from('products').select('stock_quantity').eq('id', body.product_id);

  const { data: stockData, error: stockError } = await stockQuery.single();
  
  if (stockError || !stockData) {
    throw new Error("Product not found or error checking stock");
  }

  if (stockData.stock_quantity < body.quantity) {
    throw new Error("Insufficient stock for reservation");
  }

  // Check if reservation already exists for this session
  const { data: existingReservation, error: existingError } = await supabase
    .from('cart_reservations')
    .select('*')
    .eq('session_id', body.session_id)
    .eq('product_id', body.product_id)
    .eq('variation_id', body.variation_id || null)
    .single();

  if (existingReservation) {
    // Update existing reservation
    const { error: updateError } = await supabase
      .from('cart_reservations')
      .update({
        quantity: body.quantity,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      })
      .eq('id', existingReservation.id);

    if (updateError) throw updateError;
  } else {
    // Create new reservation
    const { error: insertError } = await supabase
      .from('cart_reservations')
      .insert({
        session_id: body.session_id,
        product_id: body.product_id,
        variation_id: body.variation_id,
        quantity: body.quantity,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      });

    if (insertError) throw insertError;
  }

  // Record the stock movement
  const { error: movementError } = await supabase.rpc('record_stock_movement', {
    p_product_id: body.product_id,
    p_movement_type: 'reserved',
    p_quantity: body.quantity,
    p_variation_id: body.variation_id,
    p_reason: 'Cart reservation',
    p_reference_id: `cart_${body.session_id}`
  });

  if (movementError) throw movementError;

  return new Response(
    JSON.stringify({ success: true, message: "Stock reserved successfully" }),
    { 
      status: 200, 
      headers: { "Content-Type": "application/json", ...corsHeaders }
    }
  );
}

async function releaseCart(supabase: any, body: InventoryRequest) {
  // Get reservation
  const { data: reservation, error: reservationError } = await supabase
    .from('cart_reservations')
    .select('*')
    .eq('session_id', body.session_id)
    .eq('product_id', body.product_id)
    .eq('variation_id', body.variation_id || null)
    .single();

  if (reservationError || !reservation) {
    return new Response(
      JSON.stringify({ success: true, message: "No reservation found" }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }

  // Release the stock
  const { error: movementError } = await supabase.rpc('record_stock_movement', {
    p_product_id: body.product_id,
    p_movement_type: 'released',
    p_quantity: reservation.quantity,
    p_variation_id: body.variation_id,
    p_reason: 'Cart reservation released',
    p_reference_id: `cart_release_${body.session_id}`
  });

  if (movementError) throw movementError;

  // Delete reservation
  const { error: deleteError } = await supabase
    .from('cart_reservations')
    .delete()
    .eq('id', reservation.id);

  if (deleteError) throw deleteError;

  return new Response(
    JSON.stringify({ success: true, message: "Reservation released successfully" }),
    { 
      status: 200, 
      headers: { "Content-Type": "application/json", ...corsHeaders }
    }
  );
}

async function processOrder(supabase: any, body: InventoryRequest) {
  // Get all reservations for this session
  const { data: reservations, error: reservationsError } = await supabase
    .from('cart_reservations')
    .select('*')
    .eq('session_id', body.session_id);

  if (reservationsError) throw reservationsError;

  // Process each reservation
  for (const reservation of reservations) {
    // Convert reservation to sale
    const { error: saleError } = await supabase.rpc('record_stock_movement', {
      p_product_id: reservation.product_id,
      p_movement_type: 'out',
      p_quantity: reservation.quantity,
      p_variation_id: reservation.variation_id,
      p_reason: 'Order completed',
      p_order_id: body.order_id,
      p_reference_id: `order_${body.order_id}`
    });

    if (saleError) {
      console.error("Error processing order for product:", reservation.product_id, saleError);
      // Continue processing other items
    }
  }

  // Delete all reservations for this session
  const { error: deleteError } = await supabase
    .from('cart_reservations')
    .delete()
    .eq('session_id', body.session_id);

  if (deleteError) throw deleteError;

  return new Response(
    JSON.stringify({ success: true, message: "Order processed successfully" }),
    { 
      status: 200, 
      headers: { "Content-Type": "application/json", ...corsHeaders }
    }
  );
}

async function cleanupReservations(supabase: any) {
  const { error } = await supabase.rpc('cleanup_expired_reservations');
  
  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, message: "Cleanup completed" }),
    { 
      status: 200, 
      headers: { "Content-Type": "application/json", ...corsHeaders }
    }
  );
}

async function getAlerts(supabase: any) {
  const { data, error } = await supabase
    .from('inventory_alerts')
    .select(`
      *,
      products (name, sku),
      product_variations (variation_type, variation_value)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, alerts: data }),
    { 
      status: 200, 
      headers: { "Content-Type": "application/json", ...corsHeaders }
    }
  );
}

serve(handler);