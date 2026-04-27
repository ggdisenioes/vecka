alter table public.course_modules
add column if not exists video_provider text not null default 'none'
  check (video_provider in ('vimeo', 'external', 'none')),
add column if not exists vimeo_url text,
add column if not exists external_video_url text,
add column if not exists video_duration_seconds integer;
