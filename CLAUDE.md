# Cardápio digital da Casa dos Fundos

Next.js 16 (App Router) + Tailwind 4, lendo o catálogo do Supabase do ERP (`erp-consumer-2.0`, projeto `dkbvmqnrdgnhiyhtgsjy`, views `cardapio_vw_*`). Visual copiado do **app** do Zé Delivery: topo branco, chips de categoria, cards chapados, títulos em frase com seta, barra de abas no rodapé. Produção: `https://cardapio.casadosfundos.cloud`.

## Comandos

- `npm run dev`: servidor local.
- `npm test`: testes dos módulos puros em `src/lib/__testes__` (`node --test`).
- `npx eslint src` e `npx tsc --noEmit`: rodar antes de commitar.
- `python3 -I scripts/sql-supabase.py <arquivo.sql>`: roda SQL no banco pela API de gestão do Supabase (token do `.env.local` do `pdv-balcao`, nunca impresso). `--completo` mostra o JSON inteiro da resposta. Serve tanto para aplicar os `.sql` de `supabase/` quanto para consultas avulsas (escrever o SQL num arquivo temporário).

## Commit e deploy

- Commit e push direto no `main`, sem pedir confirmação. Pode acumular mudanças relacionadas num commit só.
- O deploy é pelo EasyPanel (imagem do `Dockerfile`, serviço `casa-dos-fundos/cardapio-digital`). O painel **não** faz deploy sozinho no push. Depois do push, disparar e esperar com o script do PDV, que chama a API do painel e confere a página publicada:
  `python3 -u ~/Pessoal/pdv-balcao/scripts/deploy-easypanel.py cardapio-digital`
  O script carrega as credenciais do `.env.local` do `pdv-balcao` (nunca imprimir). Não há mais trava de horário (26/10/2026), mas o build do Next é pesado e roda no mesmo servidor do caixa: no pico da noite, publique depois do fechamento se não for urgente. Só dar push e deploy com testes, lint e tipos passando.
- O script confirma o deploy pela assinatura da home. Mudança que não altera a home (só `public/sw.js`, rota de API) faz ele esperar à toa: conferir com `curl` no arquivo mudado e parar o script.
- O cache do otimizador de imagens (`/app/.next/cache`) é o volume `cache-imagens` do serviço (26/10/2026): as fotos já reduzidas sobrevivem às publicações e o servidor não baixa o catálogo do Supabase de novo a cada deploy. O `Dockerfile` cria a pasta com o dono `nextjs`. Para limpar o cache, apague o volume no painel.
- Mudança só de banco (SQL, cadastro) não precisa de deploy: o site relê as views a cada 60 s (`REVALIDAR_SEGUNDOS`). Quando o código novo depende de coluna nova, aplicar o SQL que só **acrescenta** antes, ou subir o código tolerante (campo opcional) primeiro.
- Nunca rodar `npm run build` com o `npm run dev` aberto: os dois escrevem em `.next/` e o dev quebra. Parar o dev antes, ou reiniciá-lo depois.
- Mensagem de commit em pt-BR, no formato `tipo: resumo` (`feat:`, `fix:`), sem `Co-Authored-By`.
- Nunca commitar `.env*` (o `.env.local.example` fica fora do git de propósito) nem `supabase/.temp/`.

## Onde está cada coisa

- Leitura do catálogo no servidor: `src/lib/cardapio.ts` (normaliza home e produtos, `produtosDaCategoria`, foto da categoria e da marca, frete mínimo). Tipos em `src/lib/tipos.ts`.
- Estado no cliente: `src/context/` (cardápio e sacola) e `criarArmazem`/`useArmazem` em `src/lib/armazenamento.ts`, que guardam no `localStorage` com chaves `cdf:*` (sacola, endereço, último pedido, convites e pop-ups já vistos).
- Home (`src/app/page.tsx`): pop-ups de promoção, chips de categoria, carrossel único de banners (os do ERP mais o de instalar o app, passando a cada 5 s), status da loja, marcas, vitrines e, no fim, uma prateleira por categoria (até 10 produtos e a seta para a categoria), pulando as que já são vitrine. Peças fixas em todas as páginas ficam no `src/app/layout.tsx` (topo, barra de abas, sacola flutuante, convite de push, modal de produto, confirmação de idade).
- Componentes da loja em `src/components/loja/`; topo e abas em `src/components/layout/`; checkout em `src/components/checkout/`.
- Card de produto (`ProdutoCard`): o "+" (redondo, 36 px à vista e 44 px de toque) põe 1 un na sacola e vira contador sobre a foto, como no iFood (lixeira no 1, menos, quantidade, mais). Mexe só na versão padrão; produto com versão que muda o item (vasilhame) abre a ficha. Um selo só por card. O preço é o de 1 un (o que o "+" cobra); a oferta do pack vai na etiqueta verde da foto ("Leve 3: R$ 4,33/un."). O texto do card tem altura fixa (preço + nome em 2 linhas): não acrescente linha variável embaixo, senão as prateleiras ficam de alturas diferentes e o espaço entre elas varia.
- Ficha do produto (`ProdutoDetalhe` na folha `ProdutoModal`) enxuta como no Zé: foto pequena, preço da unidade na quantidade escolhida com o desconto, contador, atalhos +6/+12 e "Adicionar (N) • total". Descrição e tabela "Quanto mais, mais barato" só na página `/produto/[id]`.
- Pop-ups de promoção (`PopupPromo`), no máximo uma vez por dia cada: a lista da categoria 1,5 s depois de abrir a home (nunca na visita em que a pessoa acabou de confirmar a idade: dois modais seguidos na chegada), e a oferta especial (maior desconto em pack) quando a pessoa faz menção de sair (mouse pelo topo no computador; 45 s sem rolar nem tocar, com a sacola vazia, no celular).

## Categorias

- Vêm de `cardapio_categorias` no ERP (editáveis por lá): `categorias_produto` diz quais valores de `produto.categoria` entram, e `filtro` (jsonb, opcional) recorta dentro deles. Ver `supabase/cardapio_categorias_99.sql`.
  - `{"promo": true}`: só produtos com oferta "[Promo]".
  - `{"nome": "regex"}`: o nome do produto precisa casar (sem diferenciar maiúsculas).
  - `{"excluir_nome": "regex"}`: o nome do produto não pode casar.
  - Regex inválida no banco é ignorada, não derruba o cardápio.
- Mesmas categorias e mesma ordem do cardápio da loja no 99Food (definida em 22/10/2026 pelo que mais sai no MenuDino):
  - Promoções Geladas;
  - marcas que mais vendem: Império, Amstel, Heineken, Brahma, Antarctica;
  - demais marcas: Spaten, Budweiser, Stella Artois, Corona, Skol, Michelob Ultra, Outras Cervejas;
  - Cervejas (todas, que o 99 não tem), Ultra, Sem Álcool;
  - Gelo e Carvão, logo depois da cerveja, porque é o complemento dela;
  - Drinks Prontos, Whisky, Gin, Vodka e Cachaça, Licores e Conhaque, Destilados (todos), Vinhos e Espumantes;
  - Energéticos logo depois dos destilados, porque quem leva destilado leva energético; depois Refrigerantes e Águas;
  - Bomboniere (compra por impulso) e Tabacaria no fim.
- Cada marca filtra pelo começo do nome (`^brahma`), e Outras Cervejas usa `excluir_nome` com as marcas.
- Churrasco ficou desativada.
- Categoria sem produto não aparece.
- Mudou a ordem no 99? Atualizar o `UPDATE … ordem` do SQL e rodar de novo; ele é idempotente.
- Marca nova com categoria própria: inserir a linha com o filtro e acrescentar a marca ao `excluir_nome` de Outras Cervejas.
- Um produto aparece em várias categorias (Brahma e Cervejas). Para breadcrumb e "Peça também", vale a categoria sem filtro (`categoriaDoProduto` em `CardapioContext`).

## Marcas

- A marca do produto é a coluna `products.system_category` do ERP (a view a expõe como `marca`). Em 25/10/2026 todas as cervejas ficaram com marca preenchida. "Bebidas Quentes (Mais Barato)" e "Sucesso de vendas" estão nessa coluna, mas são etiquetas, não marcas.
- `public/marcas/` tem os logos baixados da Wikipédia por `scripts/baixar-logos-marcas.py`. O script recebe um argumento `"Marca=wiki:Artigo"` por marca e pausa entre pedidos, porque a Wikipédia devolve 429 com pedidos seguidos e às vezes acha o logo errado: conferir a imagem.
- O manifesto `src/data/marcas-logos.json` diz qual marca tem logo. O logo do Império veio do site da marca. Antarctica e Michelob ainda estão sem logo.
- Marca nova no catálogo: rodar o script para ela e commitar o arquivo e o manifesto.
- `MarcasLista`:
  - quadrados de 92 px com cara de lata: a cor da lata de cada marca (`CORES_MARCA`) e um brilho de alumínio por cima (`BRILHO_LATA`);
  - logo como impresso na lata: silhueta branca no fundo escuro, original (`LOGO_ORIGINAL`) ou com contorno branco (`LOGO_CONTORNO`, a gravata da Budweiser na lata vermelha);
  - com 4 ou mais marcas com logo, mostra só essas;
  - `NAO_E_MARCA` tira valores que são categoria.

## Notificações push

- Quem aceita vira linha em `cardapio_push_inscricoes` (SQL em `supabase/cardapio_push.sql`). O site só inscreve ou cancela pelas funções `cardapio_push_*`; a tabela não é legível pela chave anon. A inscrição é regravada a cada abertura com permissão concedida, e o `public/sw.js` refaz a inscrição sozinho quando o navegador a troca (`pushsubscriptionchange`).
- Disparo manual: `node scripts/enviar-push.mjs "Título" "Texto" /caminho` mostra a prévia e quantos recebem. Com `--enviar` manda; com `--contar` só conta. O envio vai com prioridade alta, porque o Android segura as de prioridade normal com a tela apagada, e as inscrições que respondem 404 ou 410 são desativadas.
- Chaves VAPID: a privada está só no `.env.local` deste repo e nos segredos da Edge Function; a pública fica em `src/lib/push.ts`.
- O ícone pequeno da notificação no Android é `src/app/badge/route.tsx`: um sino branco em fundo transparente. O Android pinta de branco o que não é transparente.
- Plataformas:
  - Android/Chrome recebe push sem instalar.
  - iPhone só recebe com o cardápio adicionado à tela de início (iOS 16.4+).
  - `src/lib/instalacao.ts` detecta app instalado, plataforma e o prompt de instalar do Android.
- Convites:
  - `ConvitePush` (folha amarela): aparece na confirmação do pedido e na home do app instalado, em 3 s na primeira abertura e em 25 s nas seguintes. No iPhone pelo navegador, na confirmação, vira o passo a passo de instalar. "Agora não" pausa 14 dias.
  - `BannerApp` vira um slide do carrossel de banners da home (só para quem está no navegador): no Android, "Instalar app" ou "Só as notificações"; no iPhone, os passos de instalar; nos outros, "Ativar notificações". Fechar esconde por 7 dias.
- Aviso de status do pedido (`supabase/cardapio_push_pedido.sql`):
  - na confirmação, o site liga a inscrição ao pedido (`cardapio_push_vincular_pedido`, só pedidos do site com menos de 1 dia);
  - o gatilho `cardapio_push_status` em `orders` (em_preparo, saiu_entrega, entregue, cancelado) chama a Edge Function `supabase/functions/cardapio-push-pedido` pelo `pg_net`, com o segredo do Vault `cardapio_push_webhook`;
  - fica separado do aviso por WhatsApp (`erp_aviso_status_pedido`);
  - publicar a função ou trocar o segredo: `python3 -I scripts/configurar-push-pedido.py`;
  - a função foi testada direto, mas a mudança de status de um pedido real feito pelo site ainda não.
- `supabase/` fica fora do `tsconfig` e do eslint, porque a Edge Function é Deno.

## Regras do domínio

- Preço por quantidade: o cliente escolhe unidades e a sacola monta a combinação de blocos mais barata (`src/lib/precoQuantidade.ts`), mesma regra do ERP e do banco (`erp_melhor_preco`). Se mudar aqui, mude lá.
- Selo "-N%" e preço riscado vêm dos blocos existentes (pack mais barato que as unidades avulsas), sem campo novo no ERP.
- Variantes (natural, vasilhame) têm preço fechado e ficam fora da combinação automática.
- Status aberto/fechado quem decide é o banco; o site só descreve o turno (`src/lib/horarios.ts`) e faz "Fecha em" andar no cliente (`src/lib/relogio.ts`).
- "Entrega a partir de R$ X" é o frete calculado pela função do banco no ponto da loja.

## Pendências conhecidas

- Testar o push de status com um pedido real feito pelo site e movido no ERP.
- Testar os fluxos de iPhone (instalar e convite no app instalado).
- Logos de Antarctica e Michelob.
