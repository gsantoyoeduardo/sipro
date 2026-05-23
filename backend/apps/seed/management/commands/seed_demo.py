"""Comando de gestión de Django para sembrar datos demo en SIPRO WMS.

Puebla la base de datos con información de ejemplo representativa que
permite probar todas las funcionalidades del sistema sin necesidad de
ingresar datos manualmente.

**¿Qué datos crea?**

- Empresa, sucursales y almacenes.
- Catálogo completo de permisos, roles y usuarios demo.
- Layout de almacén con zonas, pasillos, estantes, niveles y ubicaciones.
- Grafo de navegación con nodos y conexiones.
- Productos por categorías, lotes con fechas de vencimiento, inventario
  en ubicaciones y movimientos de kardex.
- Órdenes de picking en distintos estados (pendiente, en_proceso,
  completado, cancelado) con incidencias.
- Transferencias entre almacenes (pendiente y en_tránsito).

**Uso:**

.. code-block:: bash

    python manage.py seed_demo
    python manage.py seed_demo --reset
"""

from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.base import audit_signals
from src.infrastructure.models.empresa_model import Almacen, Empresa, Sucursal
from src.infrastructure.models.inventario_model import Categoria, Inventario, Kardex, Lote, Producto
from src.infrastructure.models.layout_model import Conexion, Estante, Nivel, Nodo, Pasillo, Ubicacion, Zona
from src.infrastructure.models.picking_model import DetallePicking, Incidencia, OrdenPicking
from src.infrastructure.models.seguridad_model import Permiso, Rol, RolPermiso, Usuario, UsuarioRol
from src.infrastructure.models.transferencia_model import DetalleTransferencia, Transferencia


class Command(BaseCommand):
    """Comando ``seed_demo`` — siembra datos demo completos en la base de datos.

    Ejecuta en orden: reset → header → empresa → permisos → roles → usuarios
    → layout → inventario → picking → transferencias → resumen.
    """

    help = 'Precarga datos demo para SIPRO WMS'

    def add_arguments(self, parser):
        """Define los argumentos opcionales del comando."""
        parser.add_argument('--reset', action='store_true', help='Eliminar todo y recrear')
        parser.add_argument('--crear-todo', action='store_true', help='Alias de --reset')

    def handle(self, *args, **options):
        """Punto de entrada principal del comando.

        Orquesta todas las fases de la siembra. Deshabilita las señales de
        auditoría durante la ejecución para evitar ruido en los logs.
        """
        audit_signals.AUDIT_ENABLED = False
        try:
            if options['reset'] or options.get('crear_todo'):
                self._reset_all()
            self._print_header()
            self._seed_empresa()
            self._seed_permisos()
            self._seed_roles()
            self._seed_usuarios()
            self._seed_layout()
            self._seed_inventario()
            self._seed_picking()
            self._seed_transferencias()
            self._print_summary()
        finally:
            audit_signals.AUDIT_ENABLED = True

    # ------------------------------------------------------------------
    # helpers
    # ------------------------------------------------------------------

    def _log(self, emoji, label, count=None):
        """Imprime una línea de log con emoji y etiqueta opcional con contador."""
        if count is not None:
            self.stdout.write(f'  {emoji} {label}: {count}')
        else:
            self.stdout.write(f'  {emoji} {label}')

    def _section(self, title):
        """Imprime un título de sección separado con una línea en blanco."""
        self.stdout.write('')
        self.stdout.write(title)

    def _safe_get_or_create(self, model, lookup, defaults):
        """Versión segura de ``get_or_create`` que evita la condición de carrera.

        Primero consulta con ``filter().first()`` y si no existe crea el
        objeto fusionando ``lookup`` y ``defaults``.

        Returns:
            tuple: (instancia, creado) donde ``creado`` es booleano.
        """
        existing = model.objects.filter(**lookup).first()
        if existing:
            return existing, False
        return model.objects.create(**{**lookup, **defaults}), True

    # ------------------------------------------------------------------
    # header
    # ------------------------------------------------------------------

    def _print_header(self):
        """Imprime el encabezado decorativo del comando."""
        self.stdout.write('')
        self.stdout.write('=' * 60)
        self.stdout.write('  SIPRO WMS — Carga de Datos Demo')
        self.stdout.write('=' * 60)

    # ------------------------------------------------------------------
    # reset
    # ------------------------------------------------------------------

    def _reset_all(self):
        """Elimina todos los datos existentes en el orden correcto (hijos → padres).

        Las tablas se borran en orden descendente de dependencias para
        respetar las restricciones de clave foránea. Primero se eliminan
        las sesiones, luego incidencias, picking, transferencias, kardex,
        inventario, layout, roles/permisos y finalmente empresas.
        """
        self.stdout.write('\n🗑  Eliminando datos existentes...')

        models = [
            Incidencia, DetallePicking, OrdenPicking,
            DetalleTransferencia, Transferencia,
            Kardex, Inventario, Lote, Producto, Categoria,
            Conexion, Nodo, Ubicacion, Nivel, Estante, Pasillo, Zona,
            UsuarioRol, RolPermiso,
            Almacen, Sucursal, Usuario, Rol, Permiso, Empresa,
        ]
        from src.infrastructure.models.seguridad_model import SesionUsuario
        SesionUsuario.objects.all().delete()

        for model in models:
            model.objects.all().delete()

        self.stdout.write('  ✅ Datos eliminados.')

    # ------------------------------------------------------------------
    # empresa / sucursal / almacen
    # ------------------------------------------------------------------

    def _seed_empresa(self):
        """Fase 1 — Crea la empresa demo, dos sucursales y dos almacenes.

        - Empresa: SIPRO Demo S.A.C. (RUC 20123456789)
        - Sucursales: Sede Central Lima y Sede Arequipa.
        - Almacenes: Principal y Secundario (ambos en Lima).
        """
        self._section('🏢 Empresa / Sucursales / Almacenes:')

        # ── Empresa principal ─────────────────────────────────────────────
        empresa, _ = Empresa.objects.get_or_create(
            ruc='20123456789',
            defaults={
                'razonsocial': 'SIPRO Demo S.A.C.',
                'nombrecomercial': 'SIPRO Demo',
                'correo': 'contacto@siprodemo.pe',
                'telefono': '01-555-0100',
                'direccion': 'Av. Los Almacenes 123, Lima',
            },
        )
        self._log('🏢', 'Empresa', empresa.razonsocial)
        self._empresa = empresa

        # ── Sucursales ────────────────────────────────────────────────────
        sucursales_map = {}
        for nombre, codigo, direccion in [
            ('Sede Central Lima', 'SEDE001', 'Av. Principal 456, Lima'),
            ('Sede Arequipa', 'SEDE002', 'Calle Comercio 789, Arequipa'),
        ]:
            s, _ = Sucursal.objects.get_or_create(
                idempresa=empresa,
                codigo=codigo,
                defaults={'nombre': nombre, 'direccion': direccion},
            )
            sucursales_map[codigo] = s
            self._log('📍', 'Sucursal', f'{s.nombre} ({s.codigo})')
        self._sucursal_lima = sucursales_map['SEDE001']
        self._sucursal_aqp = sucursales_map['SEDE002']

        # ── Almacenes (en Lima) ───────────────────────────────────────────
        almacenes_map = {}
        for suc, nombre, codigo, desc in [
            (sucursales_map['SEDE001'], 'Almacén Principal', 'ALM001', 'Almacén principal de operaciones'),
            (sucursales_map['SEDE001'], 'Almacén Secundario', 'ALM002', 'Almacén secundario de respaldo'),
        ]:
            a, _ = Almacen.objects.get_or_create(
                idsucursal=suc,
                codigo=codigo,
                defaults={
                    'nombre': nombre,
                    'descripcion': desc,
                    'ancho': 800,
                    'alto': 500,
                    'capacidadmaxima': 10000,
                },
            )
            almacenes_map[codigo] = a
            self._log('🏬', 'Almacén', f'{a.nombre} ({a.codigo})')
        self._almacen_principal = almacenes_map['ALM001']
        self._almacen_secundario = almacenes_map['ALM002']

    # ------------------------------------------------------------------
    # permisos
    # ------------------------------------------------------------------

    def _seed_permisos(self):
        """Fase 2 — Crea el catálogo de permisos del sistema (24 permisos).

        Cada permiso tiene un código único (ej. ``ver_empresa``), un nombre
        descriptivo y una descripción. Se almacenan en ``self._permisos``
        para ser referenciados al asignarlos a roles.
        """
        self._section('🔑 Permisos:')

        permisos_data = [
            ('ver_empresa', 'Ver Empresas', 'Visualizar listado y detalle de empresas'),
            ('crear_empresa', 'Crear Empresas', 'Registrar nuevas empresas'),
            ('editar_empresa', 'Editar Empresas', 'Modificar datos de empresas'),
            ('eliminar_empresa', 'Eliminar Empresas', 'Desactivar empresas'),
            ('ver_sucursal', 'Ver Sucursales', 'Visualizar sucursales'),
            ('crear_sucursal', 'Crear Sucursales', 'Registrar nuevas sucursales'),
            ('editar_sucursal', 'Editar Sucursales', 'Modificar sucursales'),
            ('eliminar_sucursal', 'Eliminar Sucursales', 'Desactivar sucursales'),
            ('ver_almacen', 'Ver Almacenes', 'Visualizar almacenes'),
            ('crear_almacen', 'Crear Almacenes', 'Registrar nuevos almacenes'),
            ('editar_almacen', 'Editar Almacenes', 'Modificar almacenes'),
            ('eliminar_almacen', 'Eliminar Almacenes', 'Desactivar almacenes'),
            ('ver_seguridad', 'Ver Seguridad', 'Visualizar usuarios, roles y permisos'),
            ('gestionar_seguridad', 'Gestionar Seguridad', 'Crear/editar usuarios, roles y permisos'),
            ('ver_layout', 'Ver Layout', 'Visualizar layout del almacén'),
            ('gestionar_layout', 'Gestionar Layout', 'Crear/editar zonas, pasillos, estantes, etc.'),
            ('ver_inventario', 'Ver Inventario', 'Visualizar productos, stock y kardex'),
            ('gestionar_inventario', 'Gestionar Inventario', 'Crear/editar productos, lotes y stock'),
            ('registrar_kardex', 'Registrar Kardex', 'Registrar entradas/salidas de inventario'),
            ('ver_picking', 'Ver Picking', 'Visualizar órdenes de picking'),
            ('gestionar_picking', 'Gestionar Picking', 'Crear/editar órdenes y reportar incidencias'),
            ('ver_transferencia', 'Ver Transferencias', 'Visualizar transferencias'),
            ('gestionar_transferencia', 'Gestionar Transferencias', 'Crear/enviar/recibir transferencias'),
            ('ver_dashboard', 'Ver Dashboard', 'Visualizar KPIs y estadísticas'),
        ]

        self._permisos = {}
        for codigo, nombre, descripcion in permisos_data:
            p, created = Permiso.objects.get_or_create(
                codigo=codigo,
                defaults={'nombre': nombre, 'descripcion': descripcion},
            )
            self._permisos[codigo] = p
        self._log('🔑', 'Permisos creados', len(permisos_data))

    # ------------------------------------------------------------------
    # roles
    # ------------------------------------------------------------------

    def _seed_roles(self):
        """Fase 3 — Crea los roles y les asigna permisos.

        Roles creados:
        - **Administrador**: todos los permisos (acceso total).
        - **Supervisor**: permisos ``ver_*`` + gestión operativa.
        - **Operario**: permisos básicos de almacén (ver inventario/picking,
          gestionar picking, registrar kardex).
        """
        self._section('👥 Roles y asignación de permisos:')

        empresa = self._empresa

        # ── Rol Administrador (todos los permisos) ────────────────────────
        rol_admin, _ = self._safe_get_or_create(
            Rol,
            {'idempresa': empresa, 'nombre': 'Administrador'},
            {'descripcion': 'Acceso total al sistema'},
        )
        for permiso in self._permisos.values():
            RolPermiso.objects.get_or_create(idrol=rol_admin, idpermiso=permiso)
        self._log('👤', 'Rol', f'{rol_admin.nombre} ({len(self._permisos)} permisos)')
        self._rol_admin = rol_admin

        # ── Rol Supervisor (lectura + gestión) ────────────────────────────
        supervisor_codes = [
            k for k in self._permisos
            if k.startswith('ver_') or k in (
                'gestionar_picking', 'gestionar_inventario',
                'gestionar_transferencia', 'gestionar_layout',
            )
        ]
        rol_supervisor, _ = self._safe_get_or_create(
            Rol,
            {'idempresa': empresa, 'nombre': 'Supervisor'},
            {'descripcion': 'Supervisa operaciones de almacén'},
        )
        for key in supervisor_codes:
            RolPermiso.objects.get_or_create(idrol=rol_supervisor, idpermiso=self._permisos[key])
        self._log('👤', 'Rol', f'{rol_supervisor.nombre} ({len(supervisor_codes)} permisos)')
        self._rol_supervisor = rol_supervisor

        # ── Rol Operario (permisos básicos) ───────────────────────────────
        operario_codes = [
            'ver_dashboard', 'ver_inventario', 'ver_picking',
            'gestionar_picking', 'registrar_kardex',
        ]
        rol_operario, _ = self._safe_get_or_create(
            Rol,
            {'idempresa': empresa, 'nombre': 'Operario'},
            {'descripcion': 'Operario de almacén'},
        )
        for key in operario_codes:
            RolPermiso.objects.get_or_create(idrol=rol_operario, idpermiso=self._permisos[key])
        self._log('👤', 'Rol', f'{rol_operario.nombre} ({len(operario_codes)} permisos)')
        self._rol_operario = rol_operario

    # ------------------------------------------------------------------
    # usuarios
    # ------------------------------------------------------------------

    def _seed_usuarios(self):
        """Fase 4 — Crea los usuarios demo y les asigna roles.

        Usuarios:
        - **admin** (``admin_sistema``): administrador global del sistema.
        - **supervisor1** (``admin_empresa``): supervisor de operaciones.
        - **operario1** (``operador``): operario de almacén.

        Cada usuario se crea con ``update_or_create`` para ser reusable.
        """
        self._section('👤 Usuarios:')

        # ── Admin del sistema ─────────────────────────────────────────────
        admin, created = Usuario.objects.update_or_create(
            usuario='admin',
            defaults={
                'correo': 'admin@sipro.com',
                'nombres': 'Admin',
                'apellidos': 'Sistema',
                'tipo_usuario': 'admin_sistema',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        admin.set_password('admin1234')
        admin.save(update_fields=['password'])
        UsuarioRol.objects.get_or_create(idusuario=admin, idrol=self._rol_admin)
        self._log('👑', 'Usuario', f'{admin.usuario} (Admin)')
        self._admin = admin

        # ── Supervisor ────────────────────────────────────────────────────
        supervisor, created = Usuario.objects.update_or_create(
            usuario='supervisor1',
            defaults={
                'correo': 'supervisor1@sipro.com',
                'nombres': 'Carlos',
                'apellidos': 'Mendoza',
                'idempresa': self._empresa,
                'tipo_usuario': 'admin_empresa',
            },
        )
        supervisor.set_password('demo1234')
        supervisor.save(update_fields=['password'])
        UsuarioRol.objects.get_or_create(idusuario=supervisor, idrol=self._rol_supervisor)
        self._log('👤', 'Usuario', f'{supervisor.usuario} (Supervisor)')
        self._supervisor = supervisor

        # ── Operario ──────────────────────────────────────────────────────
        operario, created = Usuario.objects.update_or_create(
            usuario='operario1',
            defaults={
                'correo': 'operario1@sipro.com',
                'nombres': 'Luis',
                'apellidos': 'García',
                'idempresa': self._empresa,
                'tipo_usuario': 'operador',
            },
        )
        operario.set_password('demo1234')
        operario.save(update_fields=['password'])
        UsuarioRol.objects.get_or_create(idusuario=operario, idrol=self._rol_operario)
        self._log('👤', 'Usuario', f'{operario.usuario} (Operario)')
        self._operario = operario

    # ------------------------------------------------------------------
    # layout
    # ------------------------------------------------------------------

    def _seed_layout(self):
        """Fase 5 — Construye el layout completo del almacén principal.

        Fases dentro del layout:
        1. **Zonas**: Recepción, Tránsito, Espera, Despacho, Almacenamiento
           A (alta rotación) y B (baja rotación).
        2. **Pasillos**: un pasillo vertical que cruza las zonas de servicio
           y dos pasillos horizontales (Norte y Sur) en las zonas de almacén.
        3. **Estantes**: 8 estantes (A1-A4 en pasillo Norte, B1-B4 en
           pasillo Sur), cada uno con 3 niveles y 2 ubicaciones por nivel.
        4. **Ubicaciones**: 30 ubicaciones físicas (8 estantes × 3 niveles
           × 2 = 48, pero se toman las primeras 30 para este demo).
        5. **Nodos**: 13 nodos del grafo de navegación (entrada,
           intersecciones, puntos de recogida y salida).
        6. **Conexiones**: 14 aristas que conectan los nodos formando la
           red de rutas del almacén.
        """
        self._section('🗺  Layout del Almacén:')
        almacen = self._almacen_principal

        # ── Fase 1: Zonas ─────────────────────────────────────────────────
        # Se definen 6 zonas con coordenadas y colores para visualización
        zonas_data = [
            ('Z-REC', 'Recepción', 'recepcion', 0, 0, 150, 120, '#4CAF50'),
            ('Z-TRANS', 'Zona Tránsito', 'almacenamiento', 0, 120, 150, 130, '#FFC107'),
            ('Z-ESPERA', 'Zona Espera', 'almacenamiento', 0, 250, 150, 130, '#FF9800'),
            ('Z-DES', 'Despacho', 'despacho', 0, 380, 150, 120, '#F44336'),
            ('Z-ALM-A', 'Almacenamiento A (Alta Rotación)', 'almacenamiento', 200, 0, 600, 200, '#2196F3'),
            ('Z-ALM-B', 'Almacenamiento B (Baja Rotación)', 'almacenamiento', 200, 250, 600, 200, '#9C27B0'),
        ]
        zonas = []
        for codigo, nombre, tipo, x, y, ancho, alto, color in zonas_data:
            z, _ = Zona.objects.get_or_create(
                idalmacen=almacen,
                codigo=codigo,
                defaults={'nombre': nombre, 'tipo': tipo, 'x': x, 'y': y, 'ancho': ancho, 'alto': alto, 'color': color},
            )
            zonas.append(z)
        self._log('🗺', 'Zonas', len(zonas))

        # Referencias a zonas específicas para la siguiente fase
        zona_alm_a = zonas[4]
        zona_alm_b = zonas[5]
        zona_trans = zonas[1]

        # ── Fase 2: Pasillos ──────────────────────────────────────────────
        pasillos_data = [
            ('P-01', 'Pasillo Vertical', zona_trans, 150, 0, 50, 500, 'vertical'),
            ('P-02', 'Pasillo Norte', zona_alm_a, 200, 200, 600, 50, 'horizontal'),
            ('P-03', 'Pasillo Sur', zona_alm_b, 200, 450, 600, 50, 'horizontal'),
        ]
        pasillos = []
        for codigo, nombre, zona, x, y, ancho, largo, orientacion in pasillos_data:
            p, _ = Pasillo.objects.get_or_create(
                idzona=zona,
                codigo=codigo,
                defaults={'nombre': nombre, 'x': x, 'y': y, 'ancho': ancho, 'largo': largo, 'orientacion': orientacion},
            )
            pasillos.append(p)
        self._log('📏', 'Pasillos', len(pasillos))

        pasillo_norte = pasillos[1]
        pasillo_sur = pasillos[2]

        # ── Fase 3: Estantes ──────────────────────────────────────────────
        # 4 estantes en cada pasillo, con 3 niveles cada uno
        estantes_data = [
            ('E01', 'Estante A1', pasillo_norte, 220, 80, 'izquierda'),
            ('E02', 'Estante A2', pasillo_norte, 340, 80, 'izquierda'),
            ('E03', 'Estante A3', pasillo_norte, 460, 80, 'izquierda'),
            ('E04', 'Estante A4', pasillo_norte, 580, 80, 'izquierda'),
            ('E05', 'Estante B1', pasillo_sur, 220, 330, 'izquierda'),
            ('E06', 'Estante B2', pasillo_sur, 340, 330, 'izquierda'),
            ('E07', 'Estante B3', pasillo_sur, 460, 330, 'izquierda'),
            ('E08', 'Estante B4', pasillo_sur, 580, 330, 'izquierda'),
        ]
        estantes = []
        for codigo, nombre, pasillo, x, y, lado in estantes_data:
            e, _ = Estante.objects.get_or_create(
                idpasillo=pasillo,
                codigo=codigo,
                defaults={
                    'nombre': nombre, 'x': x, 'y': y, 'lado': lado,
                    'ancho': 30, 'alto': 40, 'profundidad': 50, 'cantidadniveles': 3,
                },
            )
            estantes.append(e)
        self._log('📦', 'Estantes', len(estantes))

        # ── Fase 4: Niveles (3 por estante) ───────────────────────────────
        niveles = []
        for estante in estantes:
            for k in range(1, 4):
                n, _ = Nivel.objects.get_or_create(
                    idestante=estante,
                    numero=k,
                    defaults={'nombre': f'Nivel {k} — {estante.codigo}', 'altura': 10},
                )
                niveles.append(n)
        self._log('📊', 'Niveles', len(niveles))

        # ── Fase 4b: Ubicaciones (2 por nivel, código: E01-N1-U1) ─────────
        ubicaciones = []
        for nivel in niveles:
            for m in range(1, 3):
                est_cod = nivel.idestante.codigo
                codigo = f'{est_cod}-N{nivel.numero}-U{m}'
                u, _ = Ubicacion.objects.get_or_create(
                    codigo=codigo,
                    defaults={
                        'idnivel': nivel,
                        'capacidadpeso': 200,
                        'capacidadvolumen': Decimal('2.50'),
                    },
                )
                ubicaciones.append(u)
        self._log('📍', 'Ubicaciones', len(ubicaciones))
        self._ubicaciones = ubicaciones

        # ── Fase 5: Nodos del grafo de navegación ─────────────────────────
        # Nodos sobre el Pasillo Vertical (x=150-200)
        # y sobre los Pasillos Norte (y=200-250) y Sur (y=450-500)
        nodos_data = [
            ('N-Entrada', 'entrada', 75, 60),
            ('N-Int-N', 'interseccion', 175, 25),
            ('N-Int-C', 'interseccion', 175, 225),
            ('N-Int-S', 'interseccion', 175, 475),
            ('N-Pick-A1', 'punto_recogida', 235, 200),
            ('N-Pick-A2', 'punto_recogida', 355, 200),
            ('N-Pick-A3', 'punto_recogida', 475, 200),
            ('N-Pick-A4', 'punto_recogida', 595, 200),
            ('N-Pick-B1', 'punto_recogida', 235, 450),
            ('N-Pick-B2', 'punto_recogida', 355, 450),
            ('N-Pick-B3', 'punto_recogida', 475, 450),
            ('N-Pick-B4', 'punto_recogida', 595, 450),
            ('N-Salida', 'salida', 75, 440),
        ]
        nodos = []
        for nombre, tipo, cx, cy in nodos_data:
            n, _ = self._safe_get_or_create(
                Nodo,
                {'idalmacen': almacen, 'nombre': nombre},
                {'tipo': tipo, 'coordenada_x': cx, 'coordenada_y': cy, 'idubicacion': None},
            )
            nodos.append(n)
        self._log('🔵', 'Nodos', len(nodos))

        # ── Fase 6: Conexiones (aristas del grafo) ────────────────────────
        # Se definen 14 conexiones que forman:
        # - Eje vertical: Entrada → Int-N → Int-C → Int-S → Salida
        # - Eje norte: Pick-A1 → Pick-A2 → Pick-A3 → Pick-A4
        # - Eje sur: Pick-B1 → Pick-B2 → Pick-B3 → Pick-B4
        # - Cruces vertical ↔ norte: Int-C → Pick-A1, Int-N → Pick-A4
        # - Cruces vertical ↔ sur: Int-S → Pick-B1, Int-C → Pick-B4
        conexiones = []
        for origen_idx, destino_idx, distancia, tipo in [
            # Eje vertical (Pasillo Vertical)
            (0, 1, 110, 'acceso'),        # N-Entrada → N-Int-N
            (1, 2, 200, 'pasillo'),       # N-Int-N → N-Int-C
            (2, 3, 250, 'pasillo'),       # N-Int-C → N-Int-S

            # Eje horizontal norte (Pasillo Norte)
            (4, 5, 120, 'pasillo'),       # N-Pick-A1 → N-Pick-A2
            (5, 6, 120, 'pasillo'),       # N-Pick-A2 → N-Pick-A3
            (6, 7, 120, 'pasillo'),       # N-Pick-A3 → N-Pick-A4

            # Eje horizontal sur (Pasillo Sur)
            (8, 9, 120, 'pasillo'),       # N-Pick-B1 → N-Pick-B2
            (9, 10, 120, 'pasillo'),      # N-Pick-B2 → N-Pick-B3
            (10, 11, 120, 'pasillo'),     # N-Pick-B3 → N-Pick-B4

            # Conexiones vertical ↔ norte
            (2, 4, 80, 'cruce'),          # N-Int-C → N-Pick-A1
            (1, 7, 540, 'cruce'),         # N-Int-N → N-Pick-A4

            # Conexiones vertical ↔ sur
            (3, 8, 65, 'cruce'),          # N-Int-S → N-Pick-B1
            (2, 11, 500, 'cruce'),        # N-Int-C → N-Pick-B4

            # Salida
            (3, 12, 110, 'acceso'),       # N-Int-S → N-Salida
        ]:
            c, _ = Conexion.objects.get_or_create(
                idnodoorigen=nodos[origen_idx],
                idnododestino=nodos[destino_idx],
                defaults={'distancia': distancia, 'tipo': tipo},
            )
            conexiones.append(c)
        self._log('🔗', 'Conexiones', len(conexiones))

    # ------------------------------------------------------------------
    # inventario
    # ------------------------------------------------------------------

    def _seed_inventario(self):
        """Fase 6 — Crea categorías, productos, lotes, inventario y kardex.

        Fases:
        1. **Categorías**: Electrónicos, Alimentos, Limpieza, Empaques, Bebidas.
        2. **Productos**: 15 SKUs con precios, pesos y control de lotes.
        3. **Lotes**: 10 lotes con fechas de producción/vencimiento para
           productos perecibles (arroces, aceites, leches, etc.).
        4. **Inventario**: 30 registros de stock distribuidos en ubicaciones.
        5. **Kardex**: 20 movimientos de entrada/salida con saldos.
        """
        self._section('📦 Inventario:')

        # ── Fase 1: Categorías ────────────────────────────────────────────
        categorias = {}
        for nombre, desc in [
            ('Electrónicos', 'Dispositivos y componentes electrónicos'),
            ('Alimentos', 'Productos alimenticios y perecibles'),
            ('Limpieza', 'Artículos de limpieza y aseo'),
            ('Empaques', 'Materiales de embalaje y empaque'),
            ('Bebidas', 'Bebidas de todo tipo'),
        ]:
            c, _ = self._safe_get_or_create(Categoria, {'nombre': nombre}, {'descripcion': desc})
            categorias[nombre] = c
        self._log('📁', 'Categorías', len(categorias))

        cat_elec = categorias['Electrónicos']
        cat_ali = categorias['Alimentos']
        cat_limp = categorias['Limpieza']
        cat_emp = categorias['Empaques']
        cat_beb = categorias['Bebidas']

        # ── Fase 2: Productos ─────────────────────────────────────────────
        # Cada producto tiene: SKU, nombre, categoría, descripción, unidad
        # de medida, peso, volumen, precio costo/venta, y bandera maneja_lotes
        productos_data = [
            ('SKU-001', 'Laptop HP 15.6"', cat_elec, 'Laptop HP Pavilion 15.6 pulgadas', 'unidad', Decimal('2.500'), Decimal('0.015'), Decimal('1800.00'), Decimal('2500.00'), True),
            ('SKU-002', 'Monitor Dell 24"', cat_elec, 'Monitor LED Full HD 24 pulgadas', 'unidad', Decimal('4.000'), Decimal('0.030'), Decimal('600.00'), Decimal('900.00'), False),
            ('SKU-003', 'Teclado Mecánico RGB', cat_elec, 'Teclado mecánico retroiluminado RGB', 'unidad', Decimal('0.800'), Decimal('0.005'), Decimal('120.00'), Decimal('200.00'), False),
            ('SKU-004', 'Mouse Inalámbrico Logitech', cat_elec, 'Mouse ergonómico inalámbrico', 'unidad', Decimal('0.150'), Decimal('0.001'), Decimal('80.00'), Decimal('140.00'), False),
            ('SKU-005', 'Impresora Multifuncional', cat_elec, 'Impresora láser multifunción', 'unidad', Decimal('8.000'), Decimal('0.080'), Decimal('450.00'), Decimal('700.00'), False),
            ('SKU-006', 'Arroz Extra 1kg', cat_ali, 'Arroz extra premium bolsa 1kg', 'kg', None, None, Decimal('4.50'), Decimal('6.50'), True),
            ('SKU-007', 'Aceite Vegetal 1L', cat_ali, 'Aceite vegetal botella 1 litro', 'unidad', Decimal('0.920'), Decimal('0.001'), Decimal('8.00'), Decimal('12.00'), True),
            ('SKU-008', 'Leche Evaporada 400g', cat_ali, 'Leche evaporada entera lata 400g', 'unidad', Decimal('0.400'), Decimal('0.0004'), Decimal('3.50'), Decimal('5.00'), True),
            ('SKU-009', 'Azúcar Rubia 1kg', cat_ali, 'Azúcar rubia doméstica bolsa 1kg', 'kg', None, None, Decimal('4.00'), Decimal('5.50'), True),
            ('SKU-010', 'Detergente Líquido 2L', cat_limp, 'Detergente líquido multiuso 2 litros', 'unidad', Decimal('2.100'), Decimal('0.002'), Decimal('15.00'), Decimal('22.00'), False),
            ('SKU-011', 'Desinfectante 1L', cat_limp, 'Desinfectante concentrado 1 litro', 'unidad', Decimal('1.050'), Decimal('0.001'), Decimal('8.00'), Decimal('12.00'), False),
            ('SKU-012', 'Papel Higiénico 24u', cat_limp, 'Paquete de 24 rollos doble hoja', 'caja', Decimal('2.500'), Decimal('0.010'), Decimal('18.00'), Decimal('28.00'), False),
            ('SKU-013', 'Caja de Embalaje Grande', cat_emp, 'Caja de cartón corrugado 60x40x40cm', 'caja', Decimal('0.500'), Decimal('0.096'), Decimal('3.50'), Decimal('6.00'), False),
            ('SKU-014', 'Cinta de Embalaje 100m', cat_emp, 'Cinta adhesiva transparente 100 metros', 'unidad', Decimal('0.300'), Decimal('0.0005'), Decimal('5.00'), Decimal('8.00'), False),
            ('SKU-015', 'Film Stretch Industrial', cat_emp, 'Film estirable para paletizado industrial', 'unidad', Decimal('2.000'), Decimal('0.003'), Decimal('25.00'), Decimal('38.00'), False),
        ]

        productos = {}
        for codigo, nombre, cat, desc, udm, peso, vol, pc, pv, lotes in productos_data:
            p, _ = Producto.objects.get_or_create(
                codigo=codigo,
                defaults={
                    'idcategoria': cat,
                    'nombre': nombre,
                    'descripcion': desc,
                    'unidad_medida': udm,
                    'peso': peso,
                    'volumen': vol,
                    'precio_costo': pc,
                    'precio_venta': pv,
                    'stock_minimo': pc * 2 if pc else 10,
                    'stock_maximo': pv * 40 if pv else 200,
                    'maneja_lotes': lotes,
                },
            )
            productos[codigo] = p
        self._log('📦', 'Productos', len(productos))
        self._productos = productos

        # ── Fase 3: Lotes (con fechas de vencimiento) ─────────────────────
        today = date.today()
        lotes = []
        for sku, num_lote, fp, fv, ci, ca in [
            ('SKU-001', 'LOT-HP-2026-001', today - timedelta(days=30), today + timedelta(days=1095), 50, 45),
            ('SKU-006', 'LOT-ARROZ-2026-01', today - timedelta(days=15), today + timedelta(days=180), 500, 480),
            ('SKU-006', 'LOT-ARROZ-2026-02', today - timedelta(days=5), today + timedelta(days=200), 300, 300),
            ('SKU-007', 'LOT-ACEITE-2026-01', today - timedelta(days=20), today + timedelta(days=365), 200, 180),
            ('SKU-007', 'LOT-ACEITE-2026-02', today - timedelta(days=2), today + timedelta(days=365), 150, 150),
            ('SKU-008', 'LOT-LECHE-2026-01', today - timedelta(days=10), today + timedelta(days=90), 400, 350),
            ('SKU-008', 'LOT-LECHE-2026-02', today - timedelta(days=3), today + timedelta(days=120), 200, 200),
            ('SKU-009', 'LOT-AZUCAR-2026-01', today - timedelta(days=25), today + timedelta(days=365), 600, 550),
            ('SKU-010', 'LOT-DET-2026-01', today - timedelta(days=60), today + timedelta(days=365), 150, 140),
            ('SKU-011', 'LOT-DES-2026-01', today - timedelta(days=45), today + timedelta(days=365), 250, 240),
        ]:
            prod = productos[sku]
            l, _ = Lote.objects.get_or_create(
                idproducto=prod,
                numero_lote=num_lote,
                defaults={
                    'fecha_produccion': fp,
                    'fecha_vencimiento': fv,
                    'cantidad_inicial': ci,
                    'cantidad_actual': ca,
                },
            )
            lotes.append(l)
        self._log('🏷', 'Lotes', len(lotes))

        # ── Fase 4: Inventario (stock por ubicación y lote) ───────────────
        ubicaciones = self._ubicaciones
        inv_entries = [
            (productos['SKU-001'], lotes[0], ubicaciones[0], 5),
            (productos['SKU-001'], lotes[0], ubicaciones[1], 10),
            (productos['SKU-001'], lotes[0], ubicaciones[2], 30),
            (productos['SKU-002'], None, ubicaciones[3], 15),
            (productos['SKU-002'], None, ubicaciones[4], 20),
            (productos['SKU-003'], None, ubicaciones[5], 40),
            (productos['SKU-003'], None, ubicaciones[6], 30),
            (productos['SKU-004'], None, ubicaciones[7], 60),
            (productos['SKU-004'], None, ubicaciones[8], 40),
            (productos['SKU-005'], None, ubicaciones[9], 10),
            (productos['SKU-006'], lotes[1], ubicaciones[10], 100),
            (productos['SKU-006'], lotes[1], ubicaciones[11], 200),
            (productos['SKU-006'], lotes[2], ubicaciones[12], 180),
            (productos['SKU-006'], lotes[2], ubicaciones[13], 120),
            (productos['SKU-007'], lotes[3], ubicaciones[14], 80),
            (productos['SKU-007'], lotes[3], ubicaciones[15], 60),
            (productos['SKU-007'], lotes[4], ubicaciones[16], 100),
            (productos['SKU-008'], lotes[5], ubicaciones[17], 150),
            (productos['SKU-008'], lotes[5], ubicaciones[18], 100),
            (productos['SKU-008'], lotes[6], ubicaciones[19], 100),
            (productos['SKU-009'], lotes[7], ubicaciones[20], 250),
            (productos['SKU-009'], lotes[7], ubicaciones[21], 300),
            (productos['SKU-010'], lotes[8], ubicaciones[22], 50),
            (productos['SKU-010'], lotes[8], ubicaciones[23], 90),
            (productos['SKU-011'], lotes[9], ubicaciones[24], 100),
            (productos['SKU-011'], lotes[9], ubicaciones[25], 80),
            (productos['SKU-012'], None, ubicaciones[26], 50),
            (productos['SKU-013'], None, ubicaciones[27], 200),
            (productos['SKU-014'], None, ubicaciones[28], 150),
            (productos['SKU-015'], None, ubicaciones[29], 60),
        ]
        for prod, lote, ubic, cant in inv_entries:
            Inventario.objects.get_or_create(
                idproducto=prod,
                idlote=lote,
                idubicacion=ubic,
                defaults={'cantidad': cant},
            )
        self._log('📊', 'Inventario', len(inv_entries))

        # ── Fase 5: Kardex (movimientos históricos) ───────────────────────
        # Solo se crean si no existen (evita duplicados al re-ejecutar)
        if not Kardex.objects.exists():
            kardex_entries = [
                (productos['SKU-001'], lotes[0], ubicaciones[0], 'entrada', 50, 0, 50),
                (productos['SKU-001'], lotes[0], ubicaciones[1], 'entrada', 10, 0, 10),
                (productos['SKU-001'], lotes[0], ubicaciones[0], 'salida', 5, 50, 45),
                (productos['SKU-002'], None, ubicaciones[3], 'entrada', 35, 0, 35),
                (productos['SKU-003'], None, ubicaciones[5], 'entrada', 70, 0, 70),
                (productos['SKU-004'], None, ubicaciones[7], 'entrada', 100, 0, 100),
                (productos['SKU-005'], None, ubicaciones[9], 'entrada', 10, 0, 10),
                (productos['SKU-006'], lotes[1], ubicaciones[10], 'entrada', 300, 0, 300),
                (productos['SKU-006'], lotes[1], ubicaciones[10], 'salida', 20, 300, 280),
                (productos['SKU-006'], lotes[2], ubicaciones[12], 'entrada', 300, 0, 300),
                (productos['SKU-007'], lotes[3], ubicaciones[14], 'entrada', 200, 0, 200),
                (productos['SKU-007'], lotes[3], ubicaciones[14], 'salida', 20, 200, 180),
                (productos['SKU-008'], lotes[5], ubicaciones[17], 'entrada', 400, 0, 400),
                (productos['SKU-008'], lotes[5], ubicaciones[17], 'salida', 50, 400, 350),
                (productos['SKU-009'], lotes[7], ubicaciones[20], 'entrada', 600, 0, 600),
                (productos['SKU-009'], lotes[7], ubicaciones[20], 'salida', 50, 600, 550),
                (productos['SKU-010'], lotes[8], ubicaciones[22], 'entrada', 150, 0, 150),
                (productos['SKU-010'], lotes[8], ubicaciones[22], 'salida', 10, 150, 140),
                (productos['SKU-011'], lotes[9], ubicaciones[24], 'entrada', 250, 0, 250),
                (productos['SKU-011'], lotes[9], ubicaciones[24], 'salida', 10, 250, 240),
            ]
            for prod, lote, ubic, tipo, cant, sa, sn in kardex_entries:
                Kardex.objects.create(
                    idproducto=prod,
                    idlote=lote,
                    idubicacion=ubic,
                    tipo_movimiento=tipo,
                    cantidad=cant,
                    saldo_anterior=sa,
                    saldo_nuevo=sn,
                    idusuario=self._admin,
                )
            self._log('📋', 'Kardex', len(kardex_entries))
        else:
            self._log('📋', 'Kardex ya existente', 'omitido')

    # ------------------------------------------------------------------
    # picking
    # ------------------------------------------------------------------

    def _seed_picking(self):
        """Fase 7 — Crea órdenes de picking demo en distintos estados del flujo.

        Órdenes:
        - **PICK-2026-001**: pendiente, 3 detalles (arroz, detergente, cajas).
        - **PICK-2026-002**: en proceso, 3 detalles con pickeo parcial.
        - **PICK-2026-003**: completada, 3 detalles totalmente pickeados.
        - **PICK-2026-004**: cancelada, 2 incidencias (faltante y dañado).
        """
        self._section('📋 Picking:')
        almacen = self._almacen_principal
        ubicaciones = self._ubicaciones
        prods = self._productos

        prod1 = prods['SKU-001']
        prod2 = prods['SKU-006']
        prod3 = prods['SKU-010']
        prod4 = prods['SKU-013']

        # ── Orden 1: Pendiente ────────────────────────────────────────────
        op1, _ = OrdenPicking.objects.get_or_create(
            numero_orden='PICK-2026-001',
            defaults={
                'idalmacen': almacen,
                'idusuario': self._operario,
                'estado': 'pendiente',
                'prioridad': 1,
                'notas': 'Orden de picking para cliente minorista',
            },
        )
        self._make_detalle(op1, prod2, ubicaciones[10], 10, 0, 'pendiente')
        self._make_detalle(op1, prod3, ubicaciones[22], 5, 0, 'pendiente')
        self._make_detalle(op1, prod4, ubicaciones[27], 20, 0, 'pendiente')
        self._log('📋', 'Orden', f'{op1.numero_orden} (Pendiente)')

        # ── Orden 2: En proceso (pickeo parcial) ──────────────────────────
        op2, _ = OrdenPicking.objects.get_or_create(
            numero_orden='PICK-2026-002',
            defaults={
                'idalmacen': almacen,
                'idusuario': self._operario,
                'estado': 'en_proceso',
                'prioridad': 2,
                'notas': 'Orden urgente',
            },
        )
        self._make_detalle(op2, prod1, ubicaciones[0], 3, 2, 'en_proceso')
        self._make_detalle(op2, prod2, ubicaciones[11], 15, 10, 'en_proceso')
        self._make_detalle(op2, prod3, ubicaciones[23], 8, 4, 'en_proceso')
        self._log('📋', 'Orden', f'{op2.numero_orden} (En Proceso)')

        # ── Orden 3: Completada (pickeo total, sin incidencias) ───────────
        op3, _ = OrdenPicking.objects.get_or_create(
            numero_orden='PICK-2026-003',
            defaults={
                'idalmacen': almacen,
                'idusuario': self._operario,
                'estado': 'completado',
                'prioridad': 1,
                'notas': 'Completada sin incidencias',
                'fecha_completado': timezone.now() - timedelta(days=1),
            },
        )
        self._make_detalle(op3, prod2, ubicaciones[12], 20, 20, 'completado')
        self._make_detalle(op3, prod3, ubicaciones[22], 12, 12, 'completado')
        self._make_detalle(op3, prod4, ubicaciones[28], 50, 50, 'completado')
        self._log('📋', 'Orden', f'{op3.numero_orden} (Completado)')

        # ── Orden 4: Cancelada con incidencias ────────────────────────────
        op4, _ = OrdenPicking.objects.get_or_create(
            numero_orden='PICK-2026-004',
            defaults={
                'idalmacen': almacen,
                'idusuario': self._operario,
                'estado': 'cancelado',
                'prioridad': 3,
                'notas': 'Cancelada por falta de stock',
            },
        )
        dp4a, _ = self._make_detalle(op4, prod1, ubicaciones[2], 10, 0, 'pendiente')
        dp4b, _ = self._make_detalle(op4, prod4, ubicaciones[29], 30, 0, 'pendiente')
        dp4c, _ = self._make_detalle(op4, prod3, ubicaciones[24], 15, 0, 'pendiente')
        self._log('📋', 'Orden', f'{op4.numero_orden} (Cancelado)')

        # Incidencias asociadas a la orden cancelada
        self._make_incidencia(dp4a, 'faltante', 'Producto no encontrado en ubicación asignada', 10)
        self._make_incidencia(dp4b, 'danado', 'Cajas de embalaje presentan daños por humedad', 30)
        self._log('⚠', 'Incidencias', 2)

    def _make_detalle(self, orden, producto, ubicacion, solicitada, pickeada, estado):
        """Crea (o recupera) un detalle de picking con los datos dados.

        Args:
            orden: Instancia de OrdenPicking.
            producto: Instancia de Producto.
            ubicacion: Instancia de Ubicacion.
            solicitada: Cantidad solicitada.
            pickeada: Cantidad realmente pickeada.
            estado: Estado del detalle (pendiente, en_proceso, completado).

        Returns:
            tuple: (DetallePicking, creado) según _safe_get_or_create.
        """
        return self._safe_get_or_create(
            DetallePicking,
            {'idorden': orden, 'idproducto': producto},
            {
                'idubicacion': ubicacion,
                'cantidad_solicitada': solicitada,
                'cantidad_pickeada': pickeada,
                'estado': estado,
            },
        )

    def _make_incidencia(self, detalle, tipo, descripcion, cantidad):
        """Crea (o recupera) una incidencia asociada a un detalle de picking.

        Args:
            detalle: Instancia de DetallePicking.
            tipo: Tipo de incidencia (faltante, danado, etc.).
            descripcion: Texto descriptivo.
            cantidad: Cantidad reportada como incidencia.

        Returns:
            tuple: (Incidencia, creado) según _safe_get_or_create.
        """
        return self._safe_get_or_create(
            Incidencia,
            {'iddetalle': detalle, 'tipo': tipo},
            {
                'idusuario': self._operario,
                'descripcion': descripcion,
                'cantidad_reportada': cantidad,
                'resuelta': False,
            },
        )

    # ------------------------------------------------------------------
    # transferencias
    # ------------------------------------------------------------------

    def _seed_transferencias(self):
        """Fase 8 — Crea transferencias demo entre el almacén principal y el secundario.

        Transferencias:
        - **TRF-2026-001**: pendiente, 3 productos perecibles (arroz, aceite, leche).
        - **TRF-2026-002**: en tránsito, 3 productos con fecha de envío.
        """
        self._section('🚛 Transferencias:')
        origen = self._almacen_principal
        destino = self._almacen_secundario
        prods = self._productos

        # ── Transferencia 1: Pendiente ────────────────────────────────────
        t1, _ = Transferencia.objects.get_or_create(
            numero_transferencia='TRF-2026-001',
            defaults={
                'idalmacen_origen': origen,
                'idalmacen_destino': destino,
                'idusuario': self._supervisor,
                'estado': 'pendiente',
                'notas': 'Transferencia de productos perecibles al almacén frío',
            },
        )
        self._make_det_transferencia(t1, prods['SKU-006'], 100)
        self._make_det_transferencia(t1, prods['SKU-007'], 50)
        self._make_det_transferencia(t1, prods['SKU-008'], 75)
        self._log('🚛', 'Transferencia', f'{t1.numero_transferencia} (Pendiente)')

        # ── Transferencia 2: En tránsito ──────────────────────────────────
        t2, _ = Transferencia.objects.get_or_create(
            numero_transferencia='TRF-2026-002',
            defaults={
                'idalmacen_origen': origen,
                'idalmacen_destino': destino,
                'idusuario': self._supervisor,
                'estado': 'en_transito',
                'notas': 'En camino al almacén frío',
                'fecha_envio': timezone.now() - timedelta(hours=4),
            },
        )
        self._make_det_transferencia(t2, prods['SKU-006'], 80)
        self._make_det_transferencia(t2, prods['SKU-009'], 200)
        self._make_det_transferencia(t2, prods['SKU-008'], 50)
        self._log('🚛', 'Transferencia', f'{t2.numero_transferencia} (En Tránsito)')

    def _make_det_transferencia(self, transferencia, producto, cantidad):
        """Crea (o recupera) un detalle de transferencia.

        Args:
            transferencia: Instancia de Transferencia.
            producto: Instancia de Producto.
            cantidad: Cantidad a transferir.

        Returns:
            tuple: (DetalleTransferencia, creado).
        """
        return self._safe_get_or_create(
            DetalleTransferencia,
            {'idtransferencia': transferencia, 'idproducto': producto},
            {'cantidad': cantidad},
        )

    # ------------------------------------------------------------------
    # summary
    # ------------------------------------------------------------------

    def _print_summary(self):
        """Imprime el resumen final con conteo de cada entidad y credenciales demo."""
        self.stdout.write('')
        self.stdout.write('=' * 60)
        self.stdout.write('  RESUMEN DE CARGA')
        self.stdout.write('=' * 60)

        # Itera sobre todas las entidades y muestra su conteo con emoji
        for nombre, modelo in [
            ('Empresas', Empresa),
            ('Sucursales', Sucursal),
            ('Almacenes', Almacen),
            ('Permisos', Permiso),
            ('Roles', Rol),
            ('Usuarios', Usuario),
            ('Usuario-Rol', UsuarioRol),
            ('Rol-Permiso', RolPermiso),
            ('Zonas', Zona),
            ('Pasillos', Pasillo),
            ('Estantes', Estante),
            ('Niveles', Nivel),
            ('Ubicaciones', Ubicacion),
            ('Nodos', Nodo),
            ('Conexiones', Conexion),
            ('Categorías', Categoria),
            ('Productos', Producto),
            ('Lotes', Lote),
            ('Inventario', Inventario),
            ('Kardex', Kardex),
            ('Órdenes Picking', OrdenPicking),
            ('Detalles Picking', DetallePicking),
            ('Incidencias', Incidencia),
            ('Transferencias', Transferencia),
            ('Detalles Transferencia', DetalleTransferencia),
        ]:
            count = modelo.objects.count()
            emoji = '✅' if count > 0 else '⚠'
            self.stdout.write(f'  {emoji} {nombre}: {count}')

        # Tabla de credenciales para que el usuario pueda probar el sistema
        self.stdout.write('')
        self.stdout.write('  🔐 Credenciales de acceso:')
        self.stdout.write('  ─────────────────────────────────')
        self.stdout.write('  Usuario        Contraseña       Rol')
        self.stdout.write('  ─────────────────────────────────')
        self.stdout.write('  admin          admin1234         Administrador')
        self.stdout.write('  supervisor1    demo1234         Supervisor')
        self.stdout.write('  operario1      demo1234         Operario')
        self.stdout.write('  ─────────────────────────────────')
        self.stdout.write('')
        self.stdout.write('  🌐 Frontend: http://localhost:8080')
        self.stdout.write('=' * 60)
        self.stdout.write('')


