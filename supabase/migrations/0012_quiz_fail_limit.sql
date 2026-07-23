-- Track failed quiz attempts so employees can be locked out after 2
-- fails (below 80%) instead of retaking indefinitely.

alter table public.completions
  add column if not exists failed_attempts integer not null default 0;
