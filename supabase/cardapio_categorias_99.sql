-- Categorias do cardápio na lógica do 99Food/iFood (25/10/2026): promoções, sem
-- álcool, ultra, cerveja por marca, destilados por tipo. Para isso a categoria
-- ganha um filtro opcional, aplicado pelo site sobre os produtos que já casam com
-- categorias_produto:
--   {"promo": true}            só produtos com oferta "[Promo]"
--   {"nome": "regex"}          nome do produto casa com a regex (sem diferenciar maiúsculas)
--   {"excluir_nome": "regex"}  nome do produto NÃO casa com a regex
ALTER TABLE cardapio_categorias ADD COLUMN IF NOT EXISTS filtro jsonb;

-- ajustes nas que já existem (sem apagar nada)
UPDATE cardapio_categorias SET nome = 'Gelo e Carvão', categorias_produto = ARRAY['Gelo', 'Carvão'] WHERE nome = 'Gelo';
UPDATE cardapio_categorias SET ativo = false WHERE nome = 'Churrasco';
UPDATE cardapio_categorias SET nome = 'Energéticos e Isotônicos' WHERE nome = 'Energéticos';

-- novas (idempotente: só cria se não existir pelo nome)
INSERT INTO cardapio_categorias (nome, icone, cor_fundo, categorias_produto, filtro, ordem, ativo)
SELECT v.nome, v.icone, '#F4F4F4', v.cats, v.filtro, 0, true
  FROM (VALUES
    ('Promoções Geladas', '🔥', ARRAY['Cerveja'], '{"promo": true}'::jsonb),
    ('Cervejas Sem Álcool', '🍺', ARRAY['Cerveja'], '{"nome": "zero|sem [aá]lcool|0[.,]0"}'::jsonb),
    ('Cervejas Ultra', '🍺', ARRAY['Cerveja'], '{"nome": "ultra"}'::jsonb),
    ('Império', '🍺', ARRAY['Cerveja'], '{"nome": "^imp[eé]rio"}'::jsonb),
    ('Brahma', '🍺', ARRAY['Cerveja'], '{"nome": "^brahma"}'::jsonb),
    ('Antarctica', '🍺', ARRAY['Cerveja'], '{"nome": "^antarctica"}'::jsonb),
    ('Heineken', '🍺', ARRAY['Cerveja'], '{"nome": "^heineken"}'::jsonb),
    ('Amstel', '🍺', ARRAY['Cerveja'], '{"nome": "^amstel"}'::jsonb),
    ('Stella Artois', '🍺', ARRAY['Cerveja'], '{"nome": "^stella"}'::jsonb),
    ('Budweiser', '🍺', ARRAY['Cerveja'], '{"nome": "^budweiser"}'::jsonb),
    ('Corona', '🍺', ARRAY['Cerveja'], '{"nome": "^coron"}'::jsonb),
    ('Spaten', '🍺', ARRAY['Cerveja'], '{"nome": "^spaten"}'::jsonb),
    ('Skol', '🍺', ARRAY['Cerveja'], '{"nome": "^skol"}'::jsonb),
    ('Outras Cervejas', '🍺', ARRAY['Cerveja'],
      '{"excluir_nome": "^(imp[eé]rio|brahma|antarctica|heineken|amstel|stella|budweiser|coron|spaten|skol)"}'::jsonb),
    ('Whisky', '🥃', ARRAY['Whisky'], NULL),
    ('Gin', '🍸', ARRAY['Gin'], NULL),
    ('Vodka e Cachaça', '🍶', ARRAY['Vodka', 'Cachaça'], NULL),
    ('Licores e Conhaque', '🥃', ARRAY['Licor', 'Conhaque'], NULL)
  ) AS v(nome, icone, cats, filtro)
 WHERE NOT EXISTS (SELECT 1 FROM cardapio_categorias c WHERE c.nome = v.nome);

-- ordem final (a mesma do 99: promoções e cervejas primeiro)
UPDATE cardapio_categorias c SET ordem = o.ordem
  FROM (VALUES
    ('Promoções Geladas', 1), ('Cervejas', 2), ('Cervejas Sem Álcool', 3), ('Cervejas Ultra', 4),
    ('Império', 5), ('Brahma', 6), ('Antarctica', 7), ('Heineken', 8), ('Amstel', 9),
    ('Stella Artois', 10), ('Budweiser', 11), ('Corona', 12), ('Spaten', 13), ('Skol', 14),
    ('Outras Cervejas', 15), ('Gelo e Carvão', 16), ('Drinks Prontos', 17), ('Destilados', 18),
    ('Whisky', 19), ('Gin', 20), ('Vodka e Cachaça', 21), ('Licores e Conhaque', 22),
    ('Vinhos e Espumantes', 23), ('Refrigerantes', 24), ('Energéticos e Isotônicos', 25),
    ('Águas, Sucos e Chás', 26), ('Bomboniere', 27), ('Tabacaria', 28), ('Churrasco', 99)
  ) AS o(nome, ordem)
 WHERE c.nome = o.nome;
