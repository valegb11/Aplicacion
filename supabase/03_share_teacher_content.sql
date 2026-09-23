-- Comparte clases y quizzes con los salones del docente que tengan el mismo grado.
begin;

create table if not exists public.classroom_quizzes (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  quiz_id uuid not null references public.teacher_quizzes(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  primary key (classroom_id, quiz_id)
);
alter table public.classroom_quizzes enable row level security;
revoke all on public.classroom_quizzes from anon, authenticated;
grant select on public.classroom_quizzes to authenticated;

create or replace function private.share_teacher_content_by_grade()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_TABLE_NAME = 'study_modules' then
    insert into public.classroom_modules (classroom_id, module_id, assigned_by)
    select c.id, new.id, new.created_by from public.classrooms c
    where c.teacher_id = new.created_by and c.grade = new.grade on conflict do nothing;
  elsif TG_TABLE_NAME = 'teacher_quizzes' then
    insert into public.classroom_quizzes (classroom_id, quiz_id, assigned_by)
    select c.id, new.id, new.created_by from public.classrooms c
    where c.teacher_id = new.created_by and c.grade = new.grade on conflict do nothing;
  else
    insert into public.classroom_modules (classroom_id, module_id, assigned_by)
    select new.id, m.id, new.teacher_id from public.study_modules m
    where m.created_by = new.teacher_id and m.grade = new.grade on conflict do nothing;
    insert into public.classroom_quizzes (classroom_id, quiz_id, assigned_by)
    select new.id, q.id, new.teacher_id from public.teacher_quizzes q
    where q.created_by = new.teacher_id and q.grade = new.grade on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.share_teacher_content_by_grade() from public, anon, authenticated;
drop trigger if exists share_new_class on public.study_modules;
create trigger share_new_class after insert on public.study_modules for each row execute function private.share_teacher_content_by_grade();
drop trigger if exists share_new_quiz on public.teacher_quizzes;
create trigger share_new_quiz after insert on public.teacher_quizzes for each row execute function private.share_teacher_content_by_grade();
drop trigger if exists share_content_with_new_classroom on public.classrooms;
create trigger share_content_with_new_classroom after insert on public.classrooms for each row execute function private.share_teacher_content_by_grade();

insert into public.classroom_modules (classroom_id, module_id, assigned_by)
select c.id, m.id, m.created_by from public.study_modules m join public.classrooms c on c.teacher_id = m.created_by and c.grade = m.grade on conflict do nothing;
insert into public.classroom_quizzes (classroom_id, quiz_id, assigned_by)
select c.id, q.id, q.created_by from public.teacher_quizzes q join public.classrooms c on c.teacher_id = q.created_by and c.grade = q.grade on conflict do nothing;

drop policy if exists "Members read quiz assignments" on public.classroom_quizzes;
create policy "Members read quiz assignments" on public.classroom_quizzes for select to authenticated using (
  private.can_manage_classroom(classroom_id) or exists (
    select 1 from public.classroom_members where classroom_id = classroom_quizzes.classroom_id and student_id = (select auth.uid())
  )
);
drop policy if exists "Students read assigned published quizzes" on public.teacher_quizzes;
create policy "Students read assigned published quizzes" on public.teacher_quizzes for select to authenticated using (
  status = 'published' and exists (
    select 1 from public.classroom_quizzes cq join public.classroom_members cm on cm.classroom_id = cq.classroom_id
    where cq.quiz_id = teacher_quizzes.id and cm.student_id = (select auth.uid())
  )
);
drop policy if exists "Students read assigned quiz questions" on public.quiz_questions;
create policy "Students read assigned quiz questions" on public.quiz_questions for select to authenticated using (
  exists (
    select 1 from public.teacher_quizzes q join public.classroom_quizzes cq on cq.quiz_id = q.id
    join public.classroom_members cm on cm.classroom_id = cq.classroom_id
    where q.id = quiz_questions.quiz_id and q.status = 'published' and cm.student_id = (select auth.uid())
  )
);
commit;
