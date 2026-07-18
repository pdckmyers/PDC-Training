-- PDC Training: initial schema
-- profiles, training modules, and completion tracking, with row-level
-- security so hires only ever see their own data and published content.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'hire' check (role in ('hire', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by their owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "profiles are editable by their owner (not role)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- New signups get a profile row automatically. The very first person to
-- sign up becomes admin so there's always someone who can author content
-- without anyone needing to hand-edit the database.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first_user boolean;
begin
  select not exists (select 1 from public.profiles) into is_first_user;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    case when is_first_user then 'admin' else 'hire' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- modules
-- ---------------------------------------------------------------------
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  body text not null default '',
  image_url text,
  video_url text,
  quiz jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.modules enable row level security;

create policy "published modules are readable by any signed-in user"
  on public.modules for select
  using (published = true or auth.uid() = created_by);

create policy "admins can read all modules"
  on public.modules for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "admins can write modules"
  on public.modules for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists modules_set_updated_at on public.modules;
create trigger modules_set_updated_at
  before update on public.modules
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- completions
-- ---------------------------------------------------------------------
create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  quiz_score integer,
  quiz_total integer,
  completed_at timestamptz not null default now(),
  unique (user_id, module_id)
);

alter table public.completions enable row level security;

create policy "users can read their own completions"
  on public.completions for select
  using (auth.uid() = user_id);

create policy "users can insert their own completions"
  on public.completions for insert
  with check (auth.uid() = user_id);

create policy "users can update their own completions"
  on public.completions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "admins can read all completions"
  on public.completions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
