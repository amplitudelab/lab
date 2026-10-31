-- Código de acesso do dono: só o hash fica guardado, e as tabelas são lidas apenas pela função access-code.
create table public.access_codes (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  salt text not null,
  hash text not null,
  iterations int not null,
  updated_at timestamptz not null default now()
);
create table public.access_code_attempts (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  ip text not null,
  at timestamptz not null default now()
);
create index access_code_attempts_tenant on public.access_code_attempts (tenant_id, at);
create index access_code_attempts_ip on public.access_code_attempts (ip, at);
alter table public.access_codes enable row level security;
alter table public.access_code_attempts enable row level security;
revoke all on public.access_codes, public.access_code_attempts from anon, authenticated;
grant all on public.access_codes, public.access_code_attempts to service_role;
