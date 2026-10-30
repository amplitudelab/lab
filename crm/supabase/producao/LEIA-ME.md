# Banco e funções em produção

Esta pasta é o que está **rodando** no projeto Supabase `amplitude-crm` (ref `ozregdgphaxkxumsujys`, São Paulo).
Os arquivos em `crm/supabase/` (fora desta pasta) são o rascunho anterior com Asaas e não foram aplicados.

Ordem das migrations: `001_schema.sql`, `002_pagamentos.sql`, `003_login_radar.sql`, `004_orcamento_site.sql`.

Funções: `checkout`, `infinitepay-webhook`, `first-access`, `radar`, `site-quote` e `proposal-link`.

Nunca coloque chaves secretas neste repositório. A chave publicável em `crm/app/index.html` é pública por natureza; quem protege os dados é a RLS.
