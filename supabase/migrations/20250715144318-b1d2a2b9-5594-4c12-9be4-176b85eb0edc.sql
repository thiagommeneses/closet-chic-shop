-- Inserir templates padrão para detalhes de produtos
INSERT INTO product_details_templates (name, type, content, active) VALUES
(
  'Guia de Medidas - Roupas Femininas',
  'size_guide',
  'P - Busto: 84-88cm, Cintura: 64-68cm, Quadril: 90-94cm
M - Busto: 88-92cm, Cintura: 68-72cm, Quadril: 94-98cm
G - Busto: 92-96cm, Cintura: 72-76cm, Quadril: 98-102cm
GG - Busto: 96-100cm, Cintura: 76-80cm, Quadril: 102-106cm

Como tirar suas medidas:
• Busto: Meça na parte mais larga do busto
• Cintura: Meça na parte mais fina da cintura
• Quadril: Meça na parte mais larga do quadril

Dica: Use uma fita métrica e mantenha o corpo relaxado durante as medições.',
  true
),
(
  'Composição - Algodão',
  'composition',
  '95% Algodão
5% Elastano

Tecido: Jersey
Peso: 180g/m²
Origem: Brasil

Características:
• Tecido macio e confortável
• Boa elasticidade
• Respirável
• Fácil de cuidar',
  true
),
(
  'Cuidados Básicos',
  'care_instructions',
  '• Lavar à máquina em água fria (até 30°C)
• Não usar alvejante
• Secar à sombra
• Passar com ferro morno
• Não usar secadora
• Lavar com cores similares

Dicas importantes:
• Vire a peça do avesso antes de lavar
• Não torça a peça ao escorrer
• Evite exposição direta ao sol
• Guarde em local seco e arejado',
  true
)
ON CONFLICT (name) DO NOTHING;