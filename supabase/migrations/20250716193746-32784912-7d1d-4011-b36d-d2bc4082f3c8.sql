-- Adicionar colunas para controle de posicionamento e ajuste de imagem nos banners
ALTER TABLE public.banners 
ADD COLUMN image_position TEXT DEFAULT 'center',
ADD COLUMN image_fit TEXT DEFAULT 'cover';

-- Comentários para as novas colunas
COMMENT ON COLUMN public.banners.image_position IS 'Posição da imagem (center, top, bottom, left, right, top-left, top-right, bottom-left, bottom-right)';
COMMENT ON COLUMN public.banners.image_fit IS 'Modo de ajuste da imagem (cover, contain, fill)';