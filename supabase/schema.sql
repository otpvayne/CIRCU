-- CIRCU: auth-related tables (users, subscriptions) + RLS
-- Run once against the Supabase project (see scripts/apply-schema.mjs).

create extension if not exists pgcrypto;

create table if not exists public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null unique,
  rol        text not null default 'usuario' check (rol in ('admin', 'usuario')),
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users (id) on delete cascade,
  estado                text not null default 'activo' check (estado in ('activo', 'suspendido')),
  monto_mensual         numeric not null default 0,
  fecha_proximo_pago    date,
  dias_mora_actuales    integer not null default 0,
  razon_suspension      text,
  created_at            timestamptz not null default now()
);

create unique index if not exists subscriptions_user_id_key on public.subscriptions (user_id);

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;

-- Bypasses RLS (security definer) so policies below can check role without recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and rol = 'admin'
  );
$$;

drop policy if exists "users_select_self_or_admin" on public.users;
create policy "users_select_self_or_admin" on public.users
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self" on public.users
  for insert with check (auth.uid() = id);

drop policy if exists "subscriptions_select_self_or_admin" on public.subscriptions;
create policy "subscriptions_select_self_or_admin" on public.subscriptions
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "subscriptions_insert_self" on public.subscriptions;
create policy "subscriptions_insert_self" on public.subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "subscriptions_update_admin_only" on public.subscriptions;
create policy "subscriptions_update_admin_only" on public.subscriptions
  for update using (public.is_admin()) with check (public.is_admin());
