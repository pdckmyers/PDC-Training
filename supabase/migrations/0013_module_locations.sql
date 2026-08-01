-- Lets a "Master Your Craft" (general, no day checked) module be scoped
-- to one or more locations instead of only two choices: "every day" via
-- module_days, or "every employee everywhere" when neither table has a
-- row for it. Mirrors module_days' structure and policies exactly.

create table if not exists public.module_locations (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (module_id, location_id)
);

alter table public.module_locations enable row level security;

create policy "module_locations are publicly readable"
  on public.module_locations for select
  using (true);

create policy "admins can insert module_locations"
  on public.module_locations for insert
  with check (public.is_admin());

create policy "admins can delete module_locations"
  on public.module_locations for delete
  using (public.is_admin());

create index if not exists module_locations_module_id_idx on public.module_locations (module_id);
create index if not exists module_locations_location_id_idx on public.module_locations (location_id);
