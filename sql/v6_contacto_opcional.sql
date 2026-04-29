-- v6: los campos de contacto de la unidad pasan a ser opcionales
--   Se llenan automáticamente cuando un inquilino se vincula con su código.
--   El encargado los puede cargar manualmente para unidades sin app.
alter table public.unidades
  alter column nombre_responsable drop not null,
  alter column dni_responsable    drop not null,
  alter column mail_responsable   drop not null,
  alter column tel_responsable    drop not null;
