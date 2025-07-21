-- Fix variation_id column in cart_reservations table to properly handle NULL values
-- Remove any problematic records first
DELETE FROM cart_reservations WHERE variation_id::text = 'null' OR variation_id::text = 'undefined';

-- Clean up any expired reservations
DELETE FROM cart_reservations WHERE expires_at < now();