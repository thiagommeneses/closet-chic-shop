import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if any admin already exists
    const { data: hasAdmin, error: checkError } = await supabaseAdmin.rpc('has_any_admin');
    
    if (checkError) {
      console.error("Error checking admin existence:", checkError);
      throw new Error(`Failed to check admin existence: ${checkError.message}`);
    }
    
    if (hasAdmin) {
      return new Response(JSON.stringify({ 
        error: "Admin user already exists" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create the user
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError) {
      throw createError;
    }

    if (!user.user) {
      throw new Error("Failed to create user");
    }

    // Make the user admin
    await supabaseAdmin.rpc('make_user_admin', { user_email: email });

    return new Response(JSON.stringify({ 
      success: true,
      message: "First admin user created successfully",
      email: email
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating first admin:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});