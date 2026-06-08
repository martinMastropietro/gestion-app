create extension if not exists pgcrypto;

create table if not exists public.gastos_particulares (
  id uuid not null default gen_random_uuid(),
  unidad_id uuid not null references public.unidades (id) on delete cascade,
  descripcion text not null,
  monto numeric(12,2) not null,
  fecha_creacion date not null,
  mes smallint not null,
  year smallint not null,
  created_at timestamptz not null default now(),
  constraint gastos_particulares_pkey primary key (id),
  constraint gastos_particulares_monto_positivo check (monto > 0),
  constraint gastos_particulares_mes_valido check (mes between 1 and 12),
  constraint gastos_particulares_year_valido check (year between 2000 and 9999)
);

create index if not exists idx_gastos_particulares_periodo
  on public.gastos_particulares (year, mes);

create index if not exists idx_gastos_particulares_unidad
  on public.gastos_particulares (unidad_id);
