-- Add a "day" folder layer between department and modules:
-- Location -> Department -> Day -> Modules.

create table if not exists public.days (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.days enable row level security;

create policy "days are publicly readable"
  on public.days for select
  using (true);

create policy "admins can insert days"
  on public.days for insert
  with check (public.is_admin());

create policy "admins can update days"
  on public.days for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can delete days"
  on public.days for delete
  using (public.is_admin());

create index if not exists days_department_id_idx on public.days (department_id);

alter table public.modules
  add column if not exists day_id uuid references public.days (id) on delete set null;

-- Preserve existing department-scoped modules: bucket each department's
-- modules into an auto-created "Day 1" folder rather than dropping them
-- back to "general" visibility.
do $$
declare
  dept record;
  new_day_id uuid;
begin
  for dept in
    select distinct department_id from public.modules where department_id is not null
  loop
    insert into public.days (department_id, title, sort_order)
    values (dept.department_id, 'Day 1', 0)
    returning id into new_day_id;

    update public.modules set day_id = new_day_id where department_id = dept.department_id;
  end loop;
end $$;

create index if not exists modules_day_id_idx on public.modules (day_id);

alter table public.modules drop column if exists department_id;
