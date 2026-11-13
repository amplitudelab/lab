# Banco e funções em produção

Esta pasta é o que está **rodando** no projeto Supabase `amplitude-crm` (ref `ozregdgphaxkxumsujys`, São Paulo).
Os arquivos em `crm/supabase/` (fora desta pasta) são o rascunho anterior com Asaas e não foram aplicados.

Ordem das migrations: `001_schema.sql`, `002_pagamentos.sql`, `003_login_radar.sql`, `004_orcamento_site.sql` … `012_exclusao_sem_limite.sql`, depois `013_ai_sales.sql`, `014_ai_sales_allowed.sql`, `015_commander.sql`, `016_commander_despacho.sql` e `017_commander_ajustes.sql`.

As três últimas migrations (`exclusoes_planos_empresas`, `exclusao_nao_revive_por_orcamento` e `pagamento_online_no_pro`) estão no histórico do projeto: use `supabase db pull` para gerar os arquivos.

Funções: `checkout`, `infinitepay-webhook`, `first-access`, `radar`, `site-quote`, `proposal-link`, `provision-tenant`, `ai-sales` e `ai-commander`. A função `radar-diag` foi um teste e está desativada.

`ai-commander` importa `../ai-sales/core.ts`: na publicação, mande os três arquivos juntos (`index.ts`, `core.ts` e `../ai-sales/core.ts`).

Testes:
- Regras puras: `node --test crm/supabase/producao/functions/ai-sales/core.test.ts crm/supabase/producao/functions/ai-commander/core.test.ts`
- Isolamento no banco (rodam e desfazem tudo; o resultado aparece na mensagem de erro): `tests/ai_sales_isolamento.sql` e `tests/commander_isolamento.sql`

Nunca coloque chaves secretas neste repositório. A chave publicável em `crm/app/index.html` é pública por natureza; quem protege os dados é a RLS.
