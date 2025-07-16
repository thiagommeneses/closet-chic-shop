-- Adicionar campos para imagens mobile e desktop, remover campos de descrição, dicas e informações
ALTER TABLE public.banners 
ADD COLUMN mobile_image_url TEXT,
ADD COLUMN desktop_image_url TEXT,
DROP COLUMN description,
DROP COLUMN tips,
DROP COLUMN information;

-- Migrar dados existentes de image_url para desktop_image_url
UPDATE public.banners 
SET desktop_image_url = image_url 
WHERE image_url IS NOT NULL;

-- Remover a coluna image_url antiga
ALTER TABLE public.banners DROP COLUMN image_url;