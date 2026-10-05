-- Recuperación aislada del inicio de sesión de ChemQuest.
-- Restaura la lectura directa del perfil y retira solo las políticas temporales
-- de colaboración. No elimina contenido académico.

begin;

-- Elimina las ampliaciones temporales de colaboración de tablas existentes.
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

-- Restaura la regla básica que funcionaba antes: cada usuario lee su perfil.
alter table public.profiles enable row level security;
grant select on table public.profiles to authenticated;

drop policy if exists "Users read their own profile" on public.profiles;
create policy "Users read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- Garantiza que la cuenta docente solicitada exista y tenga su rol correcto.
do $$
declare
  teacher_user auth.users%rowtype;
begin
  select * into teacher_user
  from auth.users
  where lower(email) = 'valentina.gonzalez@gimsaber.edu.co'
  limit 1;

  if teacher_user.id is null then
    raise exception 'No existe la cuenta valentina.gonzalez@gimsaber.edu.co en Authentication > Users';
  end if;

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    teacher_user.id,
    teacher_user.email,
    coalesce(teacher_user.raw_user_meta_data ->> 'full_name', teacher_user.raw_user_meta_data ->> 'name', 'Valentina Gonzalez'),
    teacher_user.raw_user_meta_data ->> 'avatar_url',
    'teacher'
  )
  on conflict (id) do update
  set email = excluded.email,
      role = 'teacher',
      full_name = case when coalesce(public.profiles.full_name, '') = '' then excluded.full_name else public.profiles.full_name end,
      avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  insert into public.teacher_grades (teacher_id, grade)
  values (teacher_user.id, 8), (teacher_user.id, 10)
  on conflict (teacher_id, grade) do nothing;
end $$;

commit;

select p.id, p.email, p.role, array_agg(tg.grade order by tg.grade) as grados
from public.profiles p
left join public.teacher_grades tg on tg.teacher_id = p.id
where lower(p.email) = 'valentina.gonzalez@gimsaber.edu.co'
group by p.id, p.email, p.role;

