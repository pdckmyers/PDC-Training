-- Locations and departments, so training can be organized as
-- Location -> Department -> Days, and admins can send a hire a direct
-- invite link that assigns them to their department automatically.

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;

create policy "locations are publicly readable"
  on public.locations for select
  using (true);

create policy "admins can write locations"
  on public.locations for insert
  with check (public.is_admin());

create policy "admins can update locations"
  on public.locations for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can delete locations"
  on public.locations for delete
  using (public.is_admin());

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.departments enable row level security;

create policy "departments are publicly readable"
  on public.departments for select
  using (true);

create policy "admins can insert departments"
  on public.departments for insert
  with check (public.is_admin());

create policy "admins can update departments"
  on public.departments for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can delete departments"
  on public.departments for delete
  using (public.is_admin());

create index if not exists departments_location_id_idx on public.departments (location_id);

-- Modules belong to a department (nullable = a general module shown to
-- every hire regardless of department).
alter table public.modules
  add column if not exists department_id uuid references public.departments (id) on delete set null;

create index if not exists modules_department_id_idx on public.modules (department_id);

-- A hire's assigned department (nullable = not assigned to one, sees
-- only general modules). Set automatically at signup when they sign up
-- through a department's invite link.
alter table public.profiles
  add column if not exists department_id uuid references public.departments (id) on delete set null;

-- Pick up department_id from signup metadata (see /join/[departmentId]).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first_user boolean;
begin
  select not exists (select 1 from public.profiles) into is_first_user;

  insert into public.profiles (id, email, full_name, role, department_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    case when is_first_user then 'admin' else 'hire' end,
    nullif(new.raw_user_meta_data ->> 'department_id', '')::uuid
  );
  return new;
end;
$$;
