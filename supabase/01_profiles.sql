-- ChemQuest: primera estructura de usuarios.
-- Este archivo se ejecutará una sola vez desde el SQL Editor de Supabase.

-- Los tres tipos de usuario que tendrá ChemQuest.
do $$
begin
  create type public.user_role as enum ('student', 'teacher', 'admin');
exception
  when duplicate_object then null;
end
$$;

-- Perfil público interno de cada cuenta autenticada.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Datos básicos y rol de las personas que usan ChemQuest.';

-- Índice útil para búsquedas administrativas por rol.
create index if not exists profiles_role_idx on public.profiles(role);

-- Funciones internas: no se exponen como operaciones públicas de la API.
create schema if not exists private;

create or replace function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.create_profile_for_new_user() from public;
revoke all on function private.create_profile_for_new_user() from anon, authenticated;

create or replace function private.set_profile_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_profile_updated_at() from public;
revoke all on function private.set_profile_updated_at() from anon, authenticated;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute function private.create_profile_for_new_user();

drop trigger if exists set_profile_updated_at_before_update on public.profiles;
create trigger set_profile_updated_at_before_update
  before update on public.profiles
  for each row execute function private.set_profile_updated_at();

-- Crea el perfil de cualquier cuenta que existiera antes de este script.
insert into public.profiles (id, email, full_name, avatar_url)
select
  id,
  coalesce(email, ''),
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', ''),
  raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;

-- Seguridad: nadie sin iniciar sesión puede consultar perfiles.
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;

-- Una persona autenticada puede leer su propia ficha y modificar únicamente
-- su nombre y fotografía. No puede cambiar su correo, rol ni identificador.
grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url)
  on table public.profiles to authenticated;

drop policy if exists "Users read their own profile" on public.profiles;
create policy "Users read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
