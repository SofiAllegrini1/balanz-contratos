-- =========================================================
-- BALANZ Contract Intelligence — Esquema Supabase
-- Pegar y ejecutar en: Supabase > SQL Editor > New query
-- =========================================================

-- Tabla principal: un contrato por fila, el objeto completo en JSONB
-- (misma estructura que el JSON actual, migracion sin perdida)
create table if not exists public.contratos (
  id          text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Seguridad por fila: nadie lee/escribe sin estar logueado
alter table public.contratos enable row level security;

-- Limpia politicas previas si se re-ejecuta el script
drop policy if exists "leer autenticados"     on public.contratos;
drop policy if exists "insertar autenticados"  on public.contratos;
drop policy if exists "actualizar autenticados" on public.contratos;
drop policy if exists "borrar autenticados"    on public.contratos;

-- Solo usuarios logueados (rol authenticated) pueden operar.
-- El rol anonimo (anon) no tiene ninguna politica => no ve nada.
create policy "leer autenticados"
  on public.contratos for select
  to authenticated using (true);

create policy "insertar autenticados"
  on public.contratos for insert
  to authenticated with check (true);

create policy "actualizar autenticados"
  on public.contratos for update
  to authenticated using (true) with check (true);

create policy "borrar autenticados"
  on public.contratos for delete
  to authenticated using (true);
