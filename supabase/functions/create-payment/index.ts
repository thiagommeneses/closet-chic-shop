import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  customerData: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
  };
  addressData: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  paymentData: {
    method: 'credit_card' | 'boleto' | 'pix';
    cardNumber?: string;
    cardName?: string;
    cardExpiry?: string;
    cardCvv?: string;
    installments?: number;
  };
  cartItems: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
  shippingCost: number;
  totalAmount: number;
}

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

    const requestData: PaymentRequest = await req.json();
    console.log('Payment request received:', { 
      method: requestData.paymentData.method, 
      amount: requestData.totalAmount 
    });

    // Calculate amount in cents
    const amountInCents = Math.round(requestData.totalAmount * 100);

    // Create or get customer
    let customer;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', requestData.customerData.email)
      .single();

    if (existingCustomer) {
      customer = existingCustomer;
      // Update customer data
      await supabase
        .from('customers')
        .update({
          name: requestData.customerData.name,
          phone: requestData.customerData.phone,
          cpf: requestData.customerData.cpf
        })
        .eq('id', customer.id);
    } else {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          name: requestData.customerData.name,
          email: requestData.customerData.email,
          phone: requestData.customerData.phone,
          cpf: requestData.customerData.cpf
        })
        .select()
        .single();
      customer = newCustomer;
    }

    // Create order
    const { data: order } = await supabase
      .from('orders')
      .insert({
        customer_name: requestData.customerData.name,
        customer_email: requestData.customerData.email,
        customer_phone: requestData.customerData.phone,
        shipping_address: requestData.addressData,
        items: requestData.cartItems,
        subtotal: requestData.totalAmount - requestData.shippingCost,
        shipping_cost: requestData.shippingCost,
        total: requestData.totalAmount,
        payment_method: requestData.paymentData.method,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();

    console.log('Order created:', order?.id);

    // Prepare Pagar.me request
    const pagarmeApiKey = Deno.env.get('PAGARME_SECRET_KEY');
    if (!pagarmeApiKey) {
      throw new Error('Pagar.me API key not configured');
    }

    const pagarmeRequestBody: any = {
      amount: amountInCents,
      payment_method: requestData.paymentData.method,
      customer: {
        external_id: customer.id,
        name: requestData.customerData.name,
        email: requestData.customerData.email,
        type: 'individual',
        country: 'br',
        documents: [
          {
            type: 'cpf',
            number: requestData.customerData.cpf.replace(/\D/g, '')
          }
        ],
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: requestData.customerData.phone.replace(/\D/g, '').substring(0, 2),
            number: requestData.customerData.phone.replace(/\D/g, '').substring(2)
          }
        }
      },
      billing: {
        name: requestData.customerData.name,
        address: {
          country: 'br',
          state: requestData.addressData.state,
          city: requestData.addressData.city,
          neighborhood: requestData.addressData.neighborhood,
          street: requestData.addressData.street,
          street_number: requestData.addressData.number,
          zipcode: requestData.addressData.cep.replace(/\D/g, ''),
          ...(requestData.addressData.complement && { complement: requestData.addressData.complement })
        }
      },
      shipping: {
        name: requestData.customerData.name,
        fee: Math.round(requestData.shippingCost * 100),
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        expedited: false,
        address: {
          country: 'br',
          state: requestData.addressData.state,
          city: requestData.addressData.city,
          neighborhood: requestData.addressData.neighborhood,
          street: requestData.addressData.street,
          street_number: requestData.addressData.number,
          zipcode: requestData.addressData.cep.replace(/\D/g, ''),
          ...(requestData.addressData.complement && { complement: requestData.addressData.complement })
        }
      },
      items: requestData.cartItems.map(item => ({
        id: item.id.toString(),
        title: item.name,
        unit_price: Math.round(item.price * 100),
        quantity: item.quantity,
        tangible: true
      })),
      metadata: {
        order_id: order?.id
      }
    };

    // Configure payment method specific data
    if (requestData.paymentData.method === 'credit_card') {
      pagarmeRequestBody.card = {
        number: requestData.paymentData.cardNumber?.replace(/\s/g, ''),
        holder_name: requestData.paymentData.cardName,
        exp_month: requestData.paymentData.cardExpiry?.split('/')[0],
        exp_year: `20${requestData.paymentData.cardExpiry?.split('/')[1]}`,
        cvv: requestData.paymentData.cardCvv
      };
      pagarmeRequestBody.installments = requestData.paymentData.installments || 1;
      pagarmeRequestBody.capture = true; // Auto-capture
      pagarmeRequestBody.antifraud_enabled = true; // Enable fraud detection
    } else if (requestData.paymentData.method === 'boleto') {
      pagarmeRequestBody.boleto = {
        expires_in: 3, // 3 days
        instructions: 'Pagar até o vencimento'
      };
    }

    console.log('Sending request to Pagar.me...');

    // Make request to Pagar.me
    const pagarmeResponse = await fetch('https://api.pagar.me/core/v5/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(pagarmeApiKey + ':')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(pagarmeRequestBody)
    });

    const pagarmeData = await pagarmeResponse.json();
    console.log('Pagar.me response:', { 
      status: pagarmeResponse.status, 
      transactionId: pagarmeData.id,
      paymentStatus: pagarmeData.status 
    });

    if (!pagarmeResponse.ok) {
      console.error('Pagar.me error:', pagarmeData);
      throw new Error(`Pagar.me API error: ${pagarmeData.message || 'Unknown error'}`);
    }

    // Create payment record
    const paymentRecord: any = {
      order_id: order?.id,
      customer_id: customer.id,
      pagarme_transaction_id: pagarmeData.id,
      payment_method: requestData.paymentData.method,
      amount: amountInCents,
      status: pagarmeData.status,
      installments: requestData.paymentData.installments || 1
    };

    // Add payment method specific data
    if (requestData.paymentData.method === 'credit_card' && pagarmeData.card) {
      paymentRecord.card_last_digits = pagarmeData.card.last_digits;
      paymentRecord.card_brand = pagarmeData.card.brand;
    } else if (requestData.paymentData.method === 'boleto' && pagarmeData.boleto) {
      paymentRecord.boleto_url = pagarmeData.boleto.url;
      paymentRecord.boleto_barcode = pagarmeData.boleto.barcode;
    } else if (requestData.paymentData.method === 'pix' && pagarmeData.pix) {
      paymentRecord.pix_qr_code = pagarmeData.pix.qr_code;
      paymentRecord.pix_qr_code_url = pagarmeData.pix.qr_code_url;
    }

    if (pagarmeData.status === 'paid') {
      paymentRecord.paid_at = new Date().toISOString();
    }

    await supabase
      .from('payments')
      .insert(paymentRecord);

    // Update order status
    const orderStatus = pagarmeData.status === 'paid' ? 'confirmed' : 'pending';
    await supabase
      .from('orders')
      .update({ 
        status: orderStatus,
        payment_status: pagarmeData.status 
      })
      .eq('id', order?.id);

    // Update customer with Pagar.me customer ID if available
    if (pagarmeData.customer?.id && !customer.pagarme_customer_id) {
      await supabase
        .from('customers')
        .update({ pagarme_customer_id: pagarmeData.customer.id })
        .eq('id', customer.id);
    }

    // Return response based on payment method
    let responseData: any = {
      success: true,
      transaction_id: pagarmeData.id,
      order_id: order?.id,
      status: pagarmeData.status,
      amount: requestData.totalAmount
    };

    if (requestData.paymentData.method === 'boleto') {
      responseData.boleto = {
        url: pagarmeData.boleto?.url,
        barcode: pagarmeData.boleto?.barcode,
        expires_at: pagarmeData.boleto?.expires_at
      };
    } else if (requestData.paymentData.method === 'pix') {
      responseData.pix = {
        qr_code: pagarmeData.pix?.qr_code,
        qr_code_url: pagarmeData.pix?.qr_code_url
      };
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});