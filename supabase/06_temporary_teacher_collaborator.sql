-- Acceso docente temporal sin compartir la cuenta de Valentina.
-- Preparado para naihara.fragozo@gimsaber.edu.co. NO se aplica automáticamente.

create table if not exists public.teacher_collaborators (
  id uuid primary key default gen_random_uuid(),
  owner_teacher_id uuid not null references public.profiles(id) on delete cascade,
  collaborator_email text not null,
  active boolean not null default true,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (owner_teacher_id, collaborator_email)
);

alter table public.teacher_collaborators enable row level security;
revoke all on public.teacher_collaborators from public, anon, authenticated;
grant select on public.teacher_collaborators to authenticated;

create policy "Owners view teacher collaborators"
on public.teacher_collaborators for select to authenticated
using (owner_teacher_id = (select auth.uid()) or lower(collaborator_email) = lower(coalesce(auth.jwt()->>'email','')));

insert into public.teacher_collaborators (owner_teacher_id, collaborator_email, active)
select id, 'naihara.fragozo@gimsaber.edu.co', true
from public.profiles
where lower(email) = 'valentina.gonzalez@gimsaber.edu.co'
on conflict (owner_teacher_id, collaborator_email)
do update set active = true, revoked_at = null;

create or replace function private.current_teacher_workspace_owner()
returns uuid language sql stable security definer set search_path = public, private
as $$
  select coalesce(
    (select p.id from public.profiles p where p.id = (select auth.uid()) and p.role in ('teacher','admin') limit 1),
    (select tc.owner_teacher_id from public.teacher_collaborators tc
     where tc.active and lower(tc.collaborator_email) = lower(coalesce(auth.jwt()->>'email','')) limit 1)
  );
$$;
revoke all on function private.current_teacher_workspace_owner() from public, anon;
grant execute on function private.current_teacher_workspace_owner() to authenticated;

create or replace function public.get_teacher_workspace_owner()
returns uuid language sql stable security definer set search_path = public, private
as $$ select private.current_teacher_workspace_owner(); $$;
revoke all on function public.get_teacher_workspace_owner() from public, anon;
grant execute on function public.get_teacher_workspace_owner() to authenticated;

alter table public.study_modules add column if not exists uploaded_by uuid references public.profiles(id);
alter table public.teacher_quizzes add column if not exists uploaded_by uuid references public.profiles(id);

create or replace function private.record_teacher_actor()
returns trigger language plpgsql security definer set search_path = public, private
as $$ begin new.uploaded_by := (select auth.uid()); return new; end; $$;
revoke all on function private.record_teacher_actor() from public, anon, authenticated;

drop trigger if exists record_study_module_actor on public.study_modules;
create trigger record_study_module_actor before insert on public.study_modules for each row execute function private.record_teacher_actor();
drop trigger if exists record_teacher_quiz_actor on public.teacher_quizzes;
create trigger record_teacher_quiz_actor before insert on public.teacher_quizzes for each row execute function private.record_teacher_actor();

create policy "Collaborators read owner grades" on public.teacher_grades for select to authenticated
using (teacher_id = private.current_teacher_workspace_owner());
create policy "Collaborators manage owner classrooms" on public.classrooms for all to authenticated
using (teacher_id = private.current_teacher_workspace_owner())
with check (teacher_id = private.current_teacher_workspace_owner());
create policy "Collaborators manage owner modules" on public.study_modules for all to authenticated
using (created_by = private.current_teacher_workspace_owner())
with check (created_by = private.current_teacher_workspace_owner());
create policy "Collaborators manage owner quizzes" on public.teacher_quizzes for all to authenticated
using (created_by = private.current_teacher_workspace_owner())
with check (created_by = private.current_teacher_workspace_owner());
create policy "Collaborators manage owner quiz questions" on public.quiz_questions for all to authenticated
using (exists (select 1 from public.teacher_quizzes q where q.id = quiz_questions.quiz_id and q.created_by = private.current_teacher_workspace_owner()))
with check (exists (select 1 from public.teacher_quizzes q where q.id = quiz_questions.quiz_id and q.created_by = private.current_teacher_workspace_owner()));
create policy "Collaborators read owner classroom members" on public.classroom_members for select to authenticated
using (exists (select 1 from public.classrooms c where c.id = classroom_members.classroom_id and c.teacher_id = private.current_teacher_workspace_owner()));
create policy "Collaborators manage owner module assignments" on public.classroom_modules for all to authenticated
using (exists (select 1 from public.classrooms c where c.id = classroom_modules.classroom_id and c.teacher_id = private.current_teacher_workspace_owner()))
with check (exists (select 1 from public.classrooms c where c.id = classroom_modules.classroom_id and c.teacher_id = private.current_teacher_workspace_owner()));
create policy "Collaborators manage owner quiz assignments" on public.classroom_quizzes for all to authenticated
using (exists (select 1 from public.classrooms c where c.id = classroom_quizzes.classroom_id and c.teacher_id = private.current_teacher_workspace_owner()))
with check (exists (select 1 from public.classrooms c where c.id = classroom_quizzes.classroom_id and c.teacher_id = private.current_teacher_workspace_owner()));
create policy "Collaborators read owner students" on public.profiles for select to authenticated
using (exists (
  select 1 from public.classroom_members cm join public.classrooms c on c.id = cm.classroom_id
  where cm.student_id = profiles.id and c.teacher_id = private.current_teacher_workspace_owner()
));
create policy "Collaborators read owner quiz attempts" on public.quiz_attempts for select to authenticated
using (exists (select 1 from public.teacher_quizzes q where q.id = quiz_attempts.quiz_id and q.created_by = private.current_teacher_workspace_owner()));

-- Para retirar el permiso sin borrar las clases creadas:
-- update public.teacher_collaborators
-- set active = false, revoked_at = now()
-- where lower(collaborator_email) = 'naihara.fragozo@gimsaber.edu.co';
