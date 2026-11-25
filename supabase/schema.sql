-- Centre Kinésithérapie Florida
-- Same model as studio_dance: the public site never reads patient rows.
-- Run this once in the Supabase SQL editor.
-- Staff sign-in uses Supabase Auth (email + password, auto-confirm).

create extension if not exists btree_gist;

drop view if exists public.appointment_slots;
drop table if exists public.appointments;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  service_id text not null,
  service_name text not null,
  date date not null,
  start_minutes integer not null check (start_minutes >= 0 and start_minutes < 1440),
  duration_minutes integer not null check (duration_minutes > 0),
  price_mad integer not null check (price_mad >= 0),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  locale text not null default 'fr' check (locale in ('fr', 'ar')),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_date_idx on public.bookings (date);
create index if not exists bookings_status_idx on public.bookings (status);

alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (
    date with =,
    int4range(start_minutes, start_minutes + duration_minutes) with &&
  )
  where (status in ('pending', 'confirmed'));

alter table public.bookings enable row level security;

-- Busy times only. No name, phone, or email.
create or replace function public.get_busy_slots(p_date date)
returns table (start_minutes int, duration_minutes int)
language sql
stable
security definer
set search_path = public
as $$
  select b.start_minutes, b.duration_minutes
  from public.bookings b
  where b.date = p_date
    and b.status in ('pending', 'confirmed');
$$;

revoke all on function public.get_busy_slots(date) from public;
grant execute on function public.get_busy_slots(date) to anon, authenticated, service_role;

alter table public.bookings add column if not exists pay_by timestamptz;

-- Weekday 0 = Sunday … 6 = Saturday. Default grid is 09:00–18:00, editable in /admin/horaires.
create table if not exists public.opening_hours (
  weekday smallint primary key check (weekday between 0 and 6),
  is_open boolean not null default true,
  open_minutes integer not null check (open_minutes >= 0 and open_minutes < 1440),
  close_minutes integer not null check (close_minutes > 0 and close_minutes <= 1440)
);

insert into public.opening_hours (weekday, is_open, open_minutes, close_minutes)
values
  (0, true, 540, 1080),
  (1, true, 540, 1080),
  (2, true, 540, 1080),
  (3, true, 540, 1080),
  (4, true, 540, 1080),
  (5, true, 540, 1080),
  (6, true, 540, 1080)
on conflict (weekday) do nothing;

alter table public.opening_hours enable row level security;

-- Soins and packs added from the dashboard. The printed catalogue stays in the app.
create table if not exists public.added_services (
  id text primary key,
  family text not null check (family in ('kine', 'slim', 'body', 'face', 'water')),
  name_fr text not null,
  name_ar text not null,
  minutes integer check (minutes is null or minutes > 0),
  price_mad integer not null check (price_mad >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.added_packs (
  id text primary key,
  name_fr text not null,
  name_ar text not null,
  detail_fr text not null,
  detail_ar text not null,
  minutes integer check (minutes is null or minutes > 0),
  prices jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.added_services enable row level security;
alter table public.added_packs enable row level security;

-- One row, edited from /admin/parametres. Empty email stays "à confirmer" on the site.
create table if not exists public.centre_settings (
  id integer primary key default 1 check (id = 1),
  address text not null,
  phone text not null,
  instagram text not null,
  email text not null default ''
);

insert into public.centre_settings (id, address, phone, instagram, email)
values (
  1,
  'Lotissement El Fath 2, Rue 56 N° 78, Sidi Maarouf, Casablanca 20270',
  '05 22 78 63 29',
  'https://www.instagram.com/florida.kine/',
  ''
)
on conflict (id) do nothing;

alter table public.centre_settings enable row level security;

-- The new secret key acts as service_role and needs explicit table rights.
grant select, insert, update, delete on table public.bookings to service_role;
grant select, insert, update, delete on table public.opening_hours to service_role;
grant select, insert, update, delete on table public.added_services to service_role;
grant select, insert, update, delete on table public.added_packs to service_role;
grant select, insert, update, delete on table public.centre_settings to service_role;
