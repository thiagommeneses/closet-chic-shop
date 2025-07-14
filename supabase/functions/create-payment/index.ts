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
    console.log('=== PAYMENT REQUEST START ===');
    console.log('Payment request received:', { 
      method: requestData.paymentData.method, 
      amount: requestData.totalAmount,
      customerName: requestData.customerData.name,
      customerEmail: requestData.customerData.email
    });
    console.log('Request data structure:', {
      hasCustomerData: !!requestData.customerData,
      hasAddressData: !!requestData.addressData,
      hasPaymentData: !!requestData.paymentData,
      hasCartItems: !!requestData.cartItems && requestData.cartItems.length > 0
    });

    // Validate required fields
    console.log('=== VALIDATION START ===');
    if (!requestData.customerData?.name || !requestData.customerData?.email) {
      console.log('Customer data validation failed:', requestData.customerData);
      throw new Error('Dados do cliente incompletos');
    }

    if (!requestData.addressData?.cep || !requestData.addressData?.street || !requestData.addressData?.state) {
      console.log('Address data validation failed:', requestData.addressData);
      throw new Error('Dados de endereço incompletos');
    }

    if (requestData.paymentData.method === 'credit_card') {
      if (!requestData.paymentData.cardNumber || !requestData.paymentData.cardName || 
          !requestData.paymentData.cardExpiry || !requestData.paymentData.cardCvv) {
        console.log('Card data validation failed:', {
          hasCardNumber: !!requestData.paymentData.cardNumber,
          hasCardName: !!requestData.paymentData.cardName,
          hasCardExpiry: !!requestData.paymentData.cardExpiry,
          hasCardCvv: !!requestData.paymentData.cardCvv
        });
        throw new Error('Dados do cartão incompletos');
      }
    }

    if (!requestData.cartItems || requestData.cartItems.length === 0) {
      console.log('Cart items validation failed:', requestData.cartItems);
      throw new Error('Carrinho vazio');
    }

    console.log('=== VALIDATION PASSED ===');

    // Calculate amount in cents
    const amountInCents = Math.round(requestData.totalAmount * 100);
    console.log('Amount in cents:', amountInCents);

    // Create or get customer
    console.log('=== CUSTOMER LOOKUP START ===');
    let customer;
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', requestData.customerData.email)
      .maybeSingle();

    if (customerError) {
      console.log('Customer lookup error:', customerError);
      throw new Error('Erro ao buscar cliente: ' + customerError.message);
    }

    if (existingCustomer) {
      console.log('Found existing customer:', existingCustomer.id);
      customer = existingCustomer;
      // Update customer data
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          name: requestData.customerData.name,
          phone: requestData.customerData.phone,
          cpf: requestData.customerData.cpf
        })
        .eq('id', customer.id);
      
      if (updateError) {
        console.log('Customer update error:', updateError);
        throw new Error('Erro ao atualizar cliente: ' + updateError.message);
      }
    } else {
      console.log('Creating new customer');
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          name: requestData.customerData.name,
          email: requestData.customerData.email,
          phone: requestData.customerData.phone,
          cpf: requestData.customerData.cpf
        })
        .select()
        .single();
      
      if (insertError) {
        console.log('Customer insert error:', insertError);
        throw new Error('Erro ao criar cliente: ' + insertError.message);
      }
      customer = newCustomer;
    }
    console.log('Customer operation completed:', customer?.id);

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
        phone_numbers: [`+55${requestData.customerData.phone.replace(/\D/g, '')}`]
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
          ...(requestData.addressData.complement && { complementary: requestData.addressData.complement })
        }
      },
      shipping: {
        name: requestData.customerData.name,
        fee: Math.round(requestData.shippingCost * 100),
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expedited: false,
        address: {
          country: 'br',
          state: requestData.addressData.state,
          city: requestData.addressData.city,
          neighborhood: requestData.addressData.neighborhood,
          street: requestData.addressData.street,
          street_number: requestData.addressData.number,
          zipcode: requestData.addressData.cep.replace(/\D/g, ''),
          ...(requestData.addressData.complement && { complementary: requestData.addressData.complement })
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

    // Make request to Pagar.me - Using correct API v1 endpoint
    const pagarmeResponse = await fetch('https://api.pagar.me/1/transactions', {
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
      console.error('Pagar.me error details:', {
        status: pagarmeResponse.status,
        response: pagarmeData,
        requestBody: pagarmeRequestBody
      });
      
      // Get more specific error message
      let errorMessage = 'Erro no processamento do pagamento';
      if (pagarmeData.errors && Array.isArray(pagarmeData.errors)) {
        errorMessage = pagarmeData.errors.map((err: any) => err.message).join(', ');
      } else if (pagarmeData.message) {
        errorMessage = pagarmeData.message;
      }
      
      throw new Error(errorMessage);
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
    console.error('Payment processing error:', {
      error: error.message,
      stack: error.stack
    });
    
    // Return more detailed error information
    let errorMessage = 'Erro interno do servidor';
    if (error.message) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: errorMessage,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400, // Changed to 400 for client errors
      }
    );
  }
});