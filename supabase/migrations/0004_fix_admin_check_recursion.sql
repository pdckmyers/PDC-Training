-- The RLS policies were checking "is this user an admin?" by querying
-- public.profiles from inside a policy that protects public.profiles
-- itself. That self-reference can silently fail to resolve instead of
-- raising a visible error, which is why the bootstrap admin's own
-- policies weren't recognizing them as admin. Fix: a SECURITY DEFINER
-- helper function bypasses RLS entirely for the admin check, so there's
-- no self-reference.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- profiles ---------------------------------------------------------
drop policy if exists "profiles are readable by owner or admin" on public.profiles;

create policy "profiles are readable by owner or admin"
  on public.profiles for select
  using ((select auth.uid()) = id or public.is_admin());

-- modules ------------------------------------------------------------
drop policy if exists "modules are readable by hires or admins" on public.modules;
drop policy if exists "admins can insert modules" on public.modules;
drop policy if exists "admins can update modules" on public.modules;
drop policy if exists "admins can delete modules" on public.modules;

create policy "modules are readable by hires or admins"
  on public.modules for select
  using (published = true or (select auth.uid()) = created_by or public.is_admin());

create policy "admins can insert modules"
  on public.modules for insert
  with check (public.is_admin());

create policy "admins can update modules"
  on public.modules for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins can delete modules"
  on public.modules for delete
  using (public.is_admin());

-- completions ----------------------------------------------------------
drop policy if exists "completions are readable by owner or admin" on public.completions;

create policy "completions are readable by owner or admin"
  on public.completions for select
  using ((select auth.uid()) = user_id or public.is_admin());
