-- ChemQuest: estructura académica inicial.
-- IMPORTANTE: este archivo está preparado para una etapa posterior.
-- No lo ejecutes en Supabase hasta revisarlo junto con el equipo.

-- Cada docente tiene un único grado asignado. Los estudiantes no necesitan
-- guardar el grado: este se obtiene del salón al que pertenecen.
alter table public.profiles
  add column if not exists assigned_grade smallint
  check (assigned_grade in (8, 10));

-- Un salón pertenece a un docente y tiene un código corto para identificarlo.
create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  grade smallint not null check (grade in (8, 10)),
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  join_code text not null unique
    default lpad((floor(random() * 1000000))::integer::text, 6, '0')
    check (join_code ~ '^[0-9]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cada módulo representa una clase o unidad de estudio reutilizable.
create table if not exists public.study_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 120),
  description text not null default '',
  grade smallint not null check (grade in (8, 10)),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Relación entre estudiantes y salones.
create table if not exists public.classroom_members (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (classroom_id, student_id)
);

-- Relación entre los módulos y los salones donde se enseñan.
create table if not exists public.classroom_modules (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  module_id uuid not null references public.study_modules(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  primary key (classroom_id, module_id)
);

create index if not exists classrooms_teacher_idx
  on public.classrooms(teacher_id);
create index if not exists classroom_members_student_idx
  on public.classroom_members(student_id);
create index if not exists study_modules_creator_idx
  on public.study_modules(created_by);

-- Funciones internas usadas por las reglas de seguridad.
create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function private.can_manage_classroom(target_classroom uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.classrooms
    where id = target_classroom
      and (
        teacher_id = (select auth.uid())
        or private.current_user_role() = 'admin'
      )
  );
$$;

-- Permite mostrar el perfil de un estudiante únicamente al docente de uno de
-- sus salones. Los administradores pueden consultar cualquier perfil.
create or replace function private.can_read_student_profile(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.current_user_role() = 'admin'
    or exists (
      select 1
      from public.classrooms classroom
      join public.classroom_members membership
        on membership.classroom_id = classroom.id
      where classroom.teacher_id = (select auth.uid())
        and membership.student_id = target_profile
    );
$$;

revoke all on function private.current_user_role() from public, anon;
revoke all on function private.can_manage_classroom(uuid) from public, anon;
revoke all on function private.can_read_student_profile(uuid) from public, anon;

-- EXECUTE no es suficiente por sí solo: las políticas también necesitan poder
-- resolver las funciones que viven dentro del esquema private.
revoke usage on schema private from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.can_manage_classroom(uuid) to authenticated;
grant execute on function private.can_read_student_profile(uuid) to authenticated;

-- Actualiza automáticamente la fecha cuando cambia un salón o módulo.
drop trigger if exists set_classroom_updated_at_before_update on public.classrooms;
create trigger set_classroom_updated_at_before_update
  before update on public.classrooms
  for each row execute function private.set_profile_updated_at();

drop trigger if exists set_module_updated_at_before_update on public.study_modules;
create trigger set_module_updated_at_before_update
  before update on public.study_modules
  for each row execute function private.set_profile_updated_at();

-- RLS es la barrera que impide consultar o cambiar datos ajenos.
alter table public.classrooms enable row level security;
alter table public.study_modules enable row level security;
alter table public.classroom_members enable row level security;
alter table public.classroom_modules enable row level security;

revoke all on public.classrooms from anon, authenticated;
revoke all on public.study_modules from anon, authenticated;
revoke all on public.classroom_members from anon, authenticated;
revoke all on public.classroom_modules from anon, authenticated;

grant select, insert, delete on public.classrooms to authenticated;
grant update (name) on public.classrooms to authenticated;
grant select, insert, delete on public.study_modules to authenticated;
grant update (title, description) on public.study_modules to authenticated;
grant select, insert, delete on public.classroom_members to authenticated;
grant select, insert, delete on public.classroom_modules to authenticated;

-- Amplía la lectura de perfiles sin exponer el directorio completo: un
-- docente solo puede ver estudiantes inscritos en sus propios salones.
drop policy if exists "Teachers read classroom student profiles" on public.profiles;
create policy "Teachers read classroom student profiles"
  on public.profiles for select to authenticated
  using (private.can_read_student_profile(id));

-- Salones: los docentes administran los propios; los estudiantes ven aquellos
-- en los que están inscritos; un administrador puede administrarlos todos.
drop policy if exists "Members read their classrooms" on public.classrooms;
create policy "Members read their classrooms"
  on public.classrooms for select to authenticated
  using (
    teacher_id = (select auth.uid())
    or private.current_user_role() = 'admin'
    or exists (
      select 1 from public.classroom_members
      where classroom_id = classrooms.id
        and student_id = (select auth.uid())
    )
  );

drop policy if exists "Teachers create classrooms" on public.classrooms;
create policy "Teachers create classrooms"
  on public.classrooms for insert to authenticated
  with check (
    (
      teacher_id = (select auth.uid())
      and private.current_user_role() = 'teacher'
      and grade = (
        select assigned_grade
        from public.profiles
        where id = (select auth.uid())
      )
    )
    or private.current_user_role() = 'admin'
  );

drop policy if exists "Owners update classrooms" on public.classrooms;
create policy "Owners update classrooms"
  on public.classrooms for update to authenticated
  using (private.can_manage_classroom(id))
  with check (private.can_manage_classroom(id));

drop policy if exists "Owners delete classrooms" on public.classrooms;
create policy "Owners delete classrooms"
  on public.classrooms for delete to authenticated
  using (private.can_manage_classroom(id));

-- Inscripciones: un estudiante ve su inscripción; el docente dueño del salón
-- puede consultar, agregar o retirar integrantes.
drop policy if exists "Members read classroom memberships" on public.classroom_members;
create policy "Members read classroom memberships"
  on public.classroom_members for select to authenticated
  using (
    student_id = (select auth.uid())
    or private.can_manage_classroom(classroom_id)
  );

drop policy if exists "Owners add classroom members" on public.classroom_members;
create policy "Owners add classroom members"
  on public.classroom_members for insert to authenticated
  with check (private.can_manage_classroom(classroom_id));

drop policy if exists "Owners remove classroom members" on public.classroom_members;
create policy "Owners remove classroom members"
  on public.classroom_members for delete to authenticated
  using (private.can_manage_classroom(classroom_id));

-- Inscripción mediante código. Se implementa como función SECURITY DEFINER
-- para no abrir INSERT directo a estudiantes ni permitir elegir otro UUID.
create or replace function public.join_classroom_by_code(requested_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_classroom_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Debes iniciar sesión para unirte a un salón.'
      using errcode = '42501';
  end if;

  if private.current_user_role() is distinct from 'student' then
    raise exception 'Solo una cuenta de estudiante puede unirse con un código.'
      using errcode = '42501';
  end if;

  select id
    into target_classroom_id
  from public.classrooms
  where join_code = upper(trim(requested_code));

  if target_classroom_id is null then
    raise exception 'El código del salón no es válido.'
      using errcode = 'P0002';
  end if;

  insert into public.classroom_members (classroom_id, student_id)
  values (target_classroom_id, (select auth.uid()))
  on conflict (classroom_id, student_id) do nothing;

  return target_classroom_id;
end;
$$;

revoke all on function public.join_classroom_by_code(text) from public, anon;
grant execute on function public.join_classroom_by_code(text) to authenticated;

-- Módulos: docentes y administradores pueden crearlos. Un estudiante solo ve
-- los que estén asignados a alguno de sus salones.
drop policy if exists "Users read available modules" on public.study_modules;
create policy "Users read available modules"
  on public.study_modules for select to authenticated
  using (
    created_by = (select auth.uid())
    or private.current_user_role() = 'admin'
    or exists (
      select 1
      from public.classroom_modules cm
      join public.classroom_members membership
        on membership.classroom_id = cm.classroom_id
      where cm.module_id = study_modules.id
        and membership.student_id = (select auth.uid())
    )
  );

drop policy if exists "Teachers create modules" on public.study_modules;
create policy "Teachers create modules"
  on public.study_modules for insert to authenticated
  with check (
    (
      created_by = (select auth.uid())
      and private.current_user_role() = 'teacher'
      and grade = (
        select assigned_grade
        from public.profiles
        where id = (select auth.uid())
      )
    )
    or private.current_user_role() = 'admin'
  );

drop policy if exists "Creators update modules" on public.study_modules;
create policy "Creators update modules"
  on public.study_modules for update to authenticated
  using (created_by = (select auth.uid()) or private.current_user_role() = 'admin')
  with check (created_by = (select auth.uid()) or private.current_user_role() = 'admin');

drop policy if exists "Creators delete modules" on public.study_modules;
create policy "Creators delete modules"
  on public.study_modules for delete to authenticated
  using (created_by = (select auth.uid()) or private.current_user_role() = 'admin');

-- Asignaciones: todos los integrantes pueden leerlas, pero solo quien
-- administra el salón puede crearlas o eliminarlas.
drop policy if exists "Members read module assignments" on public.classroom_modules;
create policy "Members read module assignments"
  on public.classroom_modules for select to authenticated
  using (
    private.can_manage_classroom(classroom_id)
    or exists (
      select 1 from public.classroom_members
      where classroom_id = classroom_modules.classroom_id
        and student_id = (select auth.uid())
    )
  );

drop policy if exists "Owners assign modules" on public.classroom_modules;
create policy "Owners assign modules"
  on public.classroom_modules for insert to authenticated
  with check (
    private.can_manage_classroom(classroom_id)
    and assigned_by = (select auth.uid())
  );

drop policy if exists "Owners unassign modules" on public.classroom_modules;
create policy "Owners unassign modules"
  on public.classroom_modules for delete to authenticated
  using (private.can_manage_classroom(classroom_id));
