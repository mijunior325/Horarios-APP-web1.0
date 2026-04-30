# Horarios APP Web 1.0

Aplicacion web para el registro de jornada laboral con autenticacion en Firebase.  
Permite marcar entrada/salida de turno, inicio/fin de lunch, visualizar historico de registros y administrar usuarios (perfil administrador).

---

## 1. Que hace el sistema

- **Login seguro** con Firebase Authentication.
- **Marcador de jornada** para registrar:
  - Entrada de turno (`PunchIn`)
  - Entrada de lunch (`LunchIn`)
  - Salida de lunch (`LunchOut`)
  - Salida de turno (`PunchOut`)
- **Vista de calendario/registros** con:
  - Tabla de turnos
  - Horas trabajadas calculadas automaticamente
  - Exportacion a Excel
  - Eliminacion masiva de registros visibles
- **Gestion de usuarios (admin)**:
  - Registro de nuevos usuarios
  - Eliminacion de usuario y sus registros de turnos
  - Filtro de registros por usuario

---

## 2. Stack tecnologico

- **Frontend:** React + Vite
- **Estilos:** Tailwind CSS + CSS propio
- **Ruteo:** React Router
- **Notificaciones:** react-hot-toast
- **Backend ligero:** Express (endpoint para operaciones administrativas)
- **Base de datos:** Firebase Firestore
- **Autenticacion:** Firebase Authentication
- **Reportes:** xlsx (exportacion a Excel)
- **Contenedores:** Docker + Docker Compose

---

## 3. Estructura del proyecto

```text
Horarios-APP-web1.0/
├─ src/
│  ├─ assets/
│  ├─ components/
│  ├─ context/
│  ├─ pages/
│  ├─ App.jsx
│  ├─ App.css
│  ├─ index.css
│  └─ main.jsx
├─ server/
│  ├─ config/
│  ├─ routes/
│  ├─ services/
│  └─ index.js
├─ Dockerfile
├─ docker-compose.yml
├─ vite.config.js
└─ package.json
```

---

## 4. Flujo funcional de la aplicacion

1. El usuario abre la aplicacion y entra por `/login`.
2. `LoginForm` usa `AuthContext.login()` para autenticar con Firebase.
3. `AuthContext` escucha `onAuthStateChanged`, obtiene perfil en Firestore y publica `userData`.
4. Al tener `userData`, la app redirige a `/marcador`.
5. En `Marcador`, el usuario marca su jornada:
   - Entrar al turno -> crea documento `timeShifts` abierto.
   - Entrar/salir lunch -> actualiza el turno abierto.
   - Salir del turno -> cierra el turno (valida lunch cerrado).
6. `CalendarDb` consulta registros y calcula horas trabajadas.
7. Si el usuario es admin, puede crear/eliminar usuarios y filtrar registros por usuario.

---

## 5. Variables de entorno (Firebase)

El proyecto usa variables `VITE_` para inicializar Firebase Web SDK en `server/config/FirebaseConfig.js`.

Crea un archivo `.env` en la raiz con:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

### Requisito adicional para backend Express

En `server/index.js` se usa Firebase Admin SDK y se requiere:

- `server/serviceAccountKey.json` (credencial de cuenta de servicio de Firebase).

---

## 6. Scripts disponibles

Definidos en `package.json`:

- `npm run dev` -> inicia Vite en modo desarrollo (`--host`).
- `npm run run` -> alias simple para Vite.
- `npm run build` -> compila produccion.
- `npm run preview` -> vista previa del build.
- `npm run lint` -> ejecuta ESLint.
- `npm run server` -> inicia backend Express (`server/index.js`).

---

## 7. Documentacion archivo por archivo

### Raiz

- **`package.json`**  
  Configura scripts, dependencias y metadatos del proyecto.

- **`vite.config.js`**  
  Configuracion base de Vite con plugin de React.

- **`Dockerfile`**  
  Imagen Node 20 Alpine, instala dependencias, copia codigo y levanta app de Vite.

- **`docker-compose.yml`**  
  Define dos servicios:
  - `react-app` (puerto `5173`)
  - `server` (puerto `3001`)

- **`index.html`**  
  HTML base donde React monta el arbol de componentes.

- **`eslint.config.js`**  
  Reglas de lint para mantener calidad/consistencia de codigo.

- **`postcss.config.cjs`**  
  Configuracion de PostCSS para pipeline de estilos.

---

### Frontend (`src`)

#### Inicio de app

- **`src/main.jsx`**  
  Punto de entrada de React. Monta `App` dentro de `#root` con `StrictMode`.

- **`src/App.jsx`**  
  Enrutador principal y composicion global:
  - Envuelve la app con `AuthProvider`.
  - Configura rutas `/login` y `/marcador`.
  - Redirecciona segun sesion activa.
  - Monta `Toaster` para notificaciones.

#### Estado global y autenticacion

- **`src/context/AuthContext.jsx`**  
  Capa central de autenticacion:
  - Escucha estado de login en Firebase (`onAuthStateChanged`).
  - Recupera datos de usuario desde Firestore (`findUserById`).
  - Expone `login`, `logout`, `user`, `userData`, `loading`, `error`.
  - Implementa hook `useAuth()`.

#### Paginas

- **`src/pages/LoginForm.jsx`**  
  Formulario de inicio de sesion:
  - Captura email/contrasena.
  - Llama `login` del contexto.
  - Muestra notificaciones de exito/error.

- **`src/pages/Marcador.jsx`**  
  Pantalla principal del sistema:
  - Muestra reloj en tiempo real.
  - Carga turno abierto actual del usuario.
  - Permite marcar entrada/salida de turno y lunch.
  - Muestra tarjetas con registros del dia.
  - Permite cerrar sesion.
  - Integra `RegisterUser` y `CalendarDb`.

- **`src/pages/Historial.jsx`**  
  Componente de historial simple para listar registros por usuario.

#### Componentes reutilizables

- **`src/components/Button.jsx`**  
  Boton visual para acciones del marcador con estado habilitado/deshabilitado e icono.

- **`src/components/Input.jsx`**  
  Input reutilizable con estilo comun.

- **`src/components/InfoCard.jsx`**  
  Tarjeta de informacion para mostrar un valor (ej. hora de entrada/salida).

- **`src/components/Calendardb.jsx`**  
  Tabla de registros y centro operativo de consultas:
  - Obtiene turnos desde Firestore (`getTimeShifts`).
  - Para admin: filtra por usuario (`getAllUsers`).
  - Normaliza timestamps.
  - Calcula horas trabajadas (`PunchOut - PunchIn - lunch`).
  - Exporta registros a Excel.
  - Elimina todos los registros visibles.
  - Incluye `ErrorBoundary` para evitar caida total de la vista.

- **`src/components/DeleteUserButton.jsx`**  
  Boton para eliminar usuario (con confirmacion):
  - Llama `deleteUserById`.
  - Muestra feedback con toast.

- **`src/components/RegisterUser.jsx`**  
  Formulario visible solo para admin:
  - Crea nuevo usuario en Auth + Firestore.
  - Solicita contrasena de admin para reautenticarse.
  - Evita perder la sesion de administrador tras crear otro usuario.

#### Estilos y assets

- **`src/App.css`** y **`src/index.css`**  
  Estilos globales y de layout.

- **`src/assets/LoginBackground.png`**, **`src/assets/LogoCompanySquare.jpg`**  
  Recursos graficos usados por la interfaz.

---

### Backend y servicios (`server`)

#### Configuracion Firebase

- **`server/config/FirebaseConfig.js`**  
  Inicializa SDK de Firebase Web para:
  - `auth` (autenticacion)
  - `db` (Firestore)
  - `analytics`

#### API Express

- **`server/index.js`**  
  Servidor Express:
  - Inicializa Firebase Admin SDK con `serviceAccountKey.json`.
  - Expone router `/api` para consultas de turnos.
  - Expone `POST /delete-user` para eliminacion completa en Firestore/Auth.

- **`server/routes/timeShifts.js`**  
  Router de lectura:
  - `GET /api` con filtros opcionales (`userId`, `username`, `startDate`, `endDate`).
  - Delega a `getTimeShifts()`.

#### Capa de servicios (Firestore/Auth)

- **`server/services/timeShiftService.js`**  
  Operaciones de turnos:
  - `createTimeShift(userId)` -> abre turno.
  - `openLunchShift(id, date)` -> inicia lunch.
  - `closeLunchShift(id, date)` -> cierra lunch.
  - `closeTimeShift(id, date)` -> cierra turno (valida lunch cerrado).
  - `getTimeShiftById(id)` -> obtiene turno puntual.
  - `getOpenTimeShiftByUser(userId)` -> turno abierto actual.
  - `getTimeShifts(filters)` -> listado con filtros y enriquecimiento de username.
  - `deleteTimeShiftsByUserId(userId)` y `deleteTimeShiftById(id)` -> eliminaciones.

- **`server/services/userService.js`**  
  Operaciones de usuarios:
  - `findUserByEmail(email)` y `findUserById(id)` -> consultas.
  - `getAllUsers()` -> listado completo.
  - `createUser(payload)` -> crea usuario en Auth y perfil en Firestore.
  - `deleteUserById(userId)` -> elimina usuario de Firestore y turnos asociados.

---

## 8. Modelo de datos (Firestore)

### Coleccion `users`

Documento por usuario (`users/{uid}`):

- `id`
- `name`
- `email`
- `position`
- `dept`
- `role` (`admin` o `user`)
- `createdAt`

### Coleccion `timeShifts`

Documento por turno:

- `userId`
- `PunchIn`
- `LunchIn`
- `LunchOut`
- `PunchOut`
- `lunchOpen` (boolean)
- `open` (boolean)

---

## 9. Como ejecutar en local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar variables `.env` (seccion 5).
3. Agregar `server/serviceAccountKey.json` para backend admin.
4. Levantar frontend:
   ```bash
   npm run dev
   ```
5. Levantar backend en otra terminal:
   ```bash
   npm run server
   ```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3001`

---

## 10. Como ejecutar con Docker

```bash
docker compose up --build
```

Servicios:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

---

## 11. Recomendaciones de mejora

- Separar claramente codigo de frontend y backend en paquetes/proyectos distintos.
- Mover toda operacion sensible (creacion/eliminacion de usuarios Auth) al backend con validacion de permisos.
- Agregar tests unitarios a servicios (`timeShiftService`, `userService`).
- Agregar reglas de seguridad de Firestore alineadas a roles.
- Corregir y simplificar puntos de estilo/estructura para mejorar mantenibilidad.

---

