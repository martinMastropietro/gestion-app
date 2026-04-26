-- v3: add role-based access control to users
--   rol: 'encargado' (default, preserves all existing users) | 'inquilino'
--   unidad_id: null for encargados, required for inquilinos

alter table public.users
  add column if not exists rol text not null default 'encargado',
  add column if not exists unidad_id uuid references public.unidades(id) on delete set null;

alter table public.users
  drop constraint if exists users_rol_valido;

alter table public.users
  add constraint users_rol_valido check (rol in ('encargado', 'inquilino'));

create index if not exists idx_users_rol on public.users (rol);
create index if not exists idx_users_unidad on public.users (unidad_id);
