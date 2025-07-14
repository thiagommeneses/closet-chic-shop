-- Update the superadmin email to thiagomm@icloud.com
-- First update the auth.users table
UPDATE auth.users 
SET email = 'thiagomm@icloud.com'
WHERE id = '46360019-1048-4a4c-b029-675b964f0db4';

-- The admin_users table should already be correct since it references the user_id