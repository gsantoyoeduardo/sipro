# SIPRO WMS v2.0

**Sistema Integral de Procesos y Recursos Operativos — Warehouse Management System**

Plataforma web para la gestión integral de almacenes con funcionalidades de layout inteligente, inventario con FEFO/FIFO, picking Kanban, transferencias entre bodegas y dashboard de KPIs.

---

## Integrantes del Equipo

| Nombre | Rol |
|--------|-----|
| Eduardo Castorino Gines Santoyo | Desarrollo Backend y Arquitectura |
| Barreto Montenegro Paul Alexander | Desarrollo Frontend |
| Sernaque Juarez Manuel | Base de Datos y Modelado |
| Inoñan Siesquen Encarnacion Sebastian | Pruebas y QA |
| Villazón Sosa Mathias | Documentación y Despliegue |

---

## Arquitectura del Sistema

### Arquitectura Multi-Tenant

SIPRO utiliza una arquitectura **schema-based multi-tenant** con separación de autenticación:

```
┌──────────────────────────────────────────────────────────────┐
│                        Nginx Proxy                           │
│                         :80                                  │
└────────────┬──────────────────────────┬──────────────────────┘
             │                          │
    ┌────────▼────────┐      ┌──────────▼─────────┐
    │  Portal Admin   │      │     App WMS        │
    │  (Dueños SIPRO) │      │  (Clientes)        │
    │  :8081          │      │  :8080             │
    └────────┬────────┘      └──────────┬─────────┘
             │                          │
             │   /portal/auth/          │   /tenant/auth/
             └──────────┬───────────────┘
                        │
              ┌─────────▼──────────┐
              │   Backend API      │
              │   Django + DRF     │
              │   :8000            │
              └─────────┬──────────┘
                        │
    ┌───────────────────┼───────────────────┐
    ▼                   ▼                   ▼
┌──────────┐    ┌──────────────┐    ┌──────────┐
│PostgreSQL│    │    Redis     │    │  Media   │
│  :5432   │    │    :6379     │    │  Static  │
└──────────┘    └──────────────┘    └──────────┘

Esquemas PostgreSQL:
- public: Tablas globales (Empresa, Usuario global, Rol, Permiso)
- empresa_{id}: Tablas por cliente (Almacen, Inventario, etc.)
- auditoria: Logs de auditoría cross-tenant
```

### Separación de Autenticación

| Endpoint | Acceso | Tipo de Usuario | Frontend |
|----------|--------|-----------------|----------|
| `/portal/auth/` | Dueños de SIPRO | `admin_sistema` | Portal (:8081) |
| `/tenant/auth/` | Clientes/Empresas | `admin_empresa`, `operador` | App WMS (:8080) |

### Tipos de Usuario

| Tipo | Descripción | Acceso |
|------|-------------|--------|
| `admin_sistema` | Dueños de SIPRO | Portal Admin (gestiona empresas) |
| `admin_empresa` | Admin de empresa cliente | App WMS (gestiona su empresa) |
| `operador` | Usuario operativo | App WMS (operaciones de almacén) |

### Flujo de Registro de Empresas

1. Dueño se loguea en **Portal Admin** (`/auth/portal/login/`)
2. Crea nueva **Empresa** desde el dashboard
3. Sistema genera automáticamente:
   - Schema PostgreSQL: `empresa_{id}`
   - Migraciones en el schema
   - Roles y permisos por defecto
   - Superusuario admin para la empresa
4. Admin de empresa recibe credenciales
5. Admin se loguea en **App WMS** (`/tenant/auth/`)
6. Admin gestiona sus usuarios, almacenes, inventario, etc.

**Contenedores Docker:**
- `postgres:18-alpine` — Base de datos relacional (puerto 5432)
- `redis:7-alpine` — Caché y rate limiting (puerto 6379)
- `backend` — Django REST Framework (puerto 8000)
- `portal` — React Portal Admin + Nginx (puerto 8081)
- `app` — React App WMS + Nginx (puerto 8080)

---

## Modelo de Datos

### Apps y Entidades

#### 1. Empresa (`apps/empresa`)
| Entidad | Descripción | Campos principales |
|---------|-------------|-------------------|
| `Empresa` | Compañía/tenant raíz | razonsocial, nombrecomercial, ruc, correo |
| `Sucursal` | Sucursal de una empresa | nombre, codigo, direccion, FK→Empresa |
| `Almacen` | Bodega física | nombre, codigo, ancho, alto, capacidadmaxima, FK→Sucursal |

#### 2. Seguridad (`apps/seguridad`)
| Entidad | Descripción | Campos principales |
|---------|-------------|-------------------|
| `Usuario` | Usuario del sistema | usuario, nombres, apellidos, correo, password, **tipo_usuario**, idempresa |
| `Rol` | Rol con permisos | nombre, descripcion |
| `Permiso` | Permiso individual | nombre, codigo, descripcion |
| `SesionUsuario` | Registro de sesiones | tokenjwt, refreshtoken, ip, navegador, FK→Usuario |

**Tipos de Usuario:**
- `admin_sistema`: Dueños de SIPRO (acceso al Portal Admin)
- `admin_empresa`: Administrador de empresa cliente (acceso al App WMS)
- `operador`: Usuario operativo de almacén (acceso al App WMS)

**Relaciones:** Usuario ↔ Rol (M2M), Rol ↔ Permiso (M2M)

#### 3. Layout (`apps/layout`)
| Entidad | Descripción | Campos principales |
|---------|-------------|-------------------|
| `Zona` | Zona del almacén | nombre, codigo, tipo, x, y, ancho, alto, color, FK→Almacen |
| `Pasillo` | Pasillo dentro de zona | nombre, codigo, orientacion, x, y, ancho, largo, FK→Zona |
| `Estante` | Estante en pasillo | nombre, codigo, lado, cantidadniveles, x, y, ancho, alto, FK→Pasillo |
| `Nivel` | Nivel de estante | nombre, numero, altura, FK→Estante |
| `Ubicacion` | Posición específica | codigo, estado_ubicacion, FK→Nivel |
| `Nodo` | Nodo de grafo de rutas | nombre, tipo, coordenada_x, coordenada_y, FK→Almacen |
| `Conexion` | Arista entre nodos | distancia, tipo, bidireccional, FK→Nodo (origen, destino) |
| `Ruta` | Resultado de cálculo | nodos_visitados, distancia_total |

#### 4. Inventario (`apps/inventario`)
| Entidad | Descripción | Campos principales |
|---------|-------------|-------------------|
| `Categoria` | Categoría de productos | nombre, descripcion, FK→Categoria (autoref padre) |
| `Producto` | Producto del catálogo | codigo, nombre, peso, volumen, precio_costo, precio_venta, stock_minimo, stock_maximo, maneja_lotes, FK→Categoria |
| `Lote` | Lote de producto | numero_lote, fecha_produccion, fecha_vencimiento, cantidad_inicial, cantidad_actual, FK→Producto |
| `Inventario` | Stock por ubicación | cantidad, FK→Producto, FK→Ubicacion, FK→Lote |
| `Kardex` | Movimientos de inventario | tipo_movimiento, cantidad, saldo_anterior, saldo_nuevo, FK→Producto |

#### 5. Picking (`apps/picking`)
| Entidad | Descripción | Campos principales |
|---------|-------------|-------------------|
| `OrdenPicking` | Orden de recolección | numero_orden, estado (pendiente→en_proceso→completado/cancelado), prioridad, FK→Almacen, FK→Usuario |
| `DetallePicking` | Producto en orden | cantidad_solicitada, cantidad_pickeada, estado, FK→Orden, FK→Producto, FK→Ubicacion |
| `Incidencia` | Reporte de incidencia | tipo, descripcion, cantidad_reportada, resuelta, FK→Detalle |

#### 6. Transferencias (`apps/transferencia`)
| Entidad | Descripción | Campos principales |
|---------|-------------|-------------------|
| `Transferencia` | Transferencia entre almacenes | numero_transferencia, estado (pendiente→en_transito→completado/rechazado), FK→Almacen origen, FK→Almacen destino |
| `DetalleTransferencia` | Producto en transferencia | cantidad, FK→Transferencia, FK→Producto |

#### 7. Dashboard (`apps/dashboard`)
API de agregación de estadísticas en tiempo real (sin modelos propios, consume datos de otras apps).

---

## Casos de Uso

### 1. Gestión de Empresas y Almacenes
- CRUD de Empresas (RUC validado, 13 dígitos)
- CRUD de Sucursales (asociadas a empresas)
- CRUD de Almacenes (dimensiones, capacidad máxima)
- Activación/desactivación de entidades

### 2. Control de Acceso
- Login con JWT (access + refresh tokens)
- Registro de sesiones (IP, navegador, dispositivo)
- Roles y permisos (RBAC)
- Autenticación multi-tenant (X-Tenant-ID header)

### 3. Layout Inteligente
- Mapa visual del almacén con KonvaJS (Canvas HTML5)
- Jerarquía: Zonas → Pasillos → Estantes → Niveles → Ubicaciones
- Grafos de nodos y conexiones para rutas internas
- Cálculo de rutas óptimas con algoritmo Dijkstra

### 4. Inventario con FEFO/FIFO
- Catálogo de productos con categorías jerárquicas
- Control de lotes (fecha producción, vencimiento)
- Trazabilidad completa (Kardex de movimientos)
- Picking inteligente: FEFO (primero en vencer) o FIFO (primero en entrar)
- Alertas de stock bajo

### 5. Picking Kanban
- Panel visual tipo Kanban (4 columnas: pendiente, en proceso, completado, cancelado)
- Flujo de trabajo: Pendiente → En Proceso → Completado
- Pickeo por unidad o completar lote
- Reporte de incidencias (faltante, dañado, caducado, ubicación vacía)

### 6. Transferencias entre Almacenes
- Creación de transferencias entre almacenes
- Flujo de aprobación: Pendiente → En Tránsito → Completado
- Rechazo de transferencias
- Agregado de productos con cantidades

### 7. Dashboard KPIs
- Productos totales y activos
- Stock bajo mínimo
- Órdenes pendientes
- Transferencias en tránsito
- Métricas agregadas en tiempo real

---

## Tecnologías Utilizadas

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Python | 3.13 | Lenguaje principal |
| Django | 5.2 | Framework web |
| Django REST Framework | 3.16 | API REST |
| SimpleJWT | 5.5 | Autenticación JWT |
| PostgreSQL | 18 | Base de datos |
| Redis | 7 | Caché y rate limiting |
| drf-yasg | — | Documentación Swagger |

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 19 | UI Framework |
| TypeScript | 5.8 | Tipado estático |
| Tailwind CSS | 4 | Estilos |
| Vite | 6 | Bundler |
| Axios | 1.9 | Cliente HTTP |
| Zustand | 5 | Estado global |
| KonvaJS | 9 | Canvas para mapas |
| React Router | 7 | Enrutamiento SPA |

### Infraestructura
| Tecnología | Uso |
|-----------|-----|
| Docker | Contenedores |
| Docker Compose | Orquestación local |
| Nginx | Proxy reverso + servir estáticos |

---

## Demo Rápida

### Requisitos previos
- Docker Desktop 24+ y Docker Compose v2
- Git
- Mínimo 4 GB RAM disponible
- Puertos disponibles: 5432, 6379, 8000, 8080

### Instalación y ejecución

```bash
# 1. Clonar y levantar
git clone https://github.com/gsantoyoeduardo/sipro.git
cd sipro
docker compose up -d --build

# 2. Crear schema de auditoría
docker exec sipro-postgres psql -U postgres -d sipro -c "CREATE SCHEMA IF NOT EXISTS auditoria;"

# 3. Ejecutar migraciones
docker exec sipro-backend python manage.py migrate

# 4. Cargar datos demo (TODO listo para presentar)
docker exec sipro-backend python manage.py seed_demo
```

### Reset de datos demo

```bash
docker exec sipro-backend python manage.py seed_demo --reset
```

### Acceso a la aplicación
- **Frontend:** http://localhost:8080
- **API:** http://localhost:8080/api/
- **Admin Django:** http://localhost:8000/admin/

### Credenciales de acceso

**Portal Admin (Dueños SIPRO):**
| Usuario | Contraseña | Tipo | Acceso |
|---------|-----------|------|--------|
| `admin` | `gsantoyoeduardo` | `admin_sistema` | Portal Admin (:8081) |

**App WMS (Clientes):**
| Usuario | Contraseña | Tipo | Acceso |
|---------|-----------|------|--------|
| `supervisor1` | `demo1234` | `admin_empresa` | App WMS (:8080) |
| `operario1` | `demo1234` | `operador` | App WMS (:8080) |

### Comandos útiles

```bash
# Ver logs
docker compose logs -f backend

# Reiniciar servicios
docker compose restart

# Detener todo
docker compose down

# Reconstruir frontend
docker compose build --no-cache frontend && docker compose up -d --force-recreate frontend
```

---

## Endpoints API REST

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/portal/auth/` | Login Portal Admin (dueños SIPRO) |
| POST | `/tenant/auth/` | Login App WMS (clientes) |
| POST | `/tenant/auth/logout/` | Logout App WMS |
| POST | `/portal/auth/logout/` | Logout Portal Admin |
| POST | `/auth/refresh/` | Refrescar token |

### Empresa
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/empresas/` | Listar/Crear empresas |
| GET/PUT/DELETE | `/api/empresas/{id}/` | CRUD empresa |
| PATCH | `/api/empresas/{id}/estado/` | Toggle activo/inactivo |
| GET/POST | `/api/sucursales/` | CRUD sucursales |
| GET/POST | `/api/almacenes/` | CRUD almacenes |

### Seguridad
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/usuarios/` | CRUD usuarios |
| POST | `/api/usuarios/{id}/asignar-roles/` | Asignar roles |
| POST | `/api/usuarios/{id}/reset-password/` | Resetear contraseña |
| GET/POST | `/api/roles/` | CRUD roles |
| POST | `/api/roles/{id}/asignar-permisos/` | Asignar permisos |
| GET | `/api/permisos/` | Listar permisos |

### Layout
| Método | Ruta | Descripción |
|--------|------|-------------|
| CRUD | `/api/zonas/` | Gestión de zonas |
| CRUD | `/api/pasillos/` | Gestión de pasillos |
| CRUD | `/api/estantes/` | Gestión de estantes |
| CRUD | `/api/niveles/` | Gestión de niveles |
| CRUD | `/api/ubicaciones/` | Gestión de ubicaciones |
| CRUD | `/api/nodos/` | Gestión de nodos |
| CRUD | `/api/conexiones/` | Gestión de conexiones |
| POST | `/api/rutas/calcular/` | Calcular ruta Dijkstra |

### Inventario
| Método | Ruta | Descripción |
|--------|------|-------------|
| CRUD | `/api/categorias/` | Gestión de categorías |
| CRUD | `/api/productos/` | Gestión de productos |
| GET | `/api/productos/{id}/kardex/` | Historial Kardex |
| CRUD | `/api/lotes/` | Gestión de lotes |
| CRUD | `/api/inventarios/` | Gestión de inventario |
| POST | `/api/inventarios/picking/` | Calcular picking FEFO/FIFO |

### Picking
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/picking/ordenes/` | CRUD órdenes |
| PATCH | `/api/picking/ordenes/{id}/iniciar/` | Iniciar orden |
| PATCH | `/api/picking/ordenes/{id}/completar/` | Completar orden |
| PATCH | `/api/picking/ordenes/{id}/cancelar/` | Cancelar orden |
| GET/POST | `/api/picking/detalles/` | CRUD detalles |
| PATCH | `/api/picking/detalles/{id}/pick/` | Pickear producto |
| POST | `/api/picking/incidencias/` | Reportar incidencia |

### Transferencias
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/transferencias/` | CRUD transferencias |
| POST | `/api/transferencias/{id}/detalles/` | Agregar detalle |
| PATCH | `/api/transferencias/{id}/enviar/` | Enviar |
| PATCH | `/api/transferencias/{id}/recibir/` | Recibir |
| PATCH | `/api/transferencias/{id}/rechazar/` | Rechazar |

### Dashboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/stats/` | KPIs agregados |

---

## Validaciones de Seguridad

El sistema implementa validación en múltiples capas:

### Backend (Django)
- Validación de modelos: `max_length`, `unique`, `EmailField`, `unique_together`
- Serializadores DRF con `ModelSerializer` que heredan validaciones del modelo
- JWT con expiración y refresh tokens
- Rate limiting con Redis (100 req/min para APIs públicas, 1000 req/min autenticadas)
- CSRF protection
- CORS configurado

### Frontend (React)
- Validación de campos obligatorios y formato (email, RUC 13 dígitos)
- Validación de reglas de negocio: `precio_venta ≥ precio_costo`, `stock_max ≥ stock_min`, `origen ≠ destino`
- Validación de rangos numéricos (cantidades positivas, dimensiones no negativas)
- Validación de fechas lógicas (vencimiento > producción)
- Password strength (8+ chars, mayúscula, número)
- Confirmación modal para acciones destructivas (eliminar, desactivar, cancelar)
- Feedback visual con Toast notifications y mensajes inline

---

## Estructura del Proyecto

```
SIPRO/
├── backend/
│   ├── apps/
│   │   ├── base/           # Modelo base auditable + timestamps
│   │   ├── empresa/        # Empresas, Sucursales, Almacenes
│   │   ├── seguridad/      # Usuarios, Roles, Permisos, Sesiones, Auth JWT
│   │   ├── layout/         # Zonas, Pasillos, Estantes, Niveles, Nodos, Conexiones, Rutas
│   │   ├── inventario/     # Categorías, Productos, Lotes, Inventario, Kardex
│   │   ├── picking/        # Órdenes Picking, Detalles, Incidencias, Kanban
│   │   ├── transferencia/  # Transferencias entre almacenes
│   │   └── dashboard/      # KPIs y estadísticas agregadas
│   ├── config/             # Settings (base, dev, urls)
│   └── media/              # Archivos subidos
├── frontend/
│   └── src/
│       ├── api/            # Cliente HTTP (axios) + servicios
│       ├── components/     # Componentes compartidos (Layout, Modal, DataTable, ConfirmDialog, Toast)
│       ├── hooks/          # Custom hooks (useSubmit)
│       ├── pages/          # Páginas por módulo
│       ├── routes/         # React Router
│       ├── store/          # Zustand stores (auth, toast)
│       ├── types/          # TypeScript interfaces
│       └── utils/          # Validadores
├── infra/
│   └── docker/             # Dockerfiles y config Nginx
├── docker-compose.yml
└── .env
```
