-- Usado pela função ai-sales para conferir, no servidor, se a empresa está liberada para o AI Sales.
create or replace function public.ai_allowed(p_tenant uuid) returns boolean
language sql stable security definer set search_path to '' as $$ select exists (select 1 from app.ai_sales_tenants where tenant_id = p_tenant); $$;
revoke execute on function public.ai_allowed(uuid) from public, anon, authenticated;
grant execute on function public.ai_allowed(uuid) to service_role;
