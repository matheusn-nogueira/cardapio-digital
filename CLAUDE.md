# Cardápio digital da Casa dos Fundos

Next.js 16 (App Router) + Tailwind 4, lendo o catálogo do Supabase do ERP (`erp-consumer-2.0`, projeto `dkbvmqnrdgnhiyhtgsjy`, views `cardapio_vw_*`). Estrutura do **app** do Zé Delivery (chips de categoria, cards chapados, títulos com seta, barra de abas no rodapé) com a identidade própria **Freezer** desde 27/10/2026: topo azul-noite com busca, fundo de gelo nas fotos, Barlow Condensed nos títulos (ver "Cores e formas"). Produção: `https://cardapio.casadosfundos.cloud`.

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
- Card de produto (`ProdutoCard`): o "+" (redondo, 36 px à vista e 44 px de toque) põe 1 un na sacola e vira contador sobre a foto, como no iFood (lixeira no 1, menos, quantidade, mais). Mexe só na versão padrão; produto com versão que muda o item (vasilhame) abre a ficha. Um selo só por card. O preço é o de 1 un (o que o "+" cobra); a promoção vai na etiqueta da foto ("3 por R$ 11,00", ver abaixo; cores em "Cores e formas"). O texto do card tem altura fixa (preço + nome em 2 linhas): não acrescente linha variável embaixo, senão as prateleiras ficam de alturas diferentes e o espaço entre elas varia.
- Ficha do produto (`ProdutoDetalhe` na folha `ProdutoModal`) enxuta como no Zé: foto pequena, preço da unidade, contador, atalhos com os blocos de verdade do produto ("3 por R$ 11,00", "12 por R$ 44,00"; tocar põe essa quantidade) e "Adicionar (N) • total". Descrição e tabela "Quanto mais, mais barato" só na página `/produto/[id]`; a tabela diz o preço do bloco e "Economize R$ X", nunca o preço quebrado por unidade (o pop-up de oferta também: "12 por R$ 44,00 · -8%").
- **Promoção dita como no mercado** (26/10/2026): a promoção nunca aparece como preço por unidade quebrado (R$ 3,67), porque a 4ª lata a R$ 4,00 parecia erro. Regras puras em `src/lib/precoQuantidade.ts` (`blocosComDesconto`, `blocoEmDestaque`, `proximaPromocao`, `descreverPromocao`, testadas com a Império):
  - card: etiqueta verde "3 por R$ 11,00" (`etiquetaDePromocao`, a "[Promo]" do ERP primeiro) **só quando sai mais barato que as avulsas**. A "[Promo]" de preço redondo (4 por R$ 10,00 = 4 × R$ 2,50) continua valendo na conta, na sacola, na ficha e na categoria de promoções, mas não ganha etiqueta no card (dono, 27/10/2026: verde e azul lado a lado pareciam dois tipos de promoção). "Promoção aplicada" e o aviso "Leve mais…" só com economia de verdade;
  - sacola: como o total foi montado ("3 por R$ 11,00 + 1 avulsa R$ 4,00") e o aviso com o preço do que falta, "Leve mais 2 por R$ 7,00", com o botão "+2";
  - o preço continua automático (a combinação mais barata), igual ao ERP e ao banco.
- Sem rodapé de site (26/10/2026, pedido do dono: tem que parecer app). As informações da loja ficam em `SobreLoja`, folha que abre ao tocar no nome da loja no topo (com a setinha): endereço (`loja.endereco` da view, rua e número de `store_settings`), mapa estático com o ponto da loja (imagens do OpenStreetMap montadas por `src/lib/mapa.ts`; o mapa embutido por iframe não carregava) e o botão "Como chegar" (rota no Google Maps), bairro, horário resumido (`horarioResumido`: "Domingo a quinta: 11h às 22h"), formas de pagamento com os logos, WhatsApp e o aviso legal. `Footer` virou só o espaço das barras fixas de baixo.
- Confirmação de idade na chegada desligada pelo dono em 26/10/2026 (`cardapio_config.pedir_confirmacao_idade = false`; o componente `ConfirmacaoIdade` continua no código). O aviso legal segue em "Sobre a loja" e no resumo do pedido.
- `body` usa `overflow-x: clip` (com `hidden` de reserva): `overflow-x: hidden` fazia o corpo da página rolar sozinho e atrapalhava a captura de tela com rolagem do celular.
- Busca (`src/lib/busca.ts`, `buscarProdutos`, testada com os erros reais "brama" e "heinekem"): primeiro a exata (todas as palavras, sem acento, em nome, marca, categoria e apelidos); sem resultado, aceita erro de digitação (1 letra até 6, 2 a partir de 7; número e palavra curta só exatos, para 350 não virar 330); ainda sem resultado, ignora as palavras que não batem com nada ("cerveja barata" mostra as cervejas, "sem 'barata'"). A tela avisa "com nomes parecidos". `filtrarPorTermo` é a etapa exata, usada pela própria `buscarProdutos` (a categoria não tem mais busca própria desde 27/10/2026).
  - Apelidos que o cliente usa e o nome não tem ("latinha", "litrao", "breja", "pinga", "uisque", "maco", "avulso"…) ficam nas **etiquetas** do produto (`products.tags`, editáveis no ERP; o sync da planilha não mexe), que a view junta em `apelidos`. As regras estão em `supabase/apelidos_busca.sql` (27/10/2026, 181 produtos): só acrescenta e é idempotente, rode de novo depois de cadastrar produto. Não use `aliases`: é a chave do sync com a planilha.
- **Peça de novo** (`PecaDeNovo`, 27/10/2026): quem já pediu no aparelho vê, abaixo do status da loja, um bloco preto de uma linha (fotos, "24/10 · 3 itens", "Adicionar" amarelo) que põe o último pedido na sacola com o preço de agora e abre a sacola. Os itens ficam em `cdf:pedido-anterior` (gravado no "Fazer pedido" por `guardarPedidoAnterior`); some com a sacola cheia, para não somar em dobro. O dono achou o cartão com a lista de itens grande demais: manter numa linha.
- **Números do site** (27/10/2026, `src/lib/medicao.ts` + `supabase/cardapio_funil.sql`): cada aba ganha um uuid (sem nome, telefone nem IP) e o site grava a primeira vez que ela chega em cada etapa (visita, sacola com item, dados, endereço, confirmação, pedido) e cada termo buscado (2 s parado, com quantos produtos achou). Só grava no site publicado (`*.casadosfundos.cloud`): o servidor local não suja a conta. O dono vê na tela **Números do site** do ERP (`/site`, só a conta do dono; `erp_site_resumo` com `exigir_dono`). Guarda 6 meses.
- Sacola (`CartDrawer`): "Esvaziar" no topo, do lado oposto do X, com confirmação na própria sacola ("Tirar todos os itens da sacola?"), não um "desfazer" que some rápido. A sacola para em cima da barra de abas, que fica visível com a aba Sacola marcada (27/10/2026, pedido do dono); Início e Busca fecham a sacola. Nas rotas de compra, sem abas, ela vai até o fim da tela.
- Aba Busca sem termo (`CategoriasBanners`, 27/10/2026): todas as categorias como banners de cor sólida, como a busca do iFood antigo, só com o nome (o dono não quis foto de produto). Cor do tipo de bebida (`CORES_TIPO`) ou, nas marcas, a da lata (`corDaLata` de `MarcasLista`); promoções em azul-noite com letra amarela, ocupando a linha inteira.
- **Checkout em 3 etapas** (26/10/2026), uma coisa por tela, para os dois públicos (quem tem prática e quem tem pouca). Regras puras em `src/lib/etapasCheckout.ts` (testadas):
  1. `/checkout`: nome e WhatsApp. Com `?editar=1` (seta da etapa 2 ou "Alterar" na confirmação), o botão diz "Salvar" e volta para a confirmação só se o endereço já está pronto; senão diz "Continuar" e segue para o endereço.
  2. `/checkout/endereco`: "Usar minha localização" (opção; o GPS acerta a rua e erra o número) ou CEP (ViaCEP preenche rua e bairro; resposta de um CEP já trocado é descartada, e CEP sem rua limpa a rua do anterior); "Não sei meu CEP" e "Corrigir" abrem rua e bairro; cidade e UF não aparecem; ponto de referência atrás de um link. O frete é calculado no "Continuar" (com GPS, pelo ponto do GPS). Endereço fora da área para ali.
  - Etapa 2 começa com "Como quer receber?": **Receber em casa** (o formulário de endereço) ou **Retirar na loja** (sem endereço e sem taxa; mostra só o endereço da loja; o "Como chegar" fica na confirmação, depois do pedido feito, para não tirar a pessoa do site antes de fechar). A escolha fica no aparelho (`cdf:retirada`); o pedido vai com `retirada: true` e o banco grava `orders.retirada` (`erp-consumer-2.0/supabase_cardapio_retirada.sql`). Na retirada, "Pague na retirada" e "Cartão na retirada".
  - Nome formatado ao sair do campo (`formatarNome`: "maria DA silva" → "Maria da Silva").
  - Sacola mostra a taxa de entrega desde o começo: com endereço guardado, o valor e o total; sem endereço, "a partir de R$ X"; na retirada, "Grátis".
  3. `/payment`: a decisão primeiro (formas de pagamento no topo), depois entrega e contato num bloco compacto com "Alterar", itens num cartão só (cabeçalho "N itens · Ver e alterar/Esconder" e, aberto, uma linha compacta por item: nome e preço à esquerda, "− 3 +" à direita); vem aberto com até 3 itens; cada item tem "−" e "+" e o aviso de promoção, para acertar a quantidade sem voltar à sacola; no 1 o "−" vira lixeira, como na sacola, e tirar mostra "Desfazer" por 6 s; o único item do pedido não sai: `ItensEditaveis`), observação atrás de um link e, fixo embaixo, o total colado no botão "Fazer pedido". "Escolha a forma de pagamento" só aparece depois do toque no botão. A forma do último pedido fica no aparelho (`cdf:pagamento`).
  - Quem já pediu (dados, endereço e frete válidos no aparelho) pula de `/checkout` direto para `/payment?revisar=1` ("Confirme seu pedido"): o endereço vem primeiro (é o que mais precisa conferir) e só a forma de sempre aparece, com "Trocar forma de pagamento". `/checkout?editar=1` volta para mudar os dados.
  - O servidor local fala com o banco de verdade: no teste, nunca toque em "Fazer pedido" com uma forma de pagamento escolhida.
  - Logos reais (Pix, Visa, Mastercard, Elo, WhatsApp) em SVG, nas cores das marcas: `src/components/checkout/LogosPagamento.tsx`. As descrições das formas de pagamento cabem numa linha em 320 px.
  - Campos de 48 px com letra de 17 px; o botão da etapa fica fixo embaixo e não fica desabilitado: mostra o erro no campo e põe o cursor nele.
  - Localização → endereço: `/api/endereco-do-ponto` (Nominatim reverso). Busca do endereço: `/api/geocodificar`. As duas dividem a fila de 1 consulta por segundo (`src/lib/servidor/nominatim.ts`), com no máximo 8 esperando: fila cheia recusa na hora (o frete fica "a confirmar" e o GPS pede o CEP).
  - Rotas de compra (sem topo da loja, abas e sacola flutuante; sem rodapé nas etapas): `src/lib/rotas.ts`.
- Versão natural (sem gelar) fora do site desde 26/10/2026 (`MOSTRAR_NATURAL` em `src/lib/cardapio.ts`): a escolha gelada/natural em cada produto atrapalhava a maioria. Se voltar, a ideia do dono é uma seção à parte só de naturais.
- WhatsApp da loja é a 4ª aba da barra de baixo (`BarraInferior`), com nome escrito e o ícone no mesmo traço dos outros (Tabler, em verde escuro). Não é botão flutuante: cobria produto e disputava com "Ver sacola" (decisão do dono, 26/10/2026).
- Confirmação do pedido (`/confirmation`, 26/10/2026): sem convite para chamar no WhatsApp (pedido do dono). No Pix, a chave (`cardapio_config.chave_pix`, copiada do cadastro da loja) vem primeiro, com "Copiar". Depois, "Acompanhe seu pedido" (`AndamentoPedido`): consulta `cardapio_status_pedido` (supabase/cardapio_status_pedido.sql; só o status, só pedidos do site com menos de 24 h) a cada 15 s com a tela visível e para quando o pedido termina; etapas em `src/lib/andamento.ts` ("Aguardando a loja confirmar" vira "Confirmado pela loja" quando o pedido vai para em preparo; na retirada, "saiu_entrega" é "Pronto para retirar"). Na retirada, o endereço da loja e "Como chegar".
- Pop-ups de promoção (`PopupPromo`), no máximo uma vez por dia cada: a lista da categoria 1,5 s depois de abrir a home (nunca na visita em que a pessoa acabou de confirmar a idade: dois modais seguidos na chegada), e a oferta especial (maior desconto em pack) quando a pessoa faz menção de sair (mouse pelo topo no computador; 45 s sem rolar nem tocar, com a sacola vazia, no celular).

## Cores e formas: identidade Freezer (27/10/2026)

Escolhida pelo dono entre 10 opções (estudo em `~/Pessoal/marca/identidade-10-opcoes.html`, opção 2). Tokens em `src/app/globals.css`, cada cor com **um papel só**. Não use hex solto no código: se faltar um papel, crie o token. **Rollback:** os commits `d588d14` (cores e letras), `2f5731c` (logo), `a16a2ef` (topo e chips), `57aec97` (linha de entrega) e `81dee84` (espaços, bordas, checkout); `git revert` dos que quiser e deploy.

- **Azul-noite (`tinta` #0A2540):** texto, topo da loja e das etapas de compra (`topo`), "Peça de novo", chip ativo, etiqueta, selo "Gelada" e **opção escolhida** (pagamento, entrega/retirada, quantidade da promoção na ficha): fundo azul cheio, texto branco, ícone num quadrado branco e bandeiras numa plaquinha branca.
- **Amarelo (`primaria` #FFD200, fixo no CSS, não vem mais do banco):** só fundo de botão de ação ("+", Adicionar, Ver sacola, Fazer pedido, botão do banner), sempre com texto azul-noite. Sobre o azul pode ser destaque (progresso das etapas).
- **Cinza clarinho (`bloco` #F2F3F5):** fundo da foto do produto e dos chips (o gelo #E6F3FA saiu em 27/10: lata azul se misturava e o âmbar esverdeava). `fundo` #F2F7FA nas telas de compra. Banner sem foto em `banner` #0F3A63 (a cor do ERP fica de lado; com foto, vale a foto).
- **Arte dos banners (28/10/2026, no estilo do Zé):** banner do ERP sem foto vira arte: o título "Nome: chamada R$ preço" é quebrado em nome (branco), chamada e preço (amarelo, grande), e as latas recortadas aparecem em leque à direita sobre um brilho gelado ("3 por" repete a lata 3×). A lata vem do produto do link, ou do produto com todas as palavras do nome no título (o em promoção primeiro), ou das promoções. Grade comum aos banners (dono, 28/10/2026: "cuidado com a altura"): 176 px fixos (`h-44`), 16 px de margem, título no alto e botão amarelo (`CLASSE_BOTAO_BANNER`, 40 px) embaixo, os dois alinhados à esquerda, e a arte à direita, centrada na altura. Nome em 22 px, chamada em 15 px e preço em 32 px, letra condensada aberta. Sem subtítulo quando há latas e sem selo de moderação (dono). O slide do app segue o mesmo desenho, com um celular e o aviso "Pedido saiu para entrega". Recortes: `python -I scripts/recortar-latas.py <nome da foto sem .webp>` (precisa de Pillow e NumPy numa venv) gera `public/banners/latas/` e `src/data/recortes.json`; lata nova em promoção precisa de recorte, senão o banner fica só com texto.
- **Letras:** Barlow no texto; Barlow Condensed em caixa-alta nos títulos de seção, de página, do banner, no nome da loja e nos preços (`font-condensed`). Acabamento de 27/10/2026 (pedido do dono: app refinado, não "bruto"): negrito (700), não extra-negrito, e letra levemente aberta (`tracking-[0.02em]` a `[0.06em]`, mais aberta quanto menor o título), nunca `tracking-tight`. Nome do produto no card em `suave`, 14 px, para o preço mandar.
- **Resposta ao toque:** pôr item na sacola dá uma vibração curta (só Android; `vibrarLeve` em `src/lib/toque.ts`, chamada no `adicionar` do `CartContext`) e o número da sacola dá um pulinho na barra de abas e no "Ver sacola" (`usePulo`, `animate-pulo`). Ações em texto ("Alterar", "Esconder") com sublinhado fino e afastado (`link-acao`), não o `underline` cru.
- **Detalhes de acabamento (27/10/2026, pedidos do dono):**
  - item tirado da sacola desliza para a direita e o espaço fecha (`animate-sai-direita`; o item só sai da sacola depois, `TEMPO_SAIDA_MS`);
  - confirmação do pedido: círculo verde que entra com mola e o "✓" que se desenha (`SeloConfirmado`, `pathLength` 1), com duas batidas de vibração (`vibrarSucesso`);
  - "Copiar" a chave Pix fica verde com "Copiado" por 2 s e vibra;
  - home: os chips de categoria grudam embaixo do topo (`--altura-topo`, medido pelo `Header`) e marcam a prateleira que está na tela (`acompanharRolagem`; as prateleiras levam `data-categoria`);
  - abertura do app instalado em azul-noite com a logo: Android pelo manifest (`background_color`), iPhone por imagem do tamanho exato da tela (`/abertura?t=LxA`, aparelhos em `src/lib/abertura.ts`). Ícone da aba, da tela de início e `favicon.ico` com a logo sobre o azul-noite (`gerarIconeLoja`); o `favicon.ico` é arquivo: mudou a logo, gere de novo a partir do `/icon`.
- **Esgotados** (27/10/2026): produto pausado no ERP há até 30 dias aparece apagado, com "Volta logo" e sem "+", no fim da categoria e da busca (`CardEsgotado`). Vem de `cardapio_vw_esgotados` (`supabase/cardapio_esgotados.sql`, com GRANT para anon), separada da `cardapio_vw_produtos`: o pedido continua sem aceitar pausado. Não entra na home, na sacola nem no "Peça de novo".
- **Fundo das folhas** (ficha, sacola, sobre a loja, convites): azul-noite translúcido com desfoque leve (`bg-tinta/45 backdrop-blur-[3px]`), não preto chapado. Barra de abas branca translúcida com desfoque. Foto do produto aparece com entrada suave só em CSS (ver revisão de UX abaixo).
- **Gelada:** só o floco cor de neve (`neve` #1E7FB8) no canto de cima, à direita, da foto das cervejas que não são "natural" (dono, 27/10/2026: a etiqueta escrita em todo card pesava); a etiqueta de promoção, à esquerda, para antes dele.
- **Topo:** logo (sem círculo atrás: o amarelo do círculo fazia um contorno laranja), nome e status à esquerda e a busca sempre visível. Sem botão de sacola no topo (fica na barra de baixo e no "Ver sacola"). Chips de categoria só com o nome; na home o primeiro fica em destaque. Na página de categoria, a barra já abre rolada até a categoria aberta e fica presa embaixo do topo, como na home (dono, 27/10/2026: antes abria no começo, não mostrava onde a pessoa estava e sumia ao descer a lista). A página de categoria não tem busca própria.
- **Verde (`sucesso`)** é vantagem (promoção que sai mais barato, entrega grátis); **laranja (`aviso`)** é atenção sem erro (loja fechada); **vermelho (`perigo`)** é erro e ação destrutiva.
- **Ícones de interface em azul-noite** (WhatsApp na barra e nos contatos, dinheiro); só as marcas de pagamento mantêm a cor oficial (Pix, bandeiras). **Contador de quantidade** sempre numa moldura arredondada com borda: menos, número e o "+" amarelo (sacola, pagamento e card). **Banners do carrossel** com a altura do mais alto. **Linha de entrega** centralizada.
- **Cartões:** branco com fio fino (`shadow-cartao` = anel de 1 px na cor `borda`), sem sombra. Opção não escolhida: borda de 1 px.
- **Espaços (régua):** 16 px de margem lateral em tudo; 12 px dentro do topo e até o banner; 16 px entre banner, linha de entrega e "Peça de novo"; 32 px entre seções; 12 px do título ao conteúdo; recheio de cartão 16 px.
- **Formas:** etiqueta 6 px, miniatura 8 px, botão/campo/opção/chip 12 px, mídia (foto, banner, marca) 16 px, folha que sobe 24 px no topo. Círculo só para botão de ícone e bolinha.
- **Alturas:** botão de rodapé 56 px, botão comum e campo 48 px, botão dentro de cartão 40 px, chip 36 px, botão de ícone 36 px à vista com 44 px de toque.
- **Revisão de UX com a skill UI UX Pro Max (28/10/2026, aprovada pelo dono item a item):**
  - toque: todo botão de ícone, "+", "−" e lixeira com no mínimo **40 px** de toque (meio-termo do dono entre 36 e 44); no contador da sacola e do pagamento o "+" tem 40 px com a bolinha amarela de 32 por dentro, igual ao "−";
  - letra: no mínimo **12 px** em texto de verdade (selos, avisos legais, número da sacola); ficam abaixo só o desenho do aviso no banner do app (decorativo) e o crédito do OpenStreetMap no mapa;
  - foto do produto: aparece já no HTML, com entrada só em CSS (`animate-fade-in`); antes vinha escondida até o JavaScript avisar que carregou e os cards ficavam vazios no 4G fraco. As primeiras fotos de cada tela têm `prioridade` (3 da primeira vitrine, 4 da grade);
  - prateleiras da home abaixo da primeira vitrine são `adiada`: os cards só montam quando a pessoa rola até perto (antes eram 229 fotos e 1 MB de HTML de uma vez);
  - folhas (`aria-modal`): `FocoNasFolhas` deixa o resto da página `inert` enquanto uma está aberta (Tab e leitor de tela não escapam); a folha ativa é a de z-index mais alto, e na mesma camada a que abriu por último (o pop-up de promoções, z-200, pode surgir com a ficha, z-150, já aberta); com a sacola aberta (`data-manter-barra`) a barra de abas (`data-sempre-ativo`) continua clicável;
  - busca do topo com contorno de foco branco (o azul padrão some no topo azul-noite);
  - banner sozinho no computador ocupa metade da largura, como se fossem dois lado a lado.
  - "Ver sacola": no fim de toda página há um espaço do tamanho da barra (`FloatingCart`), e o card cujo contador cairia atrás dela sobe sozinho ao tocar no "+" (`mostrarContador` no `ProdutoCard`);
  - confirmação sem pedido nesta aba (é onde cai quem toca no aviso do pedido com o app fechado, porque o pedido fica só na sessão): ícone, explicação, "Falar com a loja" no WhatsApp, "Ver o cardápio" e o "Peça de novo".
- **Marcas:** fundo na cor da lata e o logo na versão de rótulo quando existe (Heineken, Skol, Corona com coqueiro). Faltam rótulos de Império, Brahma e Budweiser (arte 512 × 512 PNG transparente).
- Mexeu em `globals.css` e o servidor local não mudou? O Turbopack guarda CSS antigo em `.next`: pare o `npm run dev`, apague `.next` e suba de novo.

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

## Divulgação (28/10/2026)

- Instagram da loja: `@deliverydosfundos`, constante `INSTAGRAM` em `src/lib/site.ts` (não está no banco).
- Compartilhar (`src/lib/compartilhar.ts`): abre a folha de compartilhar do celular (Web Share); sem ela, copia texto e link e avisa no toast. Componentes em `src/components/loja/Divulgar.tsx`:
  - confirmação do pedido: card "Gostou? Chame a galera" (compartilhar o cardápio) e o convite para postar o brinde marcando o @;
  - ficha do produto (ao lado do "Fechar") e página `/produto/[id]` (ao lado do "Voltar"): compartilhar o produto, com nome e preço no texto;
  - "Sobre a loja": bloco Contato (WhatsApp e Instagram) e "Compartilhar cardápio".
- Prévia do link (`src/lib/previa-link.tsx`, 1200×630, Freezer):
  - cardápio (`src/app/opengraph-image.tsx`): logo, chamada, tempo de entrega e três latas recortadas;
  - produto (`src/app/produto/[id]/opengraph-image.tsx`): foto, nome, preço e o bloco de promoção, se houver. As fotos do catálogo são webp, que o `next/og` não lê: o `sharp` converte para PNG antes;
  - fontes Barlow baixadas do Google Fonts na hora; se falharem, sai a fonte padrão.
- Push de "entregue": "Poste o brinde e marque @deliverydosfundos" (`supabase/functions/cardapio-push-pedido`). Para republicar só a função, sem trocar segredos: `python3 -I scripts/configurar-push-pedido.py --so-funcao`.
- Cartão com QR code para imprimir (sacola, geladeira, balcão): `node scripts/cartao-qrcode.mjs` gera em `divulgacao/` o PDF de 10×15 cm (gráfica), o PNG (WhatsApp) e o QR solto em SVG. Usa a dependência de desenvolvimento `qrcode` e o Chrome instalado. O QR aponta para `https://cardapio.casadosfundos.cloud` (correção alta, lê mesmo amassado).
- Ideia adiada: "indique e ganhe" com cupom. O checkout ainda não tem cupom.

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
- Retirada na loja e o aviso por WhatsApp: o ERP manda o pedido inteiro (com `retirada`) para o n8n (`erp_aviso_status_pedido`), e não conferimos se o texto do n8n trata a retirada (pode dizer "saiu para entrega" a quem vai buscar). Por isso a etapa 2 não promete aviso por WhatsApp na retirada; o push e a tela de confirmação já tratam. Em 27/10 as duas instâncias da Evolution (`whatsapp-deposito`, `whatsapp-kit`) estavam desconectadas desde 24/08: ver a proposta de tirar o aviso do n8n em `erp-consumer-2.0/docs/pendencias.md` (0h).
