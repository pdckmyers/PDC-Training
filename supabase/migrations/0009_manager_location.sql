-- Scope managers to a single location: a manager only sees hires (and
-- their completions) whose department belongs to the manager's assigned
-- location, instead of every hire company-wide.

alter table public.profiles
  add column if not exists location_id uuid references public.locations (id) on delete set null;

-- Guard location_id the same way role is already guarded: RLS only
-- restricts which rows an update can touch, not which columns, so
-- without this a manager could self-assign a different location and see
-- another store's hires.
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
  if new.location_id is distinct from old.location_id and not public.is_admin() then
    raise exception 'Only admins can change a user''s location';
  end if;
  return new;
end;
$$;

-- Bypasses RLS internally (security definer) so it can be used inside
-- the profiles/completions policies below without the self-referencing
-- recursion that motivated is_admin() in the first place.
create or replace function public.manager_can_view_hire(hire_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles manager
    join public.profiles hire on hire.id = hire_id
    join public.departments d on d.id = hire.department_id
    where manager.id = auth.uid()
      and manager.role = 'manager'
      and hire.role = 'hire'
      and manager.location_id is not null
      and manager.location_id = d.location_id
  );
$$;

revoke all on function public.manager_can_view_hire(uuid) from public, anon, authenticated;
grant execute on function public.manager_can_view_hire(uuid) to authenticated;

drop policy if exists "profiles are readable by owner or manager or admin" on public.profiles;

create policy "profiles are readable by owner or admin or assigned manager"
  on public.profiles for select
  using (
    (select auth.uid()) = id
    or public.is_admin()
    or public.manager_can_view_hire(id)
  );

drop policy if exists "completions are readable by owner or manager or admin" on public.completions;

create policy "completions are readable by owner or admin or assigned manager"
  on public.completions for select
  using (
    (select auth.uid()) = user_id
    or public.is_admin()
    or public.manager_can_view_hire(user_id)
  );

-- No longer used now that manager visibility is location-scoped via
-- manager_can_view_hire() above.
drop function if exists public.is_manager_or_admin();
