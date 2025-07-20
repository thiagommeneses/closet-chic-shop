
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
  console.log(`Starting cart reservation for product ${body.product_id}, quantity: ${body.quantity}`);
  
  try {
    // First, validate that the product exists
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, name, stock_quantity, active')
      .eq('id', body.product_id)
      .single();

    if (productError) {
      console.error("Error fetching product:", productError);
      throw new Error(`Product with ID ${body.product_id} not found: ${productError.message}`);
    }

    if (!productData) {
      console.error("Product not found:", body.product_id);
      throw new Error(`Product with ID ${body.product_id} not found`);
    }

    if (!productData.active) {
      console.error("Product is not active:", body.product_id);
      throw new Error("Product is not available");
    }

    console.log("Product found:", productData);

    // Check stock availability - use product stock since we're not using variations yet
    const availableStock = productData.stock_quantity || 0;
    
    console.log(`Available stock: ${availableStock}, requested: ${body.quantity}`);

    if (availableStock < body.quantity) {
      console.error(`Insufficient stock. Available: ${availableStock}, requested: ${body.quantity}`);
      throw new Error(`Estoque insuficiente. Disponível: ${availableStock}, solicitado: ${body.quantity}`);
    }

    // Check for existing reservation
    const { data: existingReservation, error: existingError } = await supabase
      .from('cart_reservations')
      .select('*')
      .eq('session_id', body.session_id)
      .eq('product_id', body.product_id)
      .eq('variation_id', body.variation_id || null)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing reservation:", existingError);
      throw new Error(`Error checking existing reservation: ${existingError.message}`);
    }

    if (existingReservation) {
      console.log("Updating existing reservation:", existingReservation.id);
      // Update existing reservation
      const { error: updateError } = await supabase
        .from('cart_reservations')
        .update({
          quantity: body.quantity,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        })
        .eq('id', existingReservation.id);

      if (updateError) {
        console.error("Error updating reservation:", updateError);
        throw new Error(`Error updating reservation: ${updateError.message}`);
      }
    } else {
      console.log("Creating new reservation");
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

      if (insertError) {
        console.error("Error creating reservation:", insertError);
        throw new Error(`Error creating reservation: ${insertError.message}`);
      }
    }

    // Record the stock movement for reservation tracking
    try {
      const { error: movementError } = await supabase.rpc('record_stock_movement', {
        p_product_id: body.product_id,
        p_movement_type: 'reserved',
        p_quantity: body.quantity,
        p_variation_id: body.variation_id,
        p_reason: 'Cart reservation',
        p_reference_id: `cart_${body.session_id}`
      });

      if (movementError) {
        console.error("Error recording movement (non-critical):", movementError);
        // Don't throw here as the reservation was successful
      }
    } catch (movementErr) {
      console.error("Non-critical error recording movement:", movementErr);
      // Continue as reservation was successful
    }

    console.log("Cart reservation completed successfully");
    return new Response(
      JSON.stringify({ success: true, message: "Stock reserved successfully" }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error) {
    console.error("Error in reserveCart:", error);
    throw error;
  }
}

async function releaseCart(supabase: any, body: InventoryRequest) {
  console.log(`Releasing cart reservation for product ${body.product_id}, session: ${body.session_id}`);
  
  try {
    // Get reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('cart_reservations')
      .select('*')
      .eq('session_id', body.session_id)
      .eq('product_id', body.product_id)
      .eq('variation_id', body.variation_id || null)
      .maybeSingle();

    if (reservationError) {
      console.error("Error fetching reservation:", reservationError);
      throw new Error(`Error fetching reservation: ${reservationError.message}`);
    }

    if (!reservation) {
      console.log("No reservation found to release");
      return new Response(
        JSON.stringify({ success: true, message: "No reservation found" }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Release the stock movement record
    try {
      const { error: movementError } = await supabase.rpc('record_stock_movement', {
        p_product_id: body.product_id,
        p_movement_type: 'released',
        p_quantity: reservation.quantity,
        p_variation_id: body.variation_id,
        p_reason: 'Cart reservation released',
        p_reference_id: `cart_release_${body.session_id}`
      });

      if (movementError) {
        console.error("Error recording release movement (non-critical):", movementError);
      }
    } catch (movementErr) {
      console.error("Non-critical error recording release movement:", movementErr);
    }

    // Delete reservation
    const { error: deleteError } = await supabase
      .from('cart_reservations')
      .delete()
      .eq('id', reservation.id);

    if (deleteError) {
      console.error("Error deleting reservation:", deleteError);
      throw new Error(`Error deleting reservation: ${deleteError.message}`);
    }

    console.log("Cart reservation released successfully");
    return new Response(
      JSON.stringify({ success: true, message: "Reservation released successfully" }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (error) {
    console.error("Error in releaseCart:", error);
    throw error;
  }
}

async function processOrder(supabase: any, body: InventoryRequest) {
  console.log(`Processing order ${body.order_id} for session ${body.session_id}`);
  
  try {
    // Get all reservations for this session
    const { data: reservations, error: reservationsError } = await supabase
      .from('cart_reservations')
      .select('*')
      .eq('session_id', body.session_id);

    if (reservationsError) {
      console.error("Error fetching reservations:", reservationsError);
      throw new Error(`Error fetching reservations: ${reservationsError.message}`);
    }

    if (!reservations || reservations.length === 0) {
      console.log("No reservations found for session");
      return new Response(
        JSON.stringify({ success: true, message: "No reservations to process" }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Process each reservation
    for (const reservation of reservations) {
      try {
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
      } catch (itemError) {
        console.error("Error processing item:", reservation.product_id, itemError);
        // Continue processing other items
      }
    }

    // Delete all reservations for this session
    const { error: deleteError } = await supabase
      .from('cart_reservations')
      .delete()
      .eq('session_id', body.session_id);

    if (deleteError) {
      console.error("Error deleting reservations:", deleteError);
      throw new Error(`Error deleting reservations: ${deleteError.message}`);
    }

    console.log("Order processed successfully");
    return new Response(
      JSON.stringify({ success: true, message: "Order processed successfully" }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (error) {
    console.error("Error in processOrder:", error);
    throw error;
  }
}

async function cleanupReservations(supabase: any) {
  console.log("Starting cleanup of expired reservations");
  
  try {
    const { error } = await supabase.rpc('cleanup_expired_reservations');
    
    if (error) {
      console.error("Error in cleanup:", error);
      throw new Error(`Cleanup error: ${error.message}`);
    }

    console.log("Cleanup completed successfully");
    return new Response(
      JSON.stringify({ success: true, message: "Cleanup completed" }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (error) {
    console.error("Error in cleanupReservations:", error);
    throw error;
  }
}

async function getAlerts(supabase: any) {
  console.log("Fetching inventory alerts");
  
  try {
    const { data, error } = await supabase
      .from('inventory_alerts')
      .select(`
        *,
        products (name, sku),
        product_variations (variation_type, variation_value)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching alerts:", error);
      throw new Error(`Error fetching alerts: ${error.message}`);
    }

    console.log(`Found ${data?.length || 0} active alerts`);
    return new Response(
      JSON.stringify({ success: true, alerts: data }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (error) {
    console.error("Error in getAlerts:", error);
    throw error;
  }
}

serve(handler);
