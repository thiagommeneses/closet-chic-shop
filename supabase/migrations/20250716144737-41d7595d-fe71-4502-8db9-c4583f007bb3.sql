-- Update banners with the correct image URLs from the uploaded images
UPDATE public.banners 
SET image_url = '/lovable-uploads/18b235f7-5cf7-4c6e-8614-ce9b2f53257d.png'
WHERE name = 'Banner Principal 1';

UPDATE public.banners 
SET image_url = '/lovable-uploads/2cd1e79a-d1c4-4393-816d-5983de4e9742.png'
WHERE name = 'Banner Principal 2';

UPDATE public.banners 
SET image_url = '/lovable-uploads/79efa178-ee6d-469c-84b7-5abebcd6fb95.png'
WHERE name = 'Banner Lateral 1';

UPDATE public.banners 
SET image_url = '/lovable-uploads/a021cb34-5392-4ef7-ba25-140fa97f9971.png'
WHERE name = 'Banner Lateral 2';