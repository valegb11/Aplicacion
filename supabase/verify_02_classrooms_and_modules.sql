-- ChemQuest: comprobación segura del paso 2.
-- Este archivo SOLO LEE información; no crea, modifica ni elimina datos.

-- 1. Confirma que existen las ocho tablas académicas.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'classrooms',
    'study_modules',
    'classroom_members',
    'classroom_modules',
    'teacher_grades',
    'student_progress',
    'teacher_quizzes',
    'quiz_questions'
  )
order by table_name;

-- 1.1 Confirma que el correo docente predeterminado tiene ambos grados.
select profile.email, profile.role, assignment.grade
from public.profiles profile
join public.teacher_grades assignment on assignment.teacher_id = profile.id
where lower(profile.email) = 'valentina.gonzalez@gimsaber.edu.co'
order by assignment.grade;

-- Resultado esperado: dos filas, una con grado 8 y otra con grado 10.

-- 2. Muestra si la seguridad RLS está activada en cada tabla.
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where pg_namespace.nspname = 'public'
  and relname in (
    'classrooms',
    'study_modules',
    'classroom_members',
    'classroom_modules',
    'teacher_grades',
    'student_progress',
    'teacher_quizzes',
    'quiz_questions'
  )
order by relname;

-- 3. Enumera las reglas de seguridad instaladas.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'classrooms',
    'study_modules',
    'classroom_members',
    'classroom_modules',
    'teacher_grades',
    'student_progress',
    'teacher_quizzes',
    'quiz_questions'
  )
order by tablename, policyname;

-- 4. Confirma que las funciones auxiliares y la inscripción por código existen.
select routine_schema, routine_name, routine_type
from information_schema.routines
where (routine_schema = 'private' and routine_name in (
    'current_user_role',
    'can_manage_classroom',
    'can_read_student_profile'
  ))
  or (routine_schema = 'public' and routine_name = 'join_classroom_by_code')
order by routine_schema, routine_name;

-- 5. authenticated necesita USAGE en private para que las políticas RLS
-- puedan resolver sus funciones. anon debe permanecer sin acceso.
select
  has_schema_privilege('authenticated', 'private', 'USAGE')
    as authenticated_can_use_private,
  has_schema_privilege('anon', 'private', 'USAGE')
    as anon_can_use_private,
  has_function_privilege(
    'authenticated',
    'public.join_classroom_by_code(text)',
    'EXECUTE'
  ) as authenticated_can_join_by_code,
  has_function_privilege(
    'anon',
    'public.join_classroom_by_code(text)',
    'EXECUTE'
  ) as anon_can_join_by_code;

-- Resultado esperado de la última consulta:
-- authenticated_can_use_private = true
-- anon_can_use_private = false
-- authenticated_can_join_by_code = true
-- anon_can_join_by_code = false
