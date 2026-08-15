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

-- Préstamos y cuotas

create table if not exists public.prestamos (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  cliente_nombre        text not null,
  capital_inicial       numeric not null,
  tasa_interes_mensual  numeric not null,
  plazo_meses           int not null default 6,
  fecha_inicio          date not null,
  estado                text not null default 'activo' check (estado in ('activo', 'pagado_completo', 'vencido', 'archivado')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists public.cuotas (
  id                    uuid primary key default gen_random_uuid(),
  prestamo_id           uuid not null references public.prestamos (id) on delete cascade,
  mes                   int not null,
  fecha_vencimiento     date not null,
  interes_mensual       numeric not null,
  amortizacion_capital  numeric not null,
  cuota_total           numeric not null,
  monto_pagado          numeric not null default 0,
  fecha_pago            timestamptz,
  estado                text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'pagado_parcial', 'vencido')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists cuotas_prestamo_id_idx on public.cuotas (prestamo_id);
create index if not exists prestamos_user_id_idx on public.prestamos (user_id);

alter table public.prestamos enable row level security;
alter table public.cuotas enable row level security;

drop policy if exists "users manage own prestamos" on public.prestamos;
create policy "users manage own prestamos" on public.prestamos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users manage own cuotas" on public.cuotas;
create policy "users manage own cuotas" on public.cuotas
  for all using (
    exists (select 1 from public.prestamos where prestamos.id = cuotas.prestamo_id and prestamos.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.prestamos where prestamos.id = cuotas.prestamo_id and prestamos.user_id = auth.uid())
  );

-- Historial de pagos

create table if not exists public.historial_pagos (
  id          uuid primary key default gen_random_uuid(),
  cuota_id    uuid not null references public.cuotas (id) on delete cascade,
  monto       numeric not null,
  fecha_pago  timestamptz not null,
  metodo      text not null default 'efectivo' check (metodo in ('efectivo', 'transferencia', 'otro')),
  notas       text,
  created_at  timestamptz not null default now()
);

create index if not exists historial_pagos_cuota_id_idx on public.historial_pagos (cuota_id);

alter table public.historial_pagos enable row level security;

-- Allow archiving prestamos (idempotent: widens the check constraint if it already exists without 'archivado')
alter table public.prestamos drop constraint if exists prestamos_estado_check;
alter table public.prestamos add constraint prestamos_estado_check
  check (estado in ('activo', 'pagado_completo', 'vencido', 'archivado'));

drop policy if exists "users manage own historial_pagos" on public.historial_pagos;
create policy "users manage own historial_pagos" on public.historial_pagos
  for all using (
    exists (
      select 1
      from public.cuotas
      join public.prestamos on prestamos.id = cuotas.prestamo_id
      where cuotas.id = historial_pagos.cuota_id and prestamos.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.cuotas
      join public.prestamos on prestamos.id = cuotas.prestamo_id
      where cuotas.id = historial_pagos.cuota_id and prestamos.user_id = auth.uid()
    )
  );

-- Suscripciones push (Web Push API) para notificaciones nativas de cuotas por vencer

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "users manage own push_subscriptions" on public.push_subscriptions;
create policy "users manage own push_subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Documentos (constancias) por préstamo, respaldados en Supabase Storage (bucket "documentos-prestamos")

create table if not exists public.documentos (
  id              uuid primary key default gen_random_uuid(),
  prestamo_id     uuid not null references public.prestamos (id) on delete cascade,
  nombre_archivo  text not null,
  url_archivo     text not null,
  tipo_archivo    text not null,
  tamaño          int not null,
  created_at      timestamptz not null default now()
);

create index if not exists documentos_prestamo_id_idx on public.documentos (prestamo_id);

alter table public.documentos enable row level security;

-- Reemplaza una política legacy SELECT-only que quedó de una configuración manual anterior.
drop policy if exists "Users can view their own documentos" on public.documentos;
drop policy if exists "users manage own documentos" on public.documentos;
create policy "users manage own documentos" on public.documentos
  for all using (
    exists (select 1 from public.prestamos where prestamos.id = documentos.prestamo_id and prestamos.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.prestamos where prestamos.id = documentos.prestamo_id and prestamos.user_id = auth.uid())
  );

-- Storage: bucket privado "documentos-prestamos". Cada archivo vive en
-- {user_id}/{prestamo_id}/{timestamp}-{nombre}, así que basta con exigir que el primer
-- segmento del path coincida con auth.uid() para aislar a cada usuario de los demás.
insert into storage.buckets (id, name, public)
values ('documentos-prestamos', 'documentos-prestamos', false)
on conflict (id) do nothing;

drop policy if exists "users manage own documentos storage" on storage.objects;
create policy "users manage own documentos storage" on storage.objects
  for all using (
    bucket_id = 'documentos-prestamos' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'documentos-prestamos' and (storage.foldername(name))[1] = auth.uid()::text
  );
