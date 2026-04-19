```
└── 📁gestion-app
    └── 📁app
        └── 📁api
            └── 📁tasks
                └── 📁[id]
                    ├── route.js
                ├── route.js
        ├── layout.jsx
        ├── page.jsx
    └── 📁backend
        └── 📁.venv
        └── 📁modules
            └── 📁gastos
                ├── __init__.py
                ├── routes.py
            └── 📁usuarios
        ├── .env
        ├── app.py
        ├── database.py
        ├── Pipfile
        ├── Pipfile.lock
    └── 📁components
        ├── TaskCard.jsx
    └── 📁lib
        ├── supabase.js
    ├── .gitignore
    ├── jsconfig.json
    ├── next.config.js
    ├── package.json
    ├── Pipfile
    └── README.md
```
# Gestion App

Aplicacion V0 para el trabajo practico de Gestion del Desarrollo de Sistemas Informaticos. La V0 implementa un frontend en Next.js y un backend en Flask para crear usuarios, iniciar sesion y consultar el perfil del usuario autenticado.

## Requisitos

Instalar en Windows:

- Node.js LTS, idealmente Node 20 o 22.
- Python 3.12 o compatible.
- Git.
- Acceso al proyecto Supabase y a la `service_role key`.

Verificar las herramientas desde PowerShell:

```powershell
node -v
npm -v
python --version
git --version
```

## 1. Clonar el repositorio

```powershell
git clone <URL_DEL_REPO>
cd gestion-app
```

## 2. Instalar dependencias del frontend

Desde la raiz del repositorio:

```powershell
npm install
```

## 3. Configurar variables del frontend

Crear un archivo `.env.local` en la raiz del repositorio:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

El archivo `.env.example` deja ese valor como referencia.

## 4. Configurar la base de datos en Supabase

En el dashboard de Supabase, abrir el SQL Editor del proyecto y ejecutar:

```sql
create table if not exists public.users (
  id uuid primary key,
  username text not null unique,
  password text not null
);
```

El mismo script esta versionado en `sql/users.sql`.

Para esta V0, las contraseñas se guardan en texto plano segun el alcance definido para el trabajo practico.

## 5. Obtener la service_role key de Supabase

1. Entrar a <https://supabase.com/dashboard>.
2. Abrir el proyecto correspondiente.
3. Ir a **Project Settings**.
4. Entrar a **API Keys**.
5. Buscar la seccion **Legacy API Keys**.
6. Copiar la key llamada **service_role**.

Importante: no poner la `service_role key` en `.env.local` ni en codigo del frontend. Esa clave tiene permisos elevados y debe usarse solo desde el backend.

## 6. Configurar el backend Flask

Desde la raiz del repositorio:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Si PowerShell bloquea la activacion del entorno virtual, ejecutar una vez:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Luego activar nuevamente:

```powershell
.\.venv\Scripts\Activate.ps1
```

## 7. Configurar variables del backend

Dentro de la carpeta `backend`, crear un archivo `.env`:

```env
SUPABASE_URL=https://fsghbrcsmuwwcevregmi.supabase.co
SUPABASE_SERVICE_KEY=<TU_SUPABASE_SERVICE_ROLE_KEY>
FRONTEND_ORIGIN=http://localhost:3000
PORT=5000
```

El archivo `backend/.env.example` deja esos valores como referencia. Reemplazar `<TU_SUPABASE_SERVICE_ROLE_KEY>` por la clave real de Supabase.

## 8. Levantar el backend

En una terminal, desde `backend` y con el entorno virtual activo:

```powershell
python app.py
```

El backend deberia quedar disponible en:

```text
http://localhost:5000
```

Probar el endpoint de salud:

```powershell
curl http://localhost:5000/ping
```

Respuesta esperada:

```json
{"message":"pong"}
```

## 9. Levantar el frontend

Abrir otra terminal en la raiz del repositorio:

```powershell
npm run dev
```

El frontend deberia quedar disponible en:

```text
http://localhost:3000
```

## 10. Probar el flujo completo

1. Abrir `http://localhost:3000`.
2. Entrar a `Crear cuenta`.
3. Crear un usuario con contraseña.
4. Confirmar que la app redirige a `Iniciar sesion`.
5. Iniciar sesion con el usuario creado.
6. Confirmar que la app guarda el `userId` en `localStorage` y redirige a `/home`.
7. Confirmar que `/home` muestra el `ID` y el `Usuario`.

## Comandos resumidos

Terminal 1, backend:

```powershell
cd gestion-app\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Terminal 2, frontend:

```powershell
cd gestion-app
npm install
npm run dev
```

Antes de ejecutar esos comandos, crear:

- `gestion-app\.env.local`
- `gestion-app\backend\.env`
- La tabla `users` en Supabase

## Endpoints backend

- `GET /ping`
- `POST /users/create`
- `POST /users/login`
- `GET /user/<id>`

Ejemplo de creacion de usuario:

```json
{
  "user": "user",
  "password": "1234"
}
```

Ejemplo de respuesta de login:

```json
{
  "id": "abc123"
}
```
