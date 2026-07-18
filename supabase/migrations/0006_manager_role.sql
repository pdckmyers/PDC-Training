-- Add a manager role: managers can view employee progress but can't
-- create/edit modules, locations, or change anyone's role. Only admins
-- can promote/demote between employee and manager.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('hire', 'manager', 'admin'));

create or replace function public.is_manager_or_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('manager', 'admin')
  );
$$;

revoke all on function public.is_manager_or_admin() from public, anon, authenticated;
grant execute on function public.is_manager_or_admin() to authenticated;

-- Block anyone but an admin from changing a role column, even on their
-- own row (RLS only guards which rows are touched, not which columns).
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

revoke all on function public.prevent_role_escalation() from public, anon, authenticated;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_role_escalation();

-- profiles: managers (and admins) can read everyone; admins can update
-- any profile (needed to change someone's role from the Team screen).
drop policy if exists "profiles are readable by owner or admin" on public.profiles;

create policy "profiles are readable by owner or manager or admin"
  on public.profiles for select
  using ((select auth.uid()) = id or public.is_manager_or_admin());

create policy "admins can update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- completions: managers (and admins) can read everyone's completions.
drop policy if exists "completions are readable by owner or admin" on public.completions;

create policy "completions are readable by owner or manager or admin"
  on public.completions for select
  using ((select auth.uid()) = user_id or public.is_manager_or_admin());
