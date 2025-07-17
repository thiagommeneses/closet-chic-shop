-- Sincronizar categorias existentes com o menu
INSERT INTO public.menu_items (name, link, position, active, is_category, category_id)
SELECT 
    c.name,
    '/categoria/' || c.slug,
    100 + row_number() OVER (ORDER BY c.name),
    true,
    true,
    c.id
FROM categories c
WHERE c.id NOT IN (
    SELECT category_id 
    FROM menu_items 
    WHERE category_id IS NOT NULL
);