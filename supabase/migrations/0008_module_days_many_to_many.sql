-- Let a single module be linked to multiple day folders (potentially
-- across different departments), so shared content only needs editing
-- once. Replaces the one-to-one modules.day_id column with a
-- many-to-many join table.

create table if not exists public.module_days (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  day_id uuid not null references public.days (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (module_id, day_id)
);

alter table public.module_days enable row level security;

create policy "module_days are publicly readable"
  on public.module_days for select
  using (true);

create policy "admins can insert module_days"
  on public.module_days for insert
  with check (public.is_admin());

create policy "admins can delete module_days"
  on public.module_days for delete
  using (public.is_admin());

create index if not exists module_days_module_id_idx on public.module_days (module_id);
create index if not exists module_days_day_id_idx on public.module_days (day_id);

-- Migrate existing single-day assignments into the join table.
insert into public.module_days (module_id, day_id)
select id, day_id from public.modules where day_id is not null
on conflict (module_id, day_id) do nothing;

alter table public.modules drop column if exists day_id;
