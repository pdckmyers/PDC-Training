-- A one-time welcome video shown to an employee right after they land on
-- /modules, before they've seen any training content. The video itself
-- is admin-configurable (not tied to any one module), so it needs
-- somewhere site-wide to live -- a singleton settings table, following
-- the same "publicly readable, admin writable" shape as locations /
-- departments.

create table if not exists public.app_settings (
  -- A boolean primary key that must be true is a cheap way to enforce
  -- "this table only ever has one row" -- any second insert collides on
  -- the primary key.
  id boolean primary key default true,
  welcome_video_url text,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id)
);

alter table public.app_settings enable row level security;

create policy "app_settings are publicly readable"
  on public.app_settings for select
  using (true);

create policy "admins can update app_settings"
  on public.app_settings for update
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute procedure public.set_updated_at();

insert into public.app_settings (id) values (true) on conflict (id) do nothing;

-- Per-employee "have they seen it yet" flag.
alter table public.profiles
  add column if not exists welcome_video_seen_at timestamptz;

-- Backfill: everyone who already has an account has already been
-- through training without a welcome video, so they shouldn't suddenly
-- have one pop up on their next login. Only accounts created from here
-- on out start with welcome_video_seen_at = null.
update public.profiles
set welcome_video_seen_at = created_at
where welcome_video_seen_at is null;
