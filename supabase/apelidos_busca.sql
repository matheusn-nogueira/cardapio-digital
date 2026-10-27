-- Apelidos da busca do site (27/10/2026): palavras que o cliente usa e que não estão no nome.
-- Vão para products.tags (etiquetas, editáveis no ERP em Produtos; o sync da planilha não mexe),
-- que a view cardapio_vw_produtos junta em "apelidos". Só acrescenta: não tira etiqueta de ninguém.
-- Idempotente: rodar de novo depois de cadastrar produto novo aplica as mesmas regras a ele.
-- O que já funciona sem etiqueta (a busca acha pedaço de palavra e erro de digitação):
-- "refri" (Refrigerante), "coca", "energetico", "wisky", "heinekem".
-- Aplicar: python3 -I scripts/sql-supabase.py supabase/apelidos_busca.sql

WITH regras(padrao_nome, categorias, etiquetas) AS (
  VALUES
    -- cerveja (algumas estão com a marca no lugar da categoria)
    (NULL, ARRAY['cerveja', 'cervejas', 'império', 'corona', 'brahma', 'petra', 'estrella galicia'], ARRAY['cerveja', 'breja']),
    ('\mlata\M.*\m(2[67]\d|35\d)\s*ml', NULL, ARRAY['latinha']),
    ('litr[aã]o', NULL, ARRAY['litrao', '1 litro']),
    ('^(amstel|heineken|império lager|spaten|brahma|skol|antarctica|budweiser|original|stella).*\m600\s*ml', NULL, ARRAY['garrafa', 'garrafa 600']),
    ('cracudinha', NULL, ARRAY['garrafinha']),
    ('long neck', NULL, ARRAY['longneck']),
    ('\m2l\M', NULL, ARRAY['2 litros']),
    ('\m1,5l\M', NULL, ARRAY['1,5 litro']),
    ('^guaravit', NULL, ARRAY['guarana']),
    ('gal[aã]o 20l', NULL, ARRAY['garrafao']),
    ('^água crystal (500ml|1,5l)$', NULL, ARRAY['agua sem gas', 'agua mineral']),
    ('^gelo de ', NULL, ARRAY['gelo saborizado', 'gelo de fruta']),
    ('^carv[aã]o', NULL, ARRAY['churrasco']),
    ('^cacha[cç]a', NULL, ARRAY['pinga', 'cana']),
    ('^whisky', NULL, ARRAY['uisque', 'whiskey']),
    ('red bull', NULL, ARRAY['redbull']),
    (NULL, ARRAY['drinks prontos'], ARRAY['drink', 'bebida pronta']),
    ('^beats', NULL, ARRAY['skol beats']),
    ('^cigarro (?!varejo)', NULL, ARRAY['maco', 'carteira']),
    ('^cigarro varejo', NULL, ARRAY['avulso', 'solto', 'unidade']),
    ('^espumante', NULL, ARRAY['champanhe', 'champagne'])
), novas AS (
  SELECT p.id, array_agg(DISTINCT e) AS etiquetas
    FROM products p
    JOIN regras r
      ON (r.padrao_nome IS NULL OR p.name ~* r.padrao_nome)
     AND (r.categorias IS NULL OR lower(p.category) = ANY (r.categorias))
    CROSS JOIN LATERAL unnest(r.etiquetas) e
   WHERE p.active
   GROUP BY p.id
)
UPDATE products p
   SET tags = p.tags || ARRAY(SELECT e FROM unnest(n.etiquetas) e WHERE NOT e = ANY (p.tags) ORDER BY e)
  FROM novas n
 WHERE n.id = p.id
   AND EXISTS (SELECT 1 FROM unnest(n.etiquetas) e WHERE NOT e = ANY (p.tags))
RETURNING p.name, p.tags;
