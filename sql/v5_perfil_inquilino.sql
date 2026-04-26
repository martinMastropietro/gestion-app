-- v5: campos de perfil personal en users para inquilinos
--   Al vincularse, estos datos se copian automáticamente a la unidad.
alter table public.users
  add column if not exists nombre   text,
  add column if not exists dni      text,
  add column if not exists email    text,
  add column if not exists telefono text;
 