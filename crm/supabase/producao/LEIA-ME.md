# Banco e funções em produção

Esta pasta é o que está **rodando** no projeto Supabase `amplitude-crm` (ref `ozregdgphaxkxumsujys`, São Paulo).
Os arquivos em `crm/supabase/` (fora desta pasta) são o rascunho anterior com Asaas e não foram aplicados.

Ordem das migrations: `001_schema.sql`, `002_pagamentos.sql`, `003_login_radar.sql`, `004_orcamento_site.sql`.

As três últimas migrations (`exclusoes_planos_empresas`, `exclusao_nao_revive_por_orcamento` e `pagamento_online_no_pro`) estão no histórico do projeto: use `supabase db pull` para gerar os arquivos.

Funções: `checkout`, `infinitepay-webhook`, `first-access`, `radar`, `site-quote`, `proposal-link` e `provision-tenant`. A função `radar-diag` foi um teste e está desativada.

Nunca coloque chaves secretas neste repositório. A chave publicável em `crm/app/index.html` é pública por natureza; quem protege os dados é a RLS.
