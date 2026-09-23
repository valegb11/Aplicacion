-- Resultados de quizzes creados por docentes.
begin;

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.teacher_quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  score smallint not null check (score >= 0),
  total_questions smallint not null check (total_questions > 0),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  answers jsonb not null default '[]'::jsonb,
  attempted_at timestamptz not null default now(),
  unique (quiz_id, student_id)
);

alter table public.quiz_attempts enable row level security;
revoke all on public.quiz_attempts from public, anon, authenticated;
grant select on public.quiz_attempts to authenticated;

drop policy if exists "Students read their quiz attempts" on public.quiz_attempts;
create policy "Students read their quiz attempts" on public.quiz_attempts for select to authenticated
using (student_id = (select auth.uid()));

drop policy if exists "Teachers read their quiz results" on public.quiz_attempts;
create policy "Teachers read their quiz results" on public.quiz_attempts for select to authenticated
using (exists (
  select 1 from public.teacher_quizzes quiz
  where quiz.id = quiz_attempts.quiz_id and quiz.created_by = (select auth.uid())
));

create or replace function public.submit_teacher_quiz(requested_quiz uuid, submitted_answers jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  question_total integer;
  correct_total integer;
  calculated_xp integer;
  previous_xp integer;
  awarded_xp integer;
begin
  if (select auth.uid()) is null then raise exception 'Debes iniciar sesión.' using errcode = '42501'; end if;
  if jsonb_typeof(submitted_answers) is distinct from 'array' then raise exception 'Las respuestas no son válidas.'; end if;
  if not exists (
    select 1 from public.teacher_quizzes quiz
    join public.classroom_quizzes cq on cq.quiz_id = quiz.id
    join public.classroom_members cm on cm.classroom_id = cq.classroom_id
    where quiz.id = requested_quiz and quiz.status = 'published' and cm.student_id = (select auth.uid())
  ) then raise exception 'Este quiz no está disponible para tu salón.' using errcode = '42501'; end if;

  select count(*)::integer into question_total from public.quiz_questions where quiz_id = requested_quiz;
  if question_total = 0 or jsonb_array_length(submitted_answers) <> question_total then raise exception 'Debes responder todas las preguntas.'; end if;
  select count(*)::integer into correct_total from public.quiz_questions question
  where question.quiz_id = requested_quiz
    and (submitted_answers ->> (question.position - 1))::integer = question.correct_option;
  calculated_xp := correct_total * 20 + case when correct_total = question_total then 20 else 0 end;
  select coalesce(xp_earned, 0) into previous_xp from public.quiz_attempts where quiz_id = requested_quiz and student_id = (select auth.uid());
  previous_xp := coalesce(previous_xp, 0);
  awarded_xp := greatest(0, calculated_xp - previous_xp);

  insert into public.quiz_attempts (quiz_id, student_id, score, total_questions, xp_earned, answers)
  values (requested_quiz, (select auth.uid()), correct_total, question_total, calculated_xp, submitted_answers)
  on conflict (quiz_id, student_id) do update set
    score = greatest(public.quiz_attempts.score, excluded.score),
    total_questions = excluded.total_questions,
    xp_earned = greatest(public.quiz_attempts.xp_earned, excluded.xp_earned),
    answers = case when excluded.score >= public.quiz_attempts.score then excluded.answers else public.quiz_attempts.answers end,
    attempted_at = now();

  return jsonb_build_object('score', correct_total, 'total', question_total, 'awarded_xp', awarded_xp);
end;
$$;
revoke all on function public.submit_teacher_quiz(uuid, jsonb) from public, anon;
grant execute on function public.submit_teacher_quiz(uuid, jsonb) to authenticated;
commit;
