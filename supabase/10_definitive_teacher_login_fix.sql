-- Solución definitiva para el acceso docente.
-- 1. Retira las políticas temporales restantes.
-- 2. Conserva el contrato usado por ChemQuest.
-- 3. Carga el perfil propio mediante una función segura que no depende de RLS.
-- No elimina contenido académico.

drop policy if exists "Collaborators read owner grades" on public.teacher_grades;
drop policy if exists "Collaborators manage owner classrooms" on public.classrooms;
drop policy if exists "Collaborators manage owner modules" on public.study_modules;
drop policy if exists "Collaborators manage owner quizzes" on public.teacher_quizzes;
drop policy if exists "Collaborators manage owner quiz questions" on public.quiz_questions;
drop policy if exists "Collaborators read owner classroom members" on public.classroom_members;
drop policy if exists "Collaborators manage owner module assignments" on public.classroom_modules;
drop policy if exists "Collaborators manage owner quiz assignments" on public.classroom_quizzes;
drop policy if exists "Collaborators read owner students" on public.profiles;
drop policy if exists "Collaborators read owner quiz attempts" on public.quiz_attempts;

do $$
begin
  if to_regclass('public.teacher_collaborators') is not null then
    execute 'drop policy if exists "Owners view teacher collaborators" on public.teacher_collaborators';
    execute 'drop table public.teacher_collaborators';
  end if;
end $$;

drop function if exists public.get_teacher_workspace_owner();
drop function if exists private.current_teacher_workspace_owner();

create or replace function private.current_teacher_workspace_owner()
returns uuid
language sql
stable
security definer
set search_path = public, private
as $$
  select p.id
  from public.profiles p
  where p.id = (select auth.uid())
    and p.role in ('teacher', 'admin')
  limit 1;
$$;

revoke all on function private.current_teacher_workspace_owner() from public, anon;
grant execute on function private.current_teacher_workspace_owner() to authenticated;

create or replace function public.get_teacher_workspace_owner()
returns uuid
language sql
stable
security definer
set search_path = public, private
as $$ select private.current_teacher_workspace_owner(); $$;

revoke all on function public.get_teacher_workspace_owner() from public, anon;
grant execute on function public.get_teacher_workspace_owner() to authenticated;

create or replace function public.get_my_profile()
returns table (
  id uuid,
  full_name text,
  email text,
  role public.user_role
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.id, p.full_name, p.email, p.role
  from public.profiles p
  where p.id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

select id, email, full_name, role
from public.profiles
where lower(email) = 'valentina.gonzalez@gimsaber.edu.co';
