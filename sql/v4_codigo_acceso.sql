-- v4: código de acceso único que el inquilino le da al encargado para vincularse
alter table public.users
  add column if not exists codigo_acceso text unique;

create index if not exists idx_users_codigo_acceso on public.users (codigo_acceso);
