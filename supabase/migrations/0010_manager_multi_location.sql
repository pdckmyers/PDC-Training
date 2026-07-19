-- Let a manager be assigned to more than one location instead of just
-- one, mirroring the module_days many-to-many pattern.

create table if not exists public.manager_locations (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (manager_id, location_id)
);

alter table public.manager_locations enable row level security;

create index if not exists manager_locations_manager_id_idx
  on public.manager_locations (manager_id);
create index if not exists manager_locations_location_id_idx
  on public.manager_locations (location_id);

create policy "manager_locations are readable by owner or admin"
  on public.manager_locations for select
  using ((select auth.uid()) = manager_id or public.is_admin());

create policy "admins can insert manager_locations"
  on public.manager_locations for insert
  with check (public.is_admin());

create policy "admins can delete manager_locations"
  on public.manager_locations for delete
  using (public.is_admin());

-- Carry over each manager's existing single location before dropping
-- the column it lived on.
insert into public.manager_locations (manager_id, location_id)
select id, location_id from public.profiles
where role = 'manager' and location_id is not null
on conflict (manager_id, location_id) do nothing;

alter table public.profiles drop column if exists location_id;

-- role is still guarded here; location assignment is now guarded by
-- manager_locations' admin-only insert/delete policies instead of a
-- column on profiles.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change a user''s role';
  end if;
  return new;
end;
$$;

create or replace function public.manager_can_view_hire(hire_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles hire
    join public.departments d on d.id = hire.department_id
    join public.manager_locations ml on ml.location_id = d.location_id
    join public.profiles manager on manager.id = ml.manager_id
    where hire.id = hire_id
      and hire.role = 'hire'
      and manager.role = 'manager'
      and ml.manager_id = auth.uid()
  );
$$;
