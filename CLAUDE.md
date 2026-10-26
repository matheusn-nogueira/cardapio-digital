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
- Ficha do produto (`ProdutoDetalhe` na folha `ProdutoModal`) enxuta como no Zé: foto pequena, preço da unidade, contador, atalhos com os blocos de verdade do produto ("3 por R$ 11,00", "12 por R$ 44,00"; tocar põe essa quantidade) e "Adicionar (N) • total". Descrição e tabela "Quanto mais, mais barato" só na página `/produto/[id]`.
- **Promoção dita como no mercado** (26/10/2026): a promoção nunca aparece como preço por unidade quebrado (R$ 3,67), porque a 4ª lata a R$ 4,00 parecia erro. Regras puras em `src/lib/precoQuantidade.ts` (`blocosComDesconto`, `blocoEmDestaque`, `proximaPromocao`, `descreverPromocao`, testadas com a Império):
  - card: etiqueta "3 por R$ 11,00" (a "[Promo]" do ERP primeiro): verde quando sai mais barato que as avulsas; escura quando é "[Promo]" de preço redondo (4 por R$ 10,00 = 4 × R$ 2,50; o dono confirmou que essas estão certas, a promoção às vezes é só para arredondar). Pack sem desconto e sem "[Promo]" não ganha etiqueta. "Promoção aplicada" e o aviso "Leve mais…" só com economia de verdade;
  - sacola: como o total foi montado ("3 por R$ 11,00 + 1 avulsa R$ 4,00") e o aviso com o preço do que falta, "Leve mais 2 por R$ 7,00", com o botão "+2";
  - o preço continua automático (a combinação mais barata), igual ao ERP e ao banco.
- Rodapé (`Footer`) claro e enxuto desde 26/10/2026: loja e bairro, horário resumido (`horarioResumido`: "Domingo a quinta: 11h às 22h"), formas de pagamento com os logos, WhatsApp como link e o aviso legal. Some nas etapas do checkout.
- Confirmação de idade na chegada desligada pelo dono em 26/10/2026 (`cardapio_config.pedir_confirmacao_idade = false`; o componente `ConfirmacaoIdade` continua no código). O aviso legal segue no rodapé e no resumo do pedido.
- `body` usa `overflow-x: clip` (com `hidden` de reserva): `overflow-x: hidden` fazia o corpo da página rolar sozinho e atrapalhava a captura de tela com rolagem do celular.
- Sacola (`CartDrawer`): "Esvaziar" no topo, do lado oposto do X, com confirmação na própria sacola ("Tirar todos os itens da sacola?"), não um "desfazer" que some rápido.
- **Checkout em 3 etapas** (26/10/2026), uma coisa por tela, para os dois públicos (quem tem prática e quem tem pouca). Regras puras em `src/lib/etapasCheckout.ts` (testadas):
  1. `/checkout`: nome e WhatsApp.
  2. `/checkout/endereco`: "Usar minha localização" (opção; o GPS acerta a rua e erra o número) ou CEP (ViaCEP preenche rua e bairro); "Não sei meu CEP" e "Corrigir" abrem rua e bairro; cidade e UF não aparecem; ponto de referência atrás de um link. O frete é calculado no "Continuar" (com GPS, pelo ponto do GPS). Endereço fora da área para ali.
  3. `/payment`: a decisão primeiro (formas de pagamento no topo), depois entrega e contato num bloco compacto com "Alterar", itens recolhidos ("2 itens · Ver"), observação atrás de um link e, fixo embaixo, o total colado no botão "Fazer pedido". "Escolha a forma de pagamento" só aparece depois do toque no botão. A forma do último pedido fica no aparelho (`cdf:pagamento`).
  - Quem já pediu (dados, endereço e frete válidos no aparelho) pula de `/checkout` direto para `/payment?revisar=1` ("Confirme seu pedido"): o endereço vem primeiro (é o que mais precisa conferir) e só a forma de sempre aparece, com "Trocar forma de pagamento". `/checkout?editar=1` volta para mudar os dados.
  - O servidor local fala com o banco de verdade: no teste, nunca toque em "Fazer pedido" com uma forma de pagamento escolhida.
  - Logos reais (Pix, Visa, Mastercard, Elo, WhatsApp) em SVG, nas cores das marcas: `src/components/checkout/LogosPagamento.tsx`. As descrições das formas de pagamento cabem numa linha em 320 px.
  - Campos de 48 px com letra de 17 px; o botão da etapa fica fixo embaixo e não fica desabilitado: mostra o erro no campo e põe o cursor nele.
  - Localização → endereço: `/api/endereco-do-ponto` (Nominatim reverso). Busca do endereço: `/api/geocodificar`. As duas dividem a fila de 1 consulta por segundo (`src/lib/servidor/nominatim.ts`).
  - Rotas de compra (sem topo da loja, abas e sacola flutuante; sem rodapé nas etapas): `src/lib/rotas.ts`.
- Versão natural (sem gelar) fora do site desde 26/10/2026 (`MOSTRAR_NATURAL` em `src/lib/cardapio.ts`): a escolha gelada/natural em cada produto atrapalhava a maioria. Se voltar, a ideia do dono é uma seção à parte só de naturais.
- WhatsApp da loja é a 4ª aba da barra de baixo (`BarraInferior`), com nome escrito e o ícone no mesmo traço dos outros (Tabler, em verde escuro). Não é botão flutuante: cobria produto e disputava com "Ver sacola" (decisão do dono, 26/10/2026).
- Pop-ups de promoção (`PopupPromo`), no máximo uma vez por dia cada: a lista da categoria 1,5 s depois de abrir a home (nunca na visita em que a pessoa acabou de confirmar a idade: dois modais seguidos na chegada), e a oferta especial (maior desconto em pack) quando a pessoa faz menção de sair (mouse pelo topo no computador; 45 s sem rolar nem tocar, com a sacola vazia, no celular).

## Textos (tom de voz, revisão de 26/10/2026)

- Fala com "você", de perto, sem gíria forçada e sem emoji ("pra", "precinho" só nos pop-ups de promoção).
- Instrução no imperativo formal ("Digite o CEP", "Confira sua internet"); botão diz a ação, no infinitivo, como no iFood ("Fazer pedido", "Fechar pedido", "Ver o cardápio").
- Erro diz o que houve e o que fazer, sem "Infelizmente" e sem exclamação.
- Um nome para cada coisa: **sacola** (não carrinho), **entrega/taxa de entrega** (não frete), **pedido**.
- Notificação é para acompanhar o pedido (dono): o convite não promete oferta nem cupom.
- Aviso legal único: "Venda e consumo de bebida alcoólica proibidos para menores de 18 anos. Beba com moderação."
- Textos do banco (ERP): banner da home (hoje "Império Latão: 3 por R$ 11,00", que leva a Promoções Geladas; o botão diz "Ver promoções" para categoria e "Ver produto" para produto) e `cardapio_config.mensagem_fechado`.

## Categorias

- Vêm de `cardapio_categorias` no ERP (editáveis por lá): `categorias_produto` diz quais valores de `produto.categoria` entram, e `filtro` (jsonb, opcional) recorta dentro deles. Ver `supabase/cardapio_categorias_99.sql`.
  - `{"promo": true}`: só produtos com oferta "[Promo]" que ganham etiqueta no card (desconto de verdade ou preço redondo); o desconto de verdade vem primeiro.
  - A vitrine "Cervejas geladas" foi desligada em 26/10/2026 (redundante com Promoções Geladas no topo); a categoria Cervejas segue como prateleira comum.
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
- O manifesto `src/data/marcas-logos.json` diz qual marca tem logo (`arquivoLata`: versão recolorida como impressa na lata, como a Heineken branca com estrela vermelha). Império veio do site da marca; Antarctica (selo dos pinguins), Michelob, Itaipava, Eisenbahn e Caracu vieram do worldvectorlogo.com, com o fundo tirado e o `viewBox` recortado ao desenho. Bohemia e Petra estão sem logo (o "Bohemia" achado era de uma fábrica de cristais): aparecem como letreiro.
- Marca nova no catálogo: rodar o script para ela e commitar o arquivo e o manifesto.
- `MarcasLista` (26/10/2026, pedido do dono):
  - todas as marcas de cerveja do catálogo, mesmo com um produto só; quem não tem logo vira letreiro nas cores da lata;
  - quadrados de 92 px com fundo **sólido** na cor da lata (`CORES_MARCA`), sem degradê nem brilho;
  - logo como impresso na lata, com as cores dele: original (`LOGO_ORIGINAL`), silhueta branca quando a lata imprime o logo em branco (Brahma), ou com contorno branco (`LOGO_CONTORNO`, a gravata da Budweiser na lata vermelha);
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
- Logos de Bohemia e Petra (hoje letreiros).
