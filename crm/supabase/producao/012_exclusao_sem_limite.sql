-- Exclusão em lote sem limite de quantidade: tira de delete_records a trava "Escolha até 500 leads por vez".
-- Já aplicada em produção (migração exclusao_em_lote_sem_limite, 2026-11-12).
-- Atenção: a consulta do papel authenticated tem tempo máximo de 8 s; lotes muito grandes podem passar disso.
do $$
declare d text;
begin
  select pg_get_functiondef('public.delete_records(text, uuid[], text, text)'::regprocedure) into d;
  d := replace(d, E'  if array_length(p_ids, 1) > 500 then raise exception ''Escolha até 500 leads por vez.''; end if;\n', '');
  if position('Escolha até 500' in d) > 0 then raise exception 'trava não encontrada no formato esperado'; end if;
  execute d;
end $$;
