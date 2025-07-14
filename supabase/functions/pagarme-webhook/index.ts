import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    console.log('Webhook received:', {
      type: webhookData.type,
      transactionId: webhookData.data?.id,
      status: webhookData.data?.status
    });

    // Verify webhook signature (recommended for production)
    // const signature = req.headers.get('x-hub-signature-256');
    // TODO: Implement signature verification for security

    // Handle different webhook events
    switch (webhookData.type) {
      case 'transaction.status_changed':
        await handleTransactionStatusChanged(supabase, webhookData.data);
        break;
      case 'transaction.created':
        console.log('Transaction created:', webhookData.data.id);
        break;
      default:
        console.log('Unhandled webhook type:', webhookData.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function handleTransactionStatusChanged(supabase: any, transactionData: any) {
  const transactionId = transactionData.id;
  const newStatus = transactionData.status;
  
  console.log(`Transaction ${transactionId} status changed to: ${newStatus}`);

  // Find the payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*, orders(*)')
    .eq('pagarme_transaction_id', transactionId)
    .single();

  if (paymentError || !payment) {
    console.error('Payment not found for transaction:', transactionId);
    return;
  }

  // Update payment status
  const updateData: any = { status: newStatus };
  
  if (newStatus === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  await supabase
    .from('payments')
    .update(updateData)
    .eq('pagarme_transaction_id', transactionId);

  // Update order status based on payment status
  let orderStatus = 'pending';
  let paymentStatus = newStatus;

  switch (newStatus) {
    case 'paid':
      orderStatus = 'confirmed';
      paymentStatus = 'paid';
      break;
    case 'failed':
    case 'refused':
      orderStatus = 'cancelled';
      paymentStatus = 'failed';
      break;
    case 'canceled':
      orderStatus = 'cancelled';
      paymentStatus = 'cancelled';
      break;
    case 'refunded':
      orderStatus = 'refunded';
      paymentStatus = 'refunded';
      break;
    case 'pending':
      orderStatus = 'pending';
      paymentStatus = 'pending';
      break;
    case 'processing':
      orderStatus = 'processing';
      paymentStatus = 'processing';
      break;
  }

  await supabase
    .from('orders')
    .update({
      status: orderStatus,
      payment_status: paymentStatus
    })
    .eq('id', payment.order_id);

  console.log(`Order ${payment.order_id} updated - Status: ${orderStatus}, Payment: ${paymentStatus}`);

  // TODO: Send email notification to customer based on status
  // TODO: Update inventory if payment is confirmed
  // TODO: Trigger shipping process if payment is confirmed
}