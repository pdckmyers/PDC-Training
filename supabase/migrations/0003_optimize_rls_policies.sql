-- Consolidate overlapping permissive policies into one per action, and
-- wrap auth.uid() in a scalar subquery so Postgres evaluates it once per
-- query instead of once per row. Cheap to fix now; expensive to fix once
-- tables have real data.

-- profiles ---------------------------------------------------------
drop policy if exists "profiles are readable by their owner" on public.profiles;
drop policy if exists "admins can read all profiles" on public.profiles;
drop policy if exists "profiles are editable by their owner (not role)" on public.profiles;

create policy "profiles are readable by owner or admin"
  on public.profiles for select
  using (
    (select auth.uid()) = id
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "profiles are editable by their owner (not role)"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- modules ------------------------------------------------------------
drop policy if exists "published modules are readable by any signed-in user" on public.modules;
drop policy if exists "admins can read all modules" on public.modules;
drop policy if exists "admins can write modules" on public.modules;

create policy "modules are readable by hires or admins"
  on public.modules for select
  using (
    published = true
    or (select auth.uid()) = created_by
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "admins can insert modules"
  on public.modules for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "admins can update modules"
  on public.modules for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "admins can delete modules"
  on public.modules for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- completions ----------------------------------------------------------
drop policy if exists "users can read their own completions" on public.completions;
drop policy if exists "admins can read all completions" on public.completions;
drop policy if exists "users can insert their own completions" on public.completions;
drop policy if exists "users can update their own completions" on public.completions;

create policy "completions are readable by owner or admin"
  on public.completions for select
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

create policy "users can insert their own completions"
  on public.completions for insert
  with check ((select auth.uid()) = user_id);

create policy "users can update their own completions"
  on public.completions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- missing covering indexes on foreign keys --------------------------
create index if not exists modules_created_by_idx on public.modules (created_by);
create index if not exists completions_module_id_idx on public.completions (module_id);
