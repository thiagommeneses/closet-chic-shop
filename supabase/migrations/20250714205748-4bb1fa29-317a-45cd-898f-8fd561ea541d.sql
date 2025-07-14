-- Remove the online setup by adding superadmin directly
-- This will create the admin user manually in the database

-- First, insert the user directly into auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  last_sign_in_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES (
  '46360019-1048-4a4c-b029-675b964f0db4'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'pixmeyou@gmail.com',
  crypt('Tmm@2025', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  now(),
  null,
  null,
  '',
  '',
  '',
  0,
  null,
  '',
  null,
  false,
  null,
  false
) ON CONFLICT (id) DO NOTHING;

-- Then add this user to admin_users table
INSERT INTO public.admin_users (user_id, role, active)
VALUES ('46360019-1048-4a4c-b029-675b964f0db4'::uuid, 'admin', true)
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'admin',
  active = true,
  created_at = now();