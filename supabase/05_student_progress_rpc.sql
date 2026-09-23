-- Sincronización segura del progreso del estudiante.
begin;

create or replace function public.save_student_progress(
  requested_total_xp integer,
  requested_level integer,
  requested_completed_days jsonb,
  requested_day_results jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_student uuid := (select auth.uid());
begin
  if current_student is null then
    raise exception 'Debes iniciar sesión.' using errcode = '42501';
  end if;
  if private.current_user_role() <> 'student'::public.user_role then
    raise exception 'Solo los estudiantes pueden guardar progreso.' using errcode = '42501';
  end if;
  if requested_total_xp < 0 or requested_level < 1 then
    raise exception 'El progreso no es válido.';
  end if;
  if jsonb_typeof(requested_completed_days) is distinct from 'array'
     or jsonb_typeof(requested_day_results) is distinct from 'object' then
    raise exception 'El detalle del progreso no es válido.';
  end if;

  insert into public.student_progress (student_id, total_xp, level, completed_days, day_results)
  values (current_student, requested_total_xp, requested_level, requested_completed_days, requested_day_results)
  on conflict (student_id) do update set
    total_xp = excluded.total_xp,
    level = excluded.level,
    completed_days = excluded.completed_days,
    day_results = excluded.day_results,
    updated_at = now();
end;
$$;

revoke all on function public.save_student_progress(integer, integer, jsonb, jsonb) from public, anon;
grant execute on function public.save_student_progress(integer, integer, jsonb, jsonb) to authenticated;

-- Recupera la EXP de quizzes enviados antes de que existiera esta función.
insert into public.student_progress (student_id, total_xp, level, completed_days, day_results)
select student_id, sum(xp_earned)::integer, 1, '[]'::jsonb, '{}'::jsonb
from public.quiz_attempts
group by student_id
on conflict (student_id) do update set
  total_xp = greatest(public.student_progress.total_xp, excluded.total_xp),
  updated_at = now();

commit;
