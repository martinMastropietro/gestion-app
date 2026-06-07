-- v7: tabla de configuración del consorcio
--   comision_porcentaje: % de comisión del administrador sobre gastos comunes
create table if not exists public.configuracion (
  clave        text         not null primary key,
  valor        numeric(10,4) not null default 0,
  descripcion  text,
  updated_at   timestamptz  not null default now()
);

insert into public.configuracion (clave, valor, descripcion)
values
  ('comision_porcentaje', 0, 'Porcentaje de comisión del administrador sobre gastos comunes')
on conflict (clave) do nothing;
