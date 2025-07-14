-- Adicionar campos de peso e dimensões aos produtos para cálculo de frete
ALTER TABLE products 
ADD COLUMN weight_grams INTEGER DEFAULT 500,
ADD COLUMN length_cm INTEGER DEFAULT 20,
ADD COLUMN height_cm INTEGER DEFAULT 10,
ADD COLUMN width_cm INTEGER DEFAULT 15;

-- Comentar as colunas
COMMENT ON COLUMN products.weight_grams IS 'Peso do produto em gramas';
COMMENT ON COLUMN products.length_cm IS 'Comprimento do produto em centímetros';
COMMENT ON COLUMN products.height_cm IS 'Altura do produto em centímetros';
COMMENT ON COLUMN products.width_cm IS 'Largura do produto em centímetros';

-- Atualizar produtos existentes com dimensões estimadas
UPDATE products 
SET 
  weight_grams = 400,
  length_cm = 25,
  height_cm = 8,
  width_cm = 20
WHERE name LIKE '%Blusa%';

UPDATE products 
SET 
  weight_grams = 600,
  length_cm = 30,
  height_cm = 12,
  width_cm = 25
WHERE name LIKE '%Vestido%';

UPDATE products 
SET 
  weight_grams = 800,
  length_cm = 35,
  height_cm = 15,
  width_cm = 30
WHERE name LIKE '%Jaqueta%';

UPDATE products 
SET 
  weight_grams = 350,
  length_cm = 22,
  height_cm = 6,
  width_cm = 18
WHERE name LIKE '%Saia%';