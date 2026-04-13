# Deploy en Render y Vercel

Fecha: 2026-04-13

Esta guia despliega el backend Flask en Render y el frontend Next.js en Vercel.

## 1. Backend en Render

El repo incluye `render.yaml` en la raiz. Ese archivo define un Web Service Python
con `rootDir: backend`, instala `backend/requirements.txt` y arranca la app con:

```bash
gunicorn app:app --bind 0.0.0.0:$PORT
```

### Opcion A: usar render.yaml

1. Subir el repositorio a GitHub.
2. Entrar a Render.
3. Crear un nuevo Blueprint o Web Service desde el repo.
4. Si Render detecta `render.yaml`, usar esa configuracion.
5. Cargar estas variables de entorno en Render:

```env
SUPABASE_URL=https://fsghbrcsmuwwcevregmi.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key_de_supabase>
FRONTEND_ORIGIN=https://<tu-app-de-vercel>.vercel.app
```

`FRONTEND_ORIGIN` se completa despues de tener la URL final de Vercel. Para una
primera prueba se puede usar `*`, pero para entrega conviene restringirlo al
origen real del frontend.

### Opcion B: crear Web Service manual

Settings recomendados:

```text
Language: Python 3
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app --bind 0.0.0.0:$PORT
```

Variables de entorno:

```env
SUPABASE_URL=https://fsghbrcsmuwwcevregmi.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key_de_supabase>
FRONTEND_ORIGIN=https://<tu-app-de-vercel>.vercel.app
```

Despues del deploy, probar:

```bash
curl https://<tu-backend-en-render>.onrender.com/ping
```

Respuesta esperada:

```json
{"message":"pong"}
```

## 2. Frontend en Vercel

El frontend vive en la raiz del repo y usa Next.js.

1. Entrar a Vercel.
2. Importar el repositorio desde GitHub.
3. Configurar el proyecto con estos valores:

```text
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Install Command: npm install
Output Directory: dejar por defecto
```

4. Cargar esta variable de entorno en Vercel, al menos para Production:

```env
NEXT_PUBLIC_API_BASE_URL=https://<tu-backend-en-render>.onrender.com
```

Importante: en Next.js las variables con prefijo `NEXT_PUBLIC_` se incorporan al
bundle del navegador durante el build. Si cambias `NEXT_PUBLIC_API_BASE_URL`,
tenes que redeployar el frontend.

## 3. Orden recomendado

1. Deployar backend en Render con `FRONTEND_ORIGIN=*` temporalmente o con el
   dominio Vercel si ya lo conoces.
2. Copiar la URL del backend de Render.
3. Deployar frontend en Vercel usando esa URL en `NEXT_PUBLIC_API_BASE_URL`.
4. Copiar la URL final de Vercel.
5. Actualizar `FRONTEND_ORIGIN` en Render con la URL final de Vercel.
6. Redeployar Render si la variable no reinicia automaticamente el servicio.
7. Probar registro, login y home.

## 4. Checklist de prueba

Backend:

```bash
curl https://<tu-backend-en-render>.onrender.com/ping
```

Frontend:

1. Abrir `https://<tu-app-de-vercel>.vercel.app`.
2. Crear cuenta.
3. Iniciar sesion.
4. Verificar redireccion a `/home`.
5. Confirmar que se ve el ID y el usuario.

## 5. Notas de seguridad

- No subir `.env`, `.env.local` ni claves reales al repositorio.
- `SUPABASE_SERVICE_KEY` solo debe existir en Render, nunca en Vercel.
- La app actual guarda contrasenas en texto plano porque ese fue el alcance de la
  V0. Para un despliegue real deberia agregarse hashing de contrasenas y una
  autenticacion basada en token o sesion.
