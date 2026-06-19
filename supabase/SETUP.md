# Migración a Supabase — Guía paso a paso

Objetivo: que los datos de contratos queden **privados** (solo accesibles con login) sin pagar nada, y que la chica de contratos no tenga que tocar GitHub nunca más.

---

## Paso 1 — Crear el proyecto Supabase (gratis)

1. Entrá a https://supabase.com → **Start your project** → registrate (podés usar tu cuenta de GitHub o un email).
2. **New project**:
   - **Name**: `balanz-contratos`
   - **Database Password**: poné una contraseña fuerte y **guardala** (no se usa en la app, pero la pide).
   - **Region**: elegí **South America (São Paulo)** (la más cercana a Argentina).
3. Esperá ~2 minutos a que se cree.

## Paso 2 — Crear la tabla (correr `schema.sql`)

1. En Supabase, menú izquierdo → **SQL Editor** → **New query**.
2. Abrí el archivo `supabase/schema.sql` de este proyecto, copiá TODO el contenido y pegalo.
3. Click en **Run**. Debería decir "Success".

## Paso 3 — Importar los contratos actuales (correr `import.sql`)

1. **SQL Editor** → **New query** de nuevo.
2. Abrí `supabase/import.sql`, copiá TODO y pegalo (es grande, está bien).
3. **Run**. Debería insertar 332 filas.
4. Verificá: menú **Table Editor** → tabla `contratos` → deberías ver las filas.

## Paso 4 — Crear los usuarios que van a entrar

1. Menú izquierdo → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Por cada persona (vos y la chica de contratos):
   - Email y contraseña.
   - **Marcá "Auto Confirm User"** (así puede entrar sin confirmar por mail).
3. (Opcional pero recomendado) En **Authentication → Providers → Email**, desactivá "Confirm email" para futuros usuarios.

## Paso 5 — Pasarme las credenciales públicas

1. Menú izquierdo → **Project Settings** (engranaje) → **API**.
2. Copiame estos dos valores (son seguros de compartir, están pensados para ir en el navegador):
   - **Project URL** (ej: `https://abcdxyz.supabase.co`)
   - **anon public key** (la clave larga bajo "Project API keys" → `anon` `public`)

> ⚠️ NO me pases la `service_role` key ni la Database Password. Solo Project URL + anon public.

---

Cuando tengas el Paso 5 listo, me pasás esos dos valores y yo termino la reescritura de la app (login real + lectura/escritura contra Supabase) y hacemos el cambio sin cortar el servicio.
