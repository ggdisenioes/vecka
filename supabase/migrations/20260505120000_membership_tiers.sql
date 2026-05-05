-- Membership tiers and grants.
--
-- A "tier" groups one or more existing courses (those marked is_membership = true)
-- under a single membership level (e.g. "Básico", "Premium"). Granting a user a
-- membership_grants row propagates to course_enrollments rows for every course in
-- the tier via trigger, so the existing has_active_course_access() function and
-- RLS policies keep working unchanged.

create table if not exists public.membership_tiers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  cover_image_url text,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.membership_tier_courses (
  tier_id uuid not null references public.membership_tiers(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (tier_id, course_id)
);

create index if not exists membership_tier_courses_course_idx
  on public.membership_tier_courses (course_id);

create table if not exists public.membership_grants (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.membership_tiers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_status text not null default 'active' check (access_status in ('active', 'expired', 'revoked')),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  granted_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tier_id, user_id)
);

create index if not exists membership_grants_user_idx
  on public.membership_grants (user_id);

-- Lesson type extensions for live sessions / articles / pure attachments.
alter table public.course_lessons
  add column if not exists lesson_type text not null default 'video';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'course_lessons_lesson_type_check'
  ) then
    alter table public.course_lessons
      add constraint course_lessons_lesson_type_check
      check (lesson_type in ('video', 'article', 'live_session', 'attachment'));
  end if;
end $$;

alter table public.course_lessons
  add column if not exists live_session_url text,
  add column if not exists live_session_at timestamptz;

-- Trigger function: keep course_enrollments in sync with membership_grants.
-- For every course attached to the tier, mirror the grant's access_status and
-- expiry. Inserts/updates grants -> upsert enrollments. Deletes grants -> mark
-- the matching enrollments as 'revoked' (we don't hard-delete to preserve any
-- audit/history other code may rely on).
create or replace function public.sync_membership_grant_enrollments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_user uuid;
  affected_tier uuid;
  affected_status text;
  affected_expiry timestamptz;
  course_row record;
begin
  if (tg_op = 'DELETE') then
    affected_user := old.user_id;
    affected_tier := old.tier_id;
    update public.course_enrollments e
    set access_status = 'revoked'
    where e.user_id = affected_user
      and e.course_id in (
        select course_id from public.membership_tier_courses where tier_id = affected_tier
      );
    return old;
  end if;

  affected_user := new.user_id;
  affected_tier := new.tier_id;
  affected_status := new.access_status;
  affected_expiry := new.expires_at;

  for course_row in
    select course_id from public.membership_tier_courses where tier_id = affected_tier
  loop
    insert into public.course_enrollments (course_id, user_id, access_status, granted_at, expires_at)
    values (course_row.course_id, affected_user, affected_status, new.granted_at, affected_expiry)
    on conflict (course_id, user_id) do update
      set access_status = excluded.access_status,
          expires_at = excluded.expires_at;
  end loop;

  return new;
end;
$$;

drop trigger if exists membership_grants_sync_enrollments on public.membership_grants;
create trigger membership_grants_sync_enrollments
after insert or update or delete on public.membership_grants
for each row execute procedure public.sync_membership_grant_enrollments();

-- When a course is linked to a tier after grants already exist, backfill enrollments
-- for every active grant of that tier so members immediately see the new course.
create or replace function public.sync_membership_tier_course_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.course_enrollments (course_id, user_id, access_status, granted_at, expires_at)
    select new.course_id, g.user_id, g.access_status, g.granted_at, g.expires_at
    from public.membership_grants g
    where g.tier_id = new.tier_id
    on conflict (course_id, user_id) do update
      set access_status = excluded.access_status,
          expires_at = excluded.expires_at;
    return new;
  end if;

  if (tg_op = 'DELETE') then
    -- Revoke enrollments on the unlinked course only for users whose only path
    -- to that course was through this tier (i.e. they don't hold another grant
    -- for a different tier that still includes the course).
    update public.course_enrollments e
    set access_status = 'revoked'
    where e.course_id = old.course_id
      and e.user_id in (select user_id from public.membership_grants where tier_id = old.tier_id)
      and not exists (
        select 1
        from public.membership_grants g2
        join public.membership_tier_courses tc2 on tc2.tier_id = g2.tier_id
        where g2.user_id = e.user_id
          and tc2.course_id = old.course_id
          and g2.tier_id <> old.tier_id
          and g2.access_status = 'active'
      );
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists membership_tier_courses_sync on public.membership_tier_courses;
create trigger membership_tier_courses_sync
after insert or delete on public.membership_tier_courses
for each row execute procedure public.sync_membership_tier_course_link();

-- updated_at triggers.
drop trigger if exists membership_tiers_set_updated_at on public.membership_tiers;
create trigger membership_tiers_set_updated_at
before update on public.membership_tiers
for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists membership_grants_set_updated_at on public.membership_grants;
create trigger membership_grants_set_updated_at
before update on public.membership_grants
for each row execute procedure public.set_current_timestamp_updated_at();

-- RLS.
alter table public.membership_tiers enable row level security;
alter table public.membership_tier_courses enable row level security;
alter table public.membership_grants enable row level security;

drop policy if exists "public_can_read_published_tiers" on public.membership_tiers;
create policy "public_can_read_published_tiers"
on public.membership_tiers
for select
to anon, authenticated
using (
  status = 'published' or public.has_staff_role(auth.uid())
);

drop policy if exists "public_can_read_tier_courses" on public.membership_tier_courses;
create policy "public_can_read_tier_courses"
on public.membership_tier_courses
for select
to anon, authenticated
using (
  public.has_staff_role(auth.uid())
  or exists (
    select 1 from public.membership_tiers t
    where t.id = membership_tier_courses.tier_id
      and t.status = 'published'
  )
);

drop policy if exists "users_can_read_own_grants_or_staff" on public.membership_grants;
create policy "users_can_read_own_grants_or_staff"
on public.membership_grants
for select
to authenticated
using (user_id = auth.uid() or public.has_staff_role(auth.uid()));
