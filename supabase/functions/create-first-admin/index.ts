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
    console.log("Received request to create admin:", { email: email, passwordLength: password?.length });

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
    console.log("Checking if any admin exists...");
    const { data: hasAdmin, error: checkError } = await supabaseAdmin.rpc('has_any_admin');
    console.log("has_any_admin result:", { hasAdmin, checkError });
    
    if (checkError) {
      console.error("Error checking admin existence:", checkError);
      throw new Error(`Failed to check admin existence: ${checkError.message}`);
    }
    
    if (hasAdmin) {
      console.log("Admin already exists, returning error");
      return new Response(JSON.stringify({ 
        error: "Admin user already exists" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create the user
    console.log("Creating user with email:", email);
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    console.log("User creation result:", { user: user?.user?.id, createError });

    if (createError) {
      console.error("Error creating user:", createError);
      throw createError;
    }

    if (!user.user) {
      throw new Error("Failed to create user");
    }

    // Make the user admin
    console.log("Making user admin:", user.user.id);
    const { error: adminError } = await supabaseAdmin.rpc('make_user_admin', { user_email: email });
    console.log("make_user_admin result:", { adminError });

    if (adminError) {
      console.error("Error making user admin:", adminError);
      throw new Error(`Failed to make user admin: ${adminError.message}`);
    }

    // Double-check that admin was created successfully
    const { data: verifyAdmin, error: verifyError } = await supabaseAdmin.rpc('has_any_admin');
    console.log("Admin verification result:", { verifyAdmin, verifyError });

    if (verifyError || !verifyAdmin) {
      console.error("Failed to verify admin creation");
      throw new Error("Failed to verify admin creation");
    }

    console.log("First admin created and verified successfully");
    return new Response(JSON.stringify({ 
      success: true,
      message: "First admin user created successfully",
      email: email,
      admin_verified: true
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