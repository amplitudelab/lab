-- Exclusão em lote: apaga vários registros de uma vez e gera uma notificação só.
-- delete_record continua igual para um registro; dentro do lote, ele não cria a notificação de cada um.
do $$
declare d text;
begin
  select pg_get_functiondef('public.delete_record(text, uuid, text, text)'::regprocedure) into d;
  if position('app.bulk_delete' in d) = 0 then
    d := replace(d,
      E'  insert into public.notifications (tenant_id, lead_id, kind, title, body, read_at)\n  values (t, case when p_kind = ''lead'' then null else lid end, ''system'', split_part(note, '':'', 1), note, null);',
      E'  if coalesce(current_setting(''app.bulk_delete'', true), '''') <> ''on'' then\n    insert into public.notifications (tenant_id, lead_id, kind, title, body, read_at)\n    values (t, case when p_kind = ''lead'' then null else lid end, ''system'', split_part(note, '':'', 1), note, null);\n  end if;');
    if position('app.bulk_delete' in d) = 0 then raise exception 'delete_record mudou: revise a migração'; end if;
    execute d;
  end if;
end $$;

create or replace function public.delete_records(p_kind text, p_ids uuid[], p_reason text, p_requested_by text default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare
  uid uuid := auth.uid(); mail text; i uuid; ok int := 0; t uuid; names text[] := '{}'; total bigint := 0; fails jsonb := '[]';
  ttl text; amt bigint; ten uuid; body text; label text;
begin
  if uid is null then raise exception 'Entre no CRM para apagar registros.'; end if;
  if p_kind <> 'lead' then raise exception 'O lote vale só para leads.'; end if;
  if coalesce(array_length(p_ids, 1), 0) = 0 then raise exception 'Nenhum lead escolhido.'; end if;
  if array_length(p_ids, 1) > 500 then raise exception 'Escolha até 500 leads por vez.'; end if;
  select email into mail from auth.users where id = uid;
  perform set_config('app.bulk_delete', 'on', true);
  foreach i in array p_ids loop
    select name, value_cents, tenant_id into ttl, amt, ten from public.leads where id = i and deleted_at is null;
    begin
      perform public.delete_record(p_kind, i, p_reason, p_requested_by);
      ok := ok + 1; t := ten; total := total + coalesce(amt, 0);
      if array_length(names, 1) is null or array_length(names, 1) < 5 then names := names || ttl; end if;
    exception when others then
      fails := fails || jsonb_build_object('id', i, 'title', coalesce(ttl, 'Lead'), 'error', sqlerrm);
    end;
  end loop;
  perform set_config('app.bulk_delete', 'off', true);
  if ok > 0 then
    label := case when ok = 1 then '1 lead apagado' else ok || ' leads apagados' end;
    body := label || ': ' || array_to_string(names, ', ') || case when ok > 5 then ' e mais ' || (ok - 5) else '' end
      || ' · R$ ' || replace(to_char(total / 100.0, 'FM999999990.00'), '.', ',') || '. Motivo: ' || btrim(p_reason)
      || coalesce('. Pedido por: ' || nullif(btrim(coalesce(p_requested_by, '')), ''), '') || '. Apagado por: ' || coalesce(mail, 'usuário') || '.';
    insert into public.notifications (tenant_id, kind, title, body) values (t, 'system', label, body);
  end if;
  return jsonb_build_object('ok', true, 'deleted', ok, 'failed', fails);
end $$;
revoke execute on function public.delete_records(text, uuid[], text, text) from public, anon;
grant execute on function public.delete_records(text, uuid[], text, text) to authenticated;
