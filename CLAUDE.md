# Cardápio digital da Casa dos Fundos

Next.js 16 (App Router) + Tailwind 4, lendo o catálogo do Supabase do ERP (`erp-consumer-2.0`, views `cardapio_vw_*`). Visual inspirado no Zé Delivery.

## Comandos

- `npm run dev`: servidor local.
- `npm test`: testes dos módulos puros em `src/lib/__testes__` (`node --test`).
- `npx eslint src` e `npx tsc --noEmit`: rodar antes de commitar.

## Commit e deploy

- Commit e push direto no `main`, sem pedir confirmação. Pode acumular mudanças relacionadas num commit só.
- O deploy é pelo EasyPanel (imagem do `Dockerfile`) a partir deste repo no GitHub. O push no `main` é o deploy; se o painel não estiver ligado ao GitHub, falta só clicar em Deploy lá.
- Mensagem de commit em pt-BR, no formato `tipo: resumo` (`feat:`, `fix:`), sem `Co-Authored-By`.
- Nunca commitar `.env*` (o `.env.local.example` fica fora do git de propósito).

## Regras do domínio

- Preço por quantidade: o cliente escolhe unidades e a sacola monta a combinação de blocos mais barata (`src/lib/precoQuantidade.ts`), mesma regra do ERP e do banco (`erp_melhor_preco`). Se mudar aqui, mude lá.
- Selo "-N%" e preço riscado vêm dos blocos existentes (pack mais barato que as unidades avulsas), sem campo novo no ERP.
- Variantes (natural, vasilhame) têm preço fechado e ficam fora da combinação automática.
- Status aberto/fechado quem decide é o banco; o site só descreve o turno (`src/lib/horarios.ts`) e faz "Fecha em" andar no cliente (`src/lib/relogio.ts`).
- "Entrega a partir de R$ X" é o frete calculado pela função do banco no ponto da loja.
