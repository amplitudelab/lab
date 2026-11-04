-- Ficha de anamnese para tatuagem.
-- O dono (ou admin) gera um link privado por cliente; o cliente preenche e assina sem login, só com o link.
-- Dados de saúde são sensíveis (LGPD): só dono e admin leem, só o dono apaga, e o envio passa por uma
-- função que confere o link, limita o tamanho e fecha o link depois do primeiro envio.

create table public.anamnesis_links (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  token        text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  client_name  text check (length(client_name) <= 120),
  client_phone text check (length(client_phone) <= 30),
  created_by   uuid default auth.uid() references auth.users(id) on delete set null,
  expires_at   timestamptz not null default now() + interval '30 days',
  used_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index anamnesis_links_tenant on public.anamnesis_links (tenant_id, created_at desc);
create index anamnesis_links_created_by on public.anamnesis_links (created_by);

create table public.anamnesis_forms (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  link_id     uuid unique references public.anamnesis_links(id) on delete set null,
  client_name text not null,
  answers     jsonb not null,
  signature   text,                      -- assinatura desenhada no celular (PNG em data URL)
  alerts      int not null default 0,     -- quantas respostas de saúde foram "sim"
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index anamnesis_forms_tenant on public.anamnesis_forms (tenant_id, created_at desc);

alter table public.anamnesis_links enable row level security;
alter table public.anamnesis_forms enable row level security;

create policy anamnesis_links_read   on public.anamnesis_links for select to authenticated using (app.has_role(tenant_id, '{owner,admin}'));
create policy anamnesis_links_insert on public.anamnesis_links for insert to authenticated with check (app.has_role(tenant_id, '{owner,admin}'));
create policy anamnesis_links_delete on public.anamnesis_links for delete to authenticated using (app.has_role(tenant_id, '{owner,admin}') and used_at is null);
create policy anamnesis_forms_read   on public.anamnesis_forms for select to authenticated using (app.has_role(tenant_id, '{owner,admin}'));
create policy anamnesis_forms_delete on public.anamnesis_forms for delete to authenticated using (app.has_role(tenant_id, '{owner}'));
revoke all on public.anamnesis_links, public.anamnesis_forms from anon;
grant select, insert, delete on public.anamnesis_links to authenticated;
grant select, delete on public.anamnesis_forms to authenticated;

-- Página pública: diz se o link vale e de qual estúdio é, sem expor nada além disso.
create or replace function public.anamnese_public(p_token text)
returns json language plpgsql stable security definer set search_path = '' as $$
declare l public.anamnesis_links; t public.tenants;
begin
  if p_token !~ '^[0-9a-f]{64}$' then return json_build_object('status', 'invalid'); end if;
  select * into l from public.anamnesis_links where token = p_token;
  if not found then return json_build_object('status', 'invalid'); end if;
  select * into t from public.tenants where id = l.tenant_id;
  return json_build_object(
    'status', case when l.used_at is not null then 'used' when l.expires_at < now() then 'expired' else 'ok' end,
    'business', coalesce(nullif(t.brand->>'name', ''), t.name),
    'color', t.brand->>'primary',
    'client_name', l.client_name);
end $$;

-- Envio da ficha: uma vez por link, com limite de tamanho e aviso no painel.
create or replace function public.anamnese_submit(p_token text, p_answers jsonb, p_signature text, p_user_agent text default null)
returns json language plpgsql security definer set search_path = '' as $$
declare l public.anamnesis_links; nome text; n int; ip text;
begin
  if p_token !~ '^[0-9a-f]{64}$' then return json_build_object('error', 'Link inválido.'); end if;
  select * into l from public.anamnesis_links where token = p_token for update;
  if not found then return json_build_object('error', 'Link inválido.'); end if;
  if l.used_at is not null then return json_build_object('error', 'Esta ficha já foi enviada. Se precisar corrigir algo, fale com o estúdio.'); end if;
  if l.expires_at < now() then return json_build_object('error', 'Este link venceu. Peça um novo ao estúdio.'); end if;
  if jsonb_typeof(p_answers) <> 'object' or length(p_answers::text) > 60000 then return json_build_object('error', 'Ficha inválida.'); end if;
  if p_signature is null or p_signature !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$' or length(p_signature) > 400000 then
    return json_build_object('error', 'Faça a assinatura no quadro.'); end if;
  nome := trim(coalesce(p_answers #>> '{dados,nome}', ''));
  if length(nome) < 3 then return json_build_object('error', 'Escreva o nome completo.'); end if;
  if coalesce(p_answers #>> '{termos,verdade}', '') <> 'sim' or coalesce(p_answers #>> '{termos,lgpd}', '') <> 'sim' then
    return json_build_object('error', 'Marque as declarações obrigatórias no fim da ficha.'); end if;
  select count(*) into n from jsonb_each_text(coalesce(p_answers->'saude', '{}'::jsonb)) where value = 'sim';
  begin ip := split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1); exception when others then ip := null; end;
  insert into public.anamnesis_forms (tenant_id, link_id, client_name, answers, signature, alerts, ip, user_agent)
  values (l.tenant_id, l.id, left(nome, 120), p_answers, p_signature, n, nullif(trim(ip), ''), left(p_user_agent, 300));
  update public.anamnesis_links set used_at = now() where id = l.id;
  insert into public.notifications (tenant_id, kind, title, body)
  values (l.tenant_id, 'system', 'Nova ficha de anamnese', nome || case when n > 0 then ' · ' || n || ' ponto(s) de atenção na saúde' else ' · sem pontos de atenção' end);
  return json_build_object('ok', true);
end $$;

revoke execute on function public.anamnese_public(text), public.anamnese_submit(text, jsonb, text, text) from public;
grant execute on function public.anamnese_public(text), public.anamnese_submit(text, jsonb, text, text) to anon, authenticated;
