# 🎓 SIPRO - Guía de Exposición

> Responder como si fuera un docente explicando el sistema paso a paso.

---

## 1. ¿Dónde está la conexión a la base de datos?

**Archivo:** `backend/src/settings.py` (~línea 40)

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': os.environ.get('POSTGRES_HOST', 'postgres'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        'NAME': os.environ.get('POSTGRES_DB', 'sipro'),
        'USER': os.environ.get('POSTGRES_USER', 'sipro'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'sipro'),
    }
}
```

**Flujo:**
1. `docker-compose.yml` levanta el contenedor `postgres:17`
2. Django lee variables de entorno del servicio `backend`
3. `psycopg2` (driver) conecta Django → PostgreSQL
4. **Una sola base de datos** con múltiples schemas (uno por empresa)

**Para verlo:** `cat backend/src/settings.py | grep -A 15 "DATABASES"`

---

## 2. ¿Dónde está el código que crea un nuevo esquema (tenant)?

**Archivo:** `backend/src/application/empresa/tenant_service.py`

| Método | Línea | Qué hace |
|--------|-------|----------|
| `create_schema()` | ~28 | `CREATE SCHEMA IF NOT EXISTS "empresa_{id}"` |
| `migrate_schema()` | ~34 | Ejecuta `migrate --schema=empresa_{id}` |
| `seed_tenant()` | ~40 | Crea permisos, roles, sucursal, almacén demo |

**Flujo completo (portal → nuevo tenant):**

```
POST /portal/api/registro/   (CrearEmpresaPage)
        ↓
EmpresaRegistrationService.create_empresa()
        ↓
1. INSERT en public.empresa
2. CREATE SCHEMA empresa_{uuid}
3. python manage.py migrate --schema=empresa_{uuid}
4. Seed: 24 permisos → 3 roles → admin inicial → sucursal → almacén
```

**Para verlo:** `cat backend/src/application/empresa/tenant_service.py`

---

## 3. ¿Cómo funciona el multi-tenant (aislamiento por empresa)?

**Archivo:** `backend/src/infrastructure/middleware/tenant_middleware.py`

| Paso | Código | Efecto |
|------|--------|--------|
| 1 | `idempresa = request.user.idempresa` | Obtiene empresa del usuario autenticado |
| 2 | `schema = f"empresa_{idempresa}"` | Construye nombre del schema |
| 3 | `SET search_path = "empresa_X", public, auditoria` | Aísla todas las queries al schema correcto |
| 4 | **Django ejecuta queries** | Van al schema `empresa_X` sin modificar código |
| 5 | `SET search_path = public, auditoria` | Restaura al finalizar |

**Esto significa:**
- Una empresa NUNCA ve datos de otra empresa
- No hace falta WHERE idempresa = X en cada query
- Los schemas se crean dinámicamente al registrar una nueva empresa

**Para verlo:** `cat backend/src/infrastructure/middleware/tenant_middleware.py`

---

## 4. ¿Dónde están los endpoints de la API?

**Archivo:** `backend/config/urls.py`

| Prefijo | App | Router |
|---------|-----|--------|
| `/portal/api/empresas/` | Portal (admin sistema) | `controllers/portal/empresa/urls.py` |
| `/portal/api/registro/` | Portal (crear empresa) | `controllers/portal/registro/urls.py` |
| `/tenant/api/zonas/` | Layout | `controllers/tenant/layout/urls.py` |
| `/tenant/api/productos/` | Inventario | `controllers/tenant/inventario/urls.py` |
| `/tenant/api/ordenes-picking/` | Picking | `controllers/tenant/picking/urls.py` |
| `/tenant/api/transferencias/` | Transferencia | `controllers/tenant/transferencia/urls.py` |
| `/auth/` | Autenticación | `controllers/seguridad/auth_urls.py` |

**Para verlo:** `cat backend/config/urls.py`

---

## 5. ¿Dónde se usa Konva para el mapa del almacén?

**Archivo:** `frontend/app/src/pages/layout/LayoutMapPage.tsx`

**Componentes Konva que se usan:**

| Componente | Para qué | Línea |
|------------|----------|-------|
| `<Stage>` | Canvas principal | ~571 |
| `<Layer>` | Capa con zoom/pan | ~572 |
| `<Rect>` | Zonas, pasillos, estantes, almacén | ~586-617 |
| `<Circle>` | Nodos (puntos de conexión) | ~622 |
| `<Line>` | Conexiones entre nodos + grilla | ~576-592 |
| `<Text>` | Labels (coordenadas, nombres) | ~577-587 |
| `<Group>` | Agrupar Rect + Text para drag | ~598-618 |
| `<Transformer>` | Handles para redimensionar | ~625 |

**También en:** `frontend/app/src/pages/layout/RutasPage.tsx` (visualización de rutas Dijkstra)

---

## 6. ¿Cómo se autentican los usuarios?

### Backend (JWT)
- `djangorestframework-simplejwt` genera `access_token` (15 min) + `refresh_token` (7 días)
- `POST /auth/login/` → devuelve tokens + datos del usuario
- Cada request lleva `Authorization: Bearer <token>`

### Frontend Portal (`frontend/portal/src/api/axios.ts`)
```typescript
// Interceptor adjunta token automáticamente
config.headers.Authorization = `Bearer ${token}`

// Si 401 → intenta refresh
if (error.status === 401) {
  const { data } = await api.post('/auth/refresh/', { refresh })
  // Retry original request con nuevo token
}
```

### Frontend App (`frontend/app/src/api/axios.ts`)
Mismo patrón, pero además envía `X-Tenant-ID` para validación.

---

## 7. ¿Cómo se estructuran los componentes del frontend?

```
frontend/portal/src/components/
├── common/                  ← Reutilizables entre páginas
│   ├── Header.tsx           ← Barra superior con logo + usuario + salir
│   ├── StatCard.tsx         ← Tarjeta de estadística
│   ├── StatusBadge.tsx      ← Badge activo/inactivo
│   ├── LoadingSpinner.tsx   ← Spinner de carga
│   ├── EmptyState.tsx       ← Estado sin datos
│   ├── Modal.tsx            ← Modal genérico
│   └── ConfirmDialog.tsx    ← Confirmación sí/no
└── dedicated/               ← Específicos de una página
    ├── EmpresaTable.tsx     ← Tabla de empresas
    ├── EmpresaDetailModal.tsx ← Modal detalle empresa
    ├── EmpresaForm.tsx      ← Formulario paso 1 (empresa)
    └── AdminUserForm.tsx    ← Formulario paso 2 (admin)

frontend/app/src/components/
├── common/
│   ├── StatCard.tsx         ← Tarjeta KPI para dashboard
│   ├── StatusBadge.tsx      ← Badge multi-estado
│   ├── LoadingSpinner.tsx   ← Spinner con mensaje
│   ├── EmptyState.tsx       ← Sin datos + acción
│   ├── PageHeader.tsx       ← Título + botón acción
│   └── FilterBar.tsx        ← Filtros por dropdown
├── dedicated/
│   ├── ZoomControls.tsx     ← Botones +/-/ajustar zoom
│   ├── MapToolbar.tsx       ← Toolbar superior del mapa
│   ├── PropertiesPanel.tsx  ← Panel lateral de propiedades
│   ├── KanbanColumn.tsx     ← Columna del Kanban
│   ├── KanbanCard.tsx       ← Tarjeta de orden
│   └── IncidenciaFormModal.tsx ← Formulario de incidencias
├── DataTable.tsx            ← Tabla genérica (ya existía)
├── Modal.tsx                ← Modal genérico (ya existía)
├── ConfirmDialog.tsx        ← Confirmación (ya existía)
└── ToastContainer.tsx       ← Notificaciones (ya existía)
```

---

## 8. ¿Cómo se comunica el frontend con el backend?

### Docker Compose proxy inverso

```
Navegador → Puerto 5173 (App) / 5174 (Portal)
                ↓
         Vite dev server
                ↓
         Proxy configurado en vite.config.ts
                ↓
         http://backend:8000 (contenedor Django)
```

**Config en `frontend/app/vite.config.ts`:**
```typescript
server: {
  proxy: {
    '/tenant': 'http://backend:8000',
    '/auth': 'http://backend:8000',
  }
}
```

**Flujo completo de una petición:**
1. Frontend hace `GET /tenant/api/zonas/`
2. Vite proxy → `http://backend:8000/tenant/api/zonas/`
3. Django `TenantMiddleware` → `SET search_path = empresa_{uuid}`
4. Django `TenantGuardMiddleware` → valida tipo_usuario + X-Tenant-ID
5. ViewSet ejecuta query en el schema correcto
6. `UTF8JSONRenderer` serializa respuesta sin escapar tildes
7. Axios interceptor recibe respuesta → frontend actualiza UI

---

## 9. ¿Qué servicios Docker existen y cómo se relacionan?

```bash
docker compose ps
```

| Servicio | Puerto | Imagen | Depende de |
|----------|--------|--------|------------|
| `postgres` | 5432 | postgres:17 | — |
| `redis` | 6379 | redis:7 | — |
| `backend` | 8000 | sipro-backend | postgres, redis |
| `portal` | 5174 | sipro-portal | backend |
| `app` | 5173 | sipro-app | backend |

**Volumen de datos persistente:** `postgres_data` en `docker-data/postgres/`

---

## 10. ¿Cómo se ejecutan los seeders?

```bash
# Crear todo desde cero (empresa + layout + datos demo)
docker compose exec backend python manage.py seed_demo --crear-todo

# Solo layout (si la empresa ya existe)
docker compose exec backend python manage.py seed_demo --solo-layout

# Reset total (borra todo y recrea)
docker compose exec backend python manage.py seed_demo --reset
```

**Qué crea el seeder (`backend/apps/seed/management/commands/seed_demo.py`):**

| Sección | Items |
|---------|-------|
| Empresa | 1 empresa + 2 sucursales + 2 almacenes |
| Permisos | 24 permisos CRUD |
| Roles | Administrador, Supervisor, Operario |
| Usuarios | admin/admin1234, supervisor1/demo1234, operario1/demo1234 |
| Layout | 6 zonas + 3 pasillos + 8 estantes + 24 niveles + 48 ubicaciones + 13 nodos + 12 conexiones |
| Inventario | 5 categorías + 15 productos + 10 lotes + 30 items inventario + 20 movimientos Kardex |
| Picking | 4 órdenes (pendiente, en_proceso, completada, cancelada) |
| Transferencias | 2 transferencias (pendiente, en_tránsito) |

---

## 11. ¿Qué pasa cuando se crea una nueva empresa desde el Portal?

**Flujo completo:**

```
Admin sistema → POST /portal/api/registro/
  ↓
EmpresaRegistrationService.create_empresa()
  ↓
├── 1. Crea registro en public.empresa (activo = true)
├── 2. Crea schema PostgreSQL: CREATE SCHEMA empresa_{uuid}
├── 3. Ejecuta migrations en ese schema (crea tablas)
├── 4. Seed: 24 permisos, 3 roles, 1 sucursal, 1 almacén demo
├── 5. Crea usuario admin con tipo_usuario = 'admin_empresa'
└── 6. Asigna rol Administrador al nuevo usuario
  ↓
Response: 201 Created → Portal redirige a /admin?refresh=true
```

---

## 12. Preguntas adicionales para la exposición

### 12.1 ¿Cómo se manejan los errores en el frontend?
Cada página usa `useSubmit` hook (App) o try/catch (Portal) que captura errores de Axios, extrae el mensaje del backend, y lo muestra en un toast/alert.

### 12.2 ¿Cómo se asegura que un operario no vea datos de otra empresa?
- `TenantMiddleware` setea `search_path` al schema de su empresa
- `TenantGuardMiddleware` bloquea si el `X-Tenant-ID` no coincide con su `idempresa`
- Doble capa de seguridad: schema + validación explícita

### 12.3 ¿Cómo se calcula la ruta más corta en el mapa?
Algoritmo **Dijkstra** implementado en `layout/views.py` → `RutaViewSet.calcular()`. Usa los nodos y conexiones del almacén para encontrar el camino más corto entre origen y destino.

### 12.4 ¿Cómo se genera automáticamente el código de barras del producto?
No hay código de barras todavía. El `codigo` del producto es un string alfanumérico que el usuario asigna manualmente.

### 12.5 ¿Cómo se maneja el FEFO/FIFO en el picking?
En `InventarioPage.tsx` → Pestaña "Picking FEFO/FIFO". El usuario selecciona producto + cantidad + estrategia. El backend ordena los lotes por fecha de vencimiento (FEFO) o por ingreso (FIFO) y sugiere qué lotes pickear primero.

### 12.6 ¿Cómo se restauran los logs de auditoría?
Hay un schema `auditoria` donde se registran cambios vía signals de Django. Pendiente de implementar interfaz de consulta.

### 12.7 ¿Qué pasa si el refresh token expira?
El interceptor de Axios captura el 401, intenta refresh. Si el refresh también falla (refresh_token expiró), borra todo el localStorage y redirige a `/login`.

### 12.8 ¿Cómo se agrega un nuevo módulo (ej: facturación)?
1. Backend: Crear app Django + modelos + serializers + viewsets + urls
2. Frontend: Crear service en `api/`, página en `pages/`, ruta en `AppRouter.tsx`
3. Agregar item al menú en `components/Layout.tsx`
4. Agregar permisos al seeder `seed_demo.py`

---

## 13. Estructura de archivos clave

```
backend/
├── config/
│   └── urls.py                    ← Rutas raíz (portal/, tenant/, auth/)
├── src/
│   ├── settings.py                ← Conexión DB, apps instaladas, middleware
│   ├── infrastructure/
│   │   ├── middleware/
│   │   │   ├── tenant_middleware.py  ← Aislamiento multi-tenant
│   │   │   ├── tenant_guard.py      ← Protege rutas /tenant/
│   │   │   ├── portal_guard.py      ← Protege rutas /portal/
│   │   │   ├── tenant_filter.py     ← Mixins para filtrar querysets
│   │   │   └── csrf_middleware.py   ← Desactiva CSRF para JWT
│   │   ├── renderers.py            ← UTF-8 sin escapar tildes
│   │   ├── permissions.py          ← Permisos personalizados
│   │   ├── models/                 ← Modelos Django por módulo
│   │   ├── serializers/            ← DRF serializers
│   │   └── repositories/           ← Capa de datos
│   ├── application/
│   │   └── empresa/
│   │       └── tenant_service.py   ← Creación de schemas + seed
│   └── controllers/                ← Viewsets + URLs por módulo
├── apps/
│   └── seed/management/commands/
│       └── seed_demo.py            ← Seeders

frontend/
├── portal/                         ← Admin de sistema
│   └── src/
│       ├── api/                    ← Servicios API (auth, empresa, dashboard)
│       ├── components/
│       │   ├── common/             ← Componentes reutilizables
│       │   └── dedicated/          ← Componentes específicos
│       ├── pages/                  ← LandingPage, LoginPage, AdminDashboard, CrearEmpresa
│       ├── store/authStore.ts      ← Estado de autenticación
│       └── App.tsx                 ← Router
├── app/                            ← App de gestión WMS
│   └── src/
│       ├── api/                    ← Servicios API (layout, picking, inventario, etc.)
│       ├── components/
│       │   ├── common/             ← StatCard, StatusBadge, PageHeader, etc.
│       │   └── dedicated/          ← KanbanColumn, PropertiesPanel, etc.
│       ├── pages/                  ← Todas las páginas del WMS
│       ├── store/                  ← authStore, toastStore
│       ├── routes/AppRouter.tsx    ← Todas las rutas
│       └── hooks/useSubmit.ts      ← Hook genérico de envío
└── shared/                         ← Tipos, validadores y servicios compartidos
    └── src/
        ├── types/index.ts          ← Interfaces TypeScript
        ├── utils/validators.ts     ← Validaciones
        └── api/                    ← Servicios base
```

---

## 14. Resumen Docker Compose

```yaml
# docker-compose.yml (comandos útiles)
docker compose up -d                  # Iniciar todo
docker compose down -v                # BORRA datos (volumen postgres)
docker compose logs -f backend        # Ver logs del backend
docker compose exec backend bash      # Entrar al contenedor backend
docker compose exec backend python manage.py seed_demo --crear-todo  # Seedear

# Servicios expuestos:
# - Portal:  http://localhost:5174
# - App:     http://localhost:5173
# - Backend: http://localhost:8000
# - Swagger: http://localhost:8000/swagger/
```
