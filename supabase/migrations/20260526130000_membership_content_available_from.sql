-- Release date used to segment Club VeCKA content by member cohort.
-- Founding members with a May 2025 active grant can see the full archive.
-- Standard members can see content from June 2025 onward.

alter table public.membership_content_items
  add column if not exists available_from timestamptz not null default now();

create index if not exists membership_content_items_available_from_idx
  on public.membership_content_items (tier_id, status, available_from);

update public.membership_content_items
set available_from = case legacy_wp_id
  when 7713 then '2023-12-27 18:14:37+00'::timestamptz
  when 10537 then '2025-01-14 07:42:04+00'::timestamptz
  when 12578 then '2025-06-24 09:33:23+00'::timestamptz
  when 12885 then '2025-08-04 07:13:29+00'::timestamptz
  when 14168 then '2026-03-04 11:18:41+00'::timestamptz
  when 14178 then '2026-03-04 11:45:28+00'::timestamptz
  when 14375 then '2026-04-06 11:43:05+00'::timestamptz
  when 14537 then '2026-05-12 06:33:10+00'::timestamptz
  else available_from
end
where legacy_wp_id in (7713, 10537, 12578, 12885, 14168, 14178, 14375, 14537);
