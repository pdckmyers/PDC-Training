-- Let admins add a short "shift focus" description to a day, shown to
-- employees right under the day title.

alter table public.days
  add column if not exists description text;
