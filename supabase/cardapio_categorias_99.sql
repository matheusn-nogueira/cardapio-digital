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
    ('Michelob Ultra', '🍺', ARRAY['Cerveja'], '{"nome": "^michelob"}'::jsonb),
    ('Outras Cervejas', '🍺', ARRAY['Cerveja'],
      '{"excluir_nome": "^(imp[eé]rio|brahma|antarctica|heineken|amstel|stella|budweiser|coron|spaten|skol|michelob)"}'::jsonb),
    ('Whisky', '🥃', ARRAY['Whisky'], NULL),
    ('Gin', '🍸', ARRAY['Gin'], NULL),
    ('Vodka e Cachaça', '🍶', ARRAY['Vodka', 'Cachaça'], NULL),
    ('Licores e Conhaque', '🥃', ARRAY['Licor', 'Conhaque'], NULL)
  ) AS v(nome, icone, cats, filtro)
 WHERE NOT EXISTS (SELECT 1 FROM cardapio_categorias c WHERE c.nome = v.nome);

-- Outras Cervejas criada antes da Michelob Ultra: tirar a Michelob dela também
UPDATE cardapio_categorias
   SET filtro = '{"excluir_nome": "^(imp[eé]rio|brahma|antarctica|heineken|amstel|stella|budweiser|coron|spaten|skol|michelob)"}'::jsonb
 WHERE nome = 'Outras Cervejas';

-- ordem final: a mesma definida para o 99 em 22/10 (baseada no que mais sai no MenuDino).
-- Promoções; marcas que mais vendem; demais marcas; Ultra e Sem Álcool; Gelo e Carvão
-- (complemento da cerveja); destilados e vinhos; Energéticos logo depois (quem leva
-- destilado leva energético); refrigerantes e águas; Bomboniere por impulso no fim.
-- Cervejas e Destilados (as gerais, que o 99 não tem) ficam no fim do seu grupo.
UPDATE cardapio_categorias c SET ordem = o.ordem
  FROM (VALUES
    ('Promoções Geladas', 1),
    ('Império', 2), ('Amstel', 3), ('Heineken', 4), ('Brahma', 5), ('Antarctica', 6),
    ('Spaten', 7), ('Budweiser', 8), ('Stella Artois', 9), ('Corona', 10), ('Skol', 11),
    ('Michelob Ultra', 12), ('Outras Cervejas', 13), ('Cervejas', 14),
    ('Cervejas Ultra', 15), ('Cervejas Sem Álcool', 16),
    ('Gelo e Carvão', 17),
    ('Drinks Prontos', 18), ('Whisky', 19), ('Gin', 20), ('Vodka e Cachaça', 21),
    ('Licores e Conhaque', 22), ('Destilados', 23), ('Vinhos e Espumantes', 24),
    ('Energéticos e Isotônicos', 25), ('Refrigerantes', 26), ('Águas, Sucos e Chás', 27),
    ('Bomboniere', 28), ('Tabacaria', 29), ('Churrasco', 99)
  ) AS o(nome, ordem)
 WHERE c.nome = o.nome;
