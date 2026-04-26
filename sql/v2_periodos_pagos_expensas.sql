create extension if not exists pgcrypto;

alter table public.gastos_ordinarios
  add column if not exists fecha_creacion date,
  add column if not exists mes smallint,
  add column if not exists year smallint,
  add column if not exists se_repite_mensualmente boolean not null default false,
  add column if not exists origen_gasto_id uuid,
  add column if not exists created_at timestamptz not null default now();

update public.gastos_ordinarios
set fecha_creacion = coalesce(fecha_creacion, current_date)
where fecha_creacion is null;

update public.gastos_ordinarios
set mes = coalesce(mes, extract(month from fecha_creacion)::smallint)
where mes is null;

update public.gastos_ordinarios
set year = coalesce(year, extract(year from fecha_creacion)::smallint)
where year is null;

alter table public.gastos_ordinarios
  alter column fecha_creacion set not null,
  alter column mes set not null,
  alter column year set not null;

alter table public.gastos_ordinarios
  drop constraint if exists gastos_ordinarios_mes_valido,
  drop constraint if exists gastos_ordinarios_year_valido,
  drop constraint if exists gastos_ordinarios_origen_fk;

alter table public.gastos_ordinarios
  add constraint gastos_ordinarios_mes_valido check (mes between 1 and 12),
  add constraint gastos_ordinarios_year_valido check (year between 2000 and 9999),
  add constraint gastos_ordinarios_origen_fk
    foreign key (origen_gasto_id) references public.gastos_ordinarios (id) on delete set null;

create index if not exists idx_gastos_ordinarios_periodo
  on public.gastos_ordinarios (year, mes);

create index if not exists idx_gastos_ordinarios_origen_periodo
  on public.gastos_ordinarios (origen_gasto_id, year, mes);

create table if not exists public.expensas (
  id uuid not null default gen_random_uuid(),
  unidad_id uuid not null references public.unidades (id) on delete cascade,
  mes smallint not null,
  year smallint not null,
  monto numeric(12,2) not null,
  superficie numeric(10,2) not null,
  porcentaje numeric(9,4) not null,
  created_at timestamptz not null default now(),
  constraint expensas_pkey primary key (id),
  constraint expensas_mes_valido check (mes between 1 and 12),
  constraint expensas_year_valido check (year between 2000 and 9999),
  constraint expensas_monto_no_negativo check (monto >= 0),
  constraint expensas_superficie_positiva check (superficie > 0),
  constraint expensas_porcentaje_no_negativo check (porcentaje >= 0),
  constraint expensas_unidad_periodo_unique unique (unidad_id, mes, year)
);

create index if not exists idx_expensas_periodo
  on public.expensas (year, mes);

create table if not exists public.pagos (
  id uuid not null default gen_random_uuid(),
  unidad_id uuid not null references public.unidades (id) on delete cascade,
  fecha_pago date not null,
  mes smallint not null,
  year smallint not null,
  monto numeric(12,2) not null,
  observacion text,
  created_at timestamptz not null default now(),
  constraint pagos_pkey primary key (id),
  constraint pagos_mes_valido check (mes between 1 and 12),
  constraint pagos_year_valido check (year between 2000 and 9999),
  constraint pagos_monto_positivo check (monto > 0)
);

create index if not exists idx_pagos_unidad_fecha
  on public.pagos (unidad_id, fecha_pago desc);

create index if not exists idx_pagos_periodo
  on public.pagos (year, mes);
