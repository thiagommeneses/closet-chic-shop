-- Create the first admin user
-- This will create an admin user with email: admin@closetcollection.com
-- You'll need to sign up with this email first, then this will make them admin

-- Insert initial admin user (replace with actual user_id after signup)
-- For now, we'll create a function to easily add admin users

CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record auth.users%ROWTYPE;
BEGIN
    -- Find the user by email
    SELECT * INTO user_record
    FROM auth.users
    WHERE email = user_email;
    
    IF user_record.id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Insert or update admin user record
    INSERT INTO public.admin_users (user_id, role, active)
    VALUES (user_record.id, 'admin', true)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'admin',
        active = true,
        created_at = now();
        
    RAISE NOTICE 'User % is now an admin', user_email;
END;
$$;

-- Create a helper function to check if any admin exists
CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE active = true
    );
$$;