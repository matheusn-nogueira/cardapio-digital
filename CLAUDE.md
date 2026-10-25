# Cardápio digital da Casa dos Fundos

Next.js 16 (App Router) + Tailwind 4, lendo o catálogo do Supabase do ERP (`erp-consumer-2.0`, views `cardapio_vw_*`). Visual inspirado no Zé Delivery.

## Comandos

- `npm run dev`: servidor local.
- `npm test`: testes dos módulos puros em `src/lib/__testes__` (`node --test`).
- `npx eslint src` e `npx tsc --noEmit`: rodar antes de commitar.

## Commit e deploy

- Commit e push direto no `main`, sem pedir confirmação. Pode acumular mudanças relacionadas num commit só.
- O deploy é pelo EasyPanel (imagem do `Dockerfile`, serviço `casa-dos-fundos/cardapio-digital`, produção em `https://cardapio.casadosfundos.cloud`). O painel **não** faz deploy sozinho no push. Depois do push, disparar e esperar com o script do PDV, que chama a API do painel e confere a página publicada:
  `python3 -u ~/Pessoal/pdv-balcao/scripts/deploy-easypanel.py cardapio-digital`
  O script carrega as credenciais do `.env.local` do `pdv-balcao` (nunca imprimir). Das 17h até o fechamento (22h; 0h sex e sáb) ele recusa, porque o build roda no mesmo servidor do caixa; `--forcar` só em emergência. Só dar push e deploy com testes, lint e tipos passando.
- Nunca rodar `npm run build` com o `npm run dev` aberto: os dois escrevem em `.next/` e o dev quebra. Parar o dev antes, ou reiniciá-lo depois.
- Mensagem de commit em pt-BR, no formato `tipo: resumo` (`feat:`, `fix:`), sem `Co-Authored-By`.
- Nunca commitar `.env*` (o `.env.local.example` fica fora do git de propósito).

## Notificações push

- Quem aceita vira linha em `cardapio_push_inscricoes` (SQL em `supabase/cardapio_push.sql`, aplicado com `python3 -I scripts/sql-supabase.py <arquivo>`). O site só inscreve/cancela pelas funções `cardapio_push_*`; a tabela não é legível pela chave anon.
- Convite (`ConvitePush`): na confirmação do pedido e, para quem abriu o cardápio instalado, na home depois de 25 s. "Agora não" pausa 14 dias.
- Disparo: `node scripts/enviar-push.mjs "Título" "Texto" /caminho` mostra a prévia e quantos recebem; com `--enviar` manda. `--contar` só conta. A chave privada VAPID está só no `.env.local` deste repo; a pública fica em `src/lib/push.ts`.
- No iPhone só funciona com o cardápio adicionado à tela de início (iOS 16.4+). Na confirmação, iPhone no navegador vê o passo a passo de instalar em vez do convite.
- Aviso de status do pedido (`supabase/cardapio_push_pedido.sql`): na confirmação o site liga a inscrição ao pedido (`cardapio_push_vincular_pedido`); o gatilho `cardapio_push_status` em `orders` (só pedidos do site; em_preparo, saiu_entrega, entregue, cancelado) chama a Edge Function `supabase/functions/cardapio-push-pedido` com o segredo do Vault `cardapio_push_webhook`. Fica separado do aviso por WhatsApp (`erp_aviso_status_pedido`). Publicar ou trocar o segredo: `python3 -I scripts/configurar-push-pedido.py`.

## Logos das marcas

`public/marcas/` tem os logos baixados da Wikipédia por `scripts/baixar-logos-marcas.py` (um argumento `"Marca=wiki:Artigo"` por marca; a Wikipédia devolve 429 com pedidos seguidos, por isso o script pausa). O manifesto `src/data/marcas-logos.json` diz qual marca tem logo; marca sem logo vira letreiro na cor da marca. Marca nova no catálogo: rodar o script para ela e commitar o arquivo e o manifesto.

## Regras do domínio

- Preço por quantidade: o cliente escolhe unidades e a sacola monta a combinação de blocos mais barata (`src/lib/precoQuantidade.ts`), mesma regra do ERP e do banco (`erp_melhor_preco`). Se mudar aqui, mude lá.
- Selo "-N%" e preço riscado vêm dos blocos existentes (pack mais barato que as unidades avulsas), sem campo novo no ERP.
- Variantes (natural, vasilhame) têm preço fechado e ficam fora da combinação automática.
- Status aberto/fechado quem decide é o banco; o site só descreve o turno (`src/lib/horarios.ts`) e faz "Fecha em" andar no cliente (`src/lib/relogio.ts`).
- "Entrega a partir de R$ X" é o frete calculado pela função do banco no ponto da loja.
