-- Add new fields to banners table for description, tips, and information
ALTER TABLE public.banners 
ADD COLUMN description TEXT,
ADD COLUMN tips TEXT,
ADD COLUMN information TEXT;