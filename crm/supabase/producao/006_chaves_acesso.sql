-- Chaves de cadastro: o dono gera uma chave curta de uso único, já com o perfil do colaborador.
-- Só o hash fica no banco (a chave aparece uma vez, na tela do dono). Quem resgata é a função first-access.
alter table public.invites
  add column code_hash text unique,
  add column code_hint text;           -- últimos 4 caracteres, para o dono reconhecer a chave na lista

-- Tentativas erradas de chave, por endereço (limite contra quem tenta adivinhar).
create table public.invite_attempts (
  id bigint generated always as identity primary key,
  ip text not null,
  at timestamptz not null default now()
);
create index invite_attempts_ip on public.invite_attempts (ip, at);
alter table public.invite_attempts enable row level security;
revoke all on public.invite_attempts from anon, authenticated;
grant all on public.invite_attempts to service_role;

-- O dono lê a lista sem enxergar o hash.
revoke select on public.invites from authenticated;
grant select (id, tenant_id, token, role, name, created_by, expires_at, used_at, used_by, created_at, code_hint) on public.invites to authenticated;
