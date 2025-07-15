-- Inserir templates padrão para detalhes de produtos
INSERT INTO product_details_templates (name, type, content, active) VALUES
(
  'Guia de Medidas - Roupas Femininas',
  'size_guide',
  '{"text": "P - Busto: 84-88cm, Cintura: 64-68cm, Quadril: 90-94cm\nM - Busto: 88-92cm, Cintura: 68-72cm, Quadril: 94-98cm\nG - Busto: 92-96cm, Cintura: 72-76cm, Quadril: 98-102cm\nGG - Busto: 96-100cm, Cintura: 76-80cm, Quadril: 102-106cm\n\nComo tirar suas medidas:\n• Busto: Meça na parte mais larga do busto\n• Cintura: Meça na parte mais fina da cintura\n• Quadril: Meça na parte mais larga do quadril\n\nDica: Use uma fita métrica e mantenha o corpo relaxado durante as medições."}',
  true
),
(
  'Composição - Algodão',
  'composition',
  '{"text": "95% Algodão\n5% Elastano\n\nTecido: Jersey\nPeso: 180g/m²\nOrigemBrasil\n\nCaracterísticas:\n• Tecido macio e confortável\n• Boa elasticidade\n• Respirável\n• Fácil de cuidar"}',
  true
),
(
  'Cuidados Básicos',
  'care_instructions',
  '{"text": "• Lavar à máquina em água fria (até 30°C)\n• Não usar alvejante\n• Secar à sombra\n• Passar com ferro morno\n• Não usar secadora\n• Lavar com cores similares\n\nDicas importantes:\n• Vire a peça do avesso antes de lavar\n• Não torça a peça ao escorrer\n• Evite exposição direta ao sol\n• Guarde em local seco e arejado"}',
  true
)
ON CONFLICT (name) DO NOTHING;