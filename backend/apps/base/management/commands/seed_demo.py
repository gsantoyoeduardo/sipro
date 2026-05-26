from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone

from infrastructure.models.empresa_model import Almacen, Empresa, Sucursal
from infrastructure.models.inventario_model import Categoria, Inventario, Kardex, Lote, Producto
from infrastructure.models.layout_model import Conexion, Estante, Nivel, Nodo, Ubicacion, Zona
from infrastructure.models.picking_model import DetallePicking, Incidencia, OrdenPicking
from infrastructure.models.seguridad_model import Permiso, Rol, RolPermiso, Usuario, UsuarioRol
from infrastructure.models.transferencia_model import DetalleTransferencia, Transferencia
from infrastructure.utils.tenant_schema import tenant_schema
from application.services.empresa.tenant_service import TenantService


EMPRESAS_DATA = [
    {
        'ruc': '20123456789',
        'razonsocial': 'SIPRO Demo S.A.C.',
        'nombrecomercial': 'SIPRO Demo',
        'correo': 'contacto@siprodemo.pe',
        'telefono': '01-555-0100',
        'direccion': 'Av. Los Almacenes 123, Lima',
        'sucursales': [
            {'nombre': 'Sede Central Lima', 'codigo': 'SEDE001', 'direccion': 'Av. Principal 456, Lima', 'ancho_plano': 2500, 'alto_plano': 1800},
            {'nombre': 'Sede Arequipa', 'codigo': 'SEDE002', 'direccion': 'Calle Comercio 789, Arequipa', 'ancho_plano': 2000, 'alto_plano': 1400},
        ],
    },
    {
        'ruc': '20456789012',
        'razonsocial': 'Logística del Norte S.A.',
        'nombrecomercial': 'LogisNorte',
        'correo': 'info@logisnorte.pe',
        'telefono': '044-555-0200',
        'direccion': 'Av. Industrial 456, Trujillo',
        'sucursales': [
            {'nombre': 'Sede Trujillo', 'codigo': 'SEDE003', 'direccion': 'Av. Industrial 456, Trujillo', 'ancho_plano': 2200, 'alto_plano': 1600},
            {'nombre': 'Sede Chiclayo', 'codigo': 'SEDE004', 'direccion': 'Calle Los Olivos 123, Chiclayo', 'ancho_plano': 1800, 'alto_plano': 1200},
        ],
    },
    {
        'ruc': '20678901234',
        'razonsocial': 'Distribuidora del Sur E.I.R.L.',
        'nombrecomercial': 'DistriSur',
        'correo': 'ventas@distrisur.pe',
        'telefono': '084-555-0300',
        'direccion': 'Av. Ejército 789, Cusco',
        'sucursales': [
            {'nombre': 'Sede Cusco', 'codigo': 'SEDE005', 'direccion': 'Av. Ejército 789, Cusco', 'ancho_plano': 2000, 'alto_plano': 1500},
            {'nombre': 'Sede Arequipa Sur', 'codigo': 'SEDE006', 'direccion': 'Jr. Almacenes 321, Arequipa', 'ancho_plano': 1600, 'alto_plano': 1200},
        ],
    },
]

PERMISOS_PORTAL = [
    ('ver_empresa', 'Ver Empresas', 'Visualizar listado y detalle de empresas'),
    ('crear_empresa', 'Crear Empresas', 'Registrar nuevas empresas'),
    ('editar_empresa', 'Editar Empresas', 'Modificar datos de empresas'),
    ('eliminar_empresa', 'Eliminar Empresas', 'Desactivar empresas'),
    ('ver_seguridad', 'Ver Seguridad', 'Visualizar usuarios, roles y permisos del portal'),
    ('gestionar_seguridad', 'Gestionar Seguridad', 'Crear/editar usuarios, roles y permisos del portal'),
]

PERMISOS_TENANT = [
    ('ver_sucursal', 'Ver Sucursales', 'Visualizar sucursales'),
    ('crear_sucursal', 'Crear Sucursales', 'Registrar nuevas sucursales'),
    ('editar_sucursal', 'Editar Sucursales', 'Modificar sucursales'),
    ('eliminar_sucursal', 'Eliminar Sucursales', 'Desactivar sucursales'),
    ('ver_almacen', 'Ver Almacenes', 'Visualizar almacenes'),
    ('crear_almacen', 'Crear Almacenes', 'Registrar nuevos almacenes'),
    ('editar_almacen', 'Editar Almacenes', 'Modificar almacenes'),
    ('eliminar_almacen', 'Eliminar Almacenes', 'Desactivar almacenes'),
    ('ver_layout', 'Ver Layout', 'Visualizar layout del almacén'),
    ('gestionar_layout', 'Gestionar Layout', 'Crear/editar zonas, estantes, etc.'),
    ('ver_inventario', 'Ver Inventario', 'Visualizar productos, stock y kardex'),
    ('gestionar_inventario', 'Gestionar Inventario', 'Crear/editar productos, lotes y stock'),
    ('registrar_kardex', 'Registrar Kardex', 'Registrar entradas/salidas de inventario'),
    ('ver_picking', 'Ver Picking', 'Visualizar órdenes de picking'),
    ('gestionar_picking', 'Gestionar Picking', 'Crear/editar órdenes y reportar incidencias'),
    ('ver_transferencia', 'Ver Transferencias', 'Visualizar transferencias'),
    ('gestionar_transferencia', 'Gestionar Transferencias', 'Crear/enviar/recibir transferencias'),
    ('ver_dashboard', 'Ver Dashboard', 'Visualizar KPIs y estadísticas'),
]

CATEGORIAS_DATA = [
    ('Electrónicos', 'Dispositivos y componentes electrónicos'),
    ('Alimentos', 'Productos alimenticios y perecibles'),
    ('Limpieza', 'Artículos de limpieza y aseo'),
    ('Empaques', 'Materiales de embalaje y empaque'),
    ('Bebidas', 'Bebidas de todo tipo'),
    ('Ferretería', 'Herramientas y artículos de ferretería'),
]

PRODUCTOS_DATA = [
    ('SKU-001', 'Laptop HP 15.6"', 'Electrónicos', 'Laptop HP Pavilion 15.6 pulgadas', 'unidad', Decimal('2.500'), Decimal('0.015'), Decimal('1800.00'), Decimal('2500.00'), True),
    ('SKU-002', 'Monitor Dell 24"', 'Electrónicos', 'Monitor LED Full HD 24 pulgadas', 'unidad', Decimal('4.000'), Decimal('0.030'), Decimal('600.00'), Decimal('900.00'), False),
    ('SKU-003', 'Teclado Mecánico RGB', 'Electrónicos', 'Teclado mecánico retroiluminado RGB', 'unidad', Decimal('0.800'), Decimal('0.005'), Decimal('120.00'), Decimal('200.00'), False),
    ('SKU-004', 'Mouse Inalámbrico', 'Electrónicos', 'Mouse ergonómico inalámbrico', 'unidad', Decimal('0.150'), Decimal('0.001'), Decimal('80.00'), Decimal('140.00'), False),
    ('SKU-005', 'Router WiFi 6', 'Electrónicos', 'Router WiFi 6 doble banda', 'unidad', Decimal('0.600'), Decimal('0.004'), Decimal('180.00'), Decimal('280.00'), False),
    ('SKU-006', 'Arroz Extra 1kg', 'Alimentos', 'Arroz extra premium bolsa 1kg', 'kg', None, None, Decimal('4.50'), Decimal('6.50'), True),
    ('SKU-007', 'Aceite Vegetal 1L', 'Alimentos', 'Aceite vegetal botella 1 litro', 'unidad', Decimal('0.920'), Decimal('0.001'), Decimal('8.00'), Decimal('12.00'), True),
    ('SKU-008', 'Leche Evaporada 400g', 'Alimentos', 'Leche evaporada entera lata 400g', 'unidad', Decimal('0.400'), Decimal('0.0004'), Decimal('3.50'), Decimal('5.00'), True),
    ('SKU-009', 'Azúcar Rubia 1kg', 'Alimentos', 'Azúcar rubia doméstica bolsa 1kg', 'kg', None, None, Decimal('4.00'), Decimal('5.50'), True),
    ('SKU-010', 'Fideos Spaghetti 500g', 'Alimentos', 'Fideos spaghetti trigo 500g', 'unidad', Decimal('0.500'), Decimal('0.0008'), Decimal('3.00'), Decimal('4.50'), True),
    ('SKU-011', 'Detergente Líquido 2L', 'Limpieza', 'Detergente líquido multiuso 2 litros', 'unidad', Decimal('2.100'), Decimal('0.002'), Decimal('15.00'), Decimal('22.00'), False),
    ('SKU-012', 'Desinfectante 1L', 'Limpieza', 'Desinfectante concentrado 1 litro', 'unidad', Decimal('1.050'), Decimal('0.001'), Decimal('8.00'), Decimal('12.00'), False),
    ('SKU-013', 'Papel Higiénico 24u', 'Limpieza', 'Paquete de 24 rollos doble hoja', 'caja', Decimal('2.500'), Decimal('0.010'), Decimal('18.00'), Decimal('28.00'), False),
    ('SKU-014', 'Lavavajillas 500ml', 'Limpieza', 'Lavavajillas líquido 500ml', 'unidad', Decimal('0.520'), Decimal('0.0005'), Decimal('6.00'), Decimal('10.00'), False),
    ('SKU-015', 'Caja de Embalaje Grande', 'Empaques', 'Caja de cartón corrugado 60x40x40cm', 'caja', Decimal('0.500'), Decimal('0.096'), Decimal('3.50'), Decimal('6.00'), False),
    ('SKU-016', 'Cinta de Embalaje 100m', 'Empaques', 'Cinta adhesiva transparente 100 metros', 'unidad', Decimal('0.300'), Decimal('0.0005'), Decimal('5.00'), Decimal('8.00'), False),
    ('SKU-017', 'Film Stretch Industrial', 'Empaques', 'Film estirable para paletizado', 'unidad', Decimal('2.000'), Decimal('0.003'), Decimal('25.00'), Decimal('38.00'), False),
    ('SKU-018', 'Agua Mineral 1.5L', 'Bebidas', 'Agua mineral natural botella 1.5L', 'unidad', Decimal('1.500'), Decimal('0.0015'), Decimal('2.00'), Decimal('3.50'), True),
    ('SKU-019', 'Gaseosa Cola 3L', 'Bebidas', 'Gaseosa sabor cola botella 3L', 'unidad', Decimal('3.000'), Decimal('0.003'), Decimal('6.00'), Decimal('10.00'), True),
    ('SKU-020', 'Taladro Eléctrico 600W', 'Ferretería', 'Taladro eléctrico 600W con accesorios', 'unidad', Decimal('2.800'), Decimal('0.020'), Decimal('150.00'), Decimal('240.00'), False),
    ('SKU-021', 'Caja de Herramientas 32pz', 'Ferretería', 'Caja de herramientas 32 piezas', 'unidad', Decimal('5.000'), Decimal('0.040'), Decimal('200.00'), Decimal('320.00'), False),
    ('SKU-022', 'Candado Seguridad 40mm', 'Ferretería', 'Candado de seguridad 40mm acero', 'unidad', Decimal('0.300'), Decimal('0.0003'), Decimal('15.00'), Decimal('25.00'), False),
]


class Command(BaseCommand):
    help = 'Precarga datos demo para SIPRO WMS con arquitectura multi-tenant'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Eliminar todo y recrear')

    def handle(self, *args, **options):
        if options['reset']:
            self._reset_all()
        self._print_header()
        self._seed_permisos_portal()
        self._seed_admin_sistema()
        self._today = date.today()
        for i, emp_data in enumerate(EMPRESAS_DATA):
            self._seed_empresa_con_tenant(emp_data, i)
        self._print_summary()

    def _log(self, icon, label, count=None):
        if count is not None:
            self.stdout.write(f'  {icon} {label}: {count}')
        else:
            self.stdout.write(f'  {icon} {label}')

    def _section(self, title):
        self.stdout.write('')
        self.stdout.write(title)

    def _print_header(self):
        self.stdout.write('')
        self.stdout.write('=' * 60)
        self.stdout.write('  SIPRO WMS - Carga de Datos Demo (Multi-Tenant)')
        self.stdout.write('=' * 60)

    def _reset_all(self):
        self.stdout.write('\n** Eliminando datos existentes...')
        with connection.cursor() as cursor:
            cursor.execute("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'empresa_%'")
            schemas = [row[0] for row in cursor.fetchall()]
            for schema in schemas:
                cursor.execute(f"DROP SCHEMA IF EXISTS \"{schema}\" CASCADE")
                self.stdout.write(f'   Schema eliminado: {schema}')

        from infrastructure.models.seguridad_model import SesionUsuario
        SesionUsuario.objects.all().delete()
        Usuario.objects.filter(tipo_usuario='admin_sistema').delete()
        Permiso.objects.all().delete()
        Rol.objects.all().delete()
        RolPermiso.objects.all().delete()
        UsuarioRol.objects.all().delete()
        Empresa.objects.all().delete()
        self.stdout.write('   Datos de public eliminados.')

    def _seed_permisos_portal(self):
        self._section(' Permisos del Portal (public):')
        self._permisos_portal = {}
        for codigo, nombre, descripcion in PERMISOS_PORTAL:
            p, _ = Permiso.objects.get_or_create(
                codigo=codigo,
                defaults={'nombre': nombre, 'descripcion': descripcion},
            )
            self._permisos_portal[codigo] = p
        self._log('', 'Permisos portal creados', len(PERMISOS_PORTAL))

    def _seed_admin_sistema(self):
        self._section(' Administrador del Sistema (public):')
        admin, _ = Usuario.objects.get_or_create(
            usuario='admin',
            defaults={
                'correo': 'admin@sipro.com',
                'nombres': 'Admin',
                'apellidos': 'SIPRO',
                'tipo_usuario': 'admin_sistema',
                'idempresa': None,
                'is_staff': True,
                'is_superuser': True,
            },
        )
        admin.set_password('admin1234')
        admin.save(update_fields=['password'])
        self._log('', 'Usuario', f'{admin.usuario} (Admin Sistema)')

    def _seed_empresa_con_tenant(self, emp_data, idx):
        empresa_num = idx + 1
        self._section(f' Empresa {empresa_num}: {emp_data["razonsocial"]}')

        empresa, _ = Empresa.objects.get_or_create(
            ruc=emp_data['ruc'],
            defaults={
                'razonsocial': emp_data['razonsocial'],
                'nombrecomercial': emp_data['nombrecomercial'],
                'correo': emp_data['correo'],
                'telefono': emp_data['telefono'],
                'direccion': emp_data['direccion'],
            },
        )
        self._log('', 'Empresa (public)', empresa.razonsocial)

        schema_name = TenantService.crear_schema_tenant(empresa.idempresa)
        TenantService.ejecutar_migraciones_tenant(schema_name)
        self._log('', 'Schema tenant creado', schema_name)

        from infrastructure.models.empresa_model import Empresa as EmpresaModel

        with tenant_schema(str(empresa.idempresa)):
            EmpresaModel.objects.get_or_create(
                idempresa=empresa.idempresa,
                defaults={
                    'razonsocial': emp_data['razonsocial'],
                    'nombrecomercial': emp_data['nombrecomercial'],
                    'correo': emp_data['correo'],
                    'telefono': emp_data['telefono'],
                    'direccion': emp_data['direccion'],
                },
            )

            admin_suffix = '' if idx == 0 else str(idx + 1)
            admin_usuario = f'admin{admin_suffix}'
            admin, _ = Usuario.objects.get_or_create(
                usuario=admin_usuario,
                defaults={
                    'correo': f'{admin_usuario}@sipro.com',
                    'nombres': 'Admin',
                    'apellidos': f'Empresa {empresa_num}',
                    'tipo_usuario': 'admin_empresa',
                    'idempresa': empresa,
                },
            )
            admin.set_password('admin1234')
            admin.save(update_fields=['password'])
            self._log('', 'Usuario (tenant)', f'{admin.usuario} (Admin Empresa)')

            self._seed_permisos_tenant()
            self._seed_roles_tenant(empresa, admin)

            sucursales, almacenes = self._seed_sucursales_almacenes(
                emp_data['sucursales'], empresa, empresa_num
            )

            self._seed_layout(sucursales[0], almacenes[0], idx)
            productos = self._seed_inventario()
            self._seed_kardex_tenant()
            self._seed_picking(almacenes[0], productos, idx)
            if len(almacenes) >= 2:
                self._seed_transferencias(almacenes[0], almacenes[1], idx, productos)

    def _seed_permisos_tenant(self):
        self._permisos_tenant = {}
        for codigo, nombre, descripcion in PERMISOS_TENANT:
            p, _ = Permiso.objects.get_or_create(
                codigo=codigo,
                defaults={'nombre': nombre, 'descripcion': descripcion},
            )
            self._permisos_tenant[codigo] = p

    def _seed_roles_tenant(self, empresa, admin):
        rol_admin, _ = self._safe_get_or_create(
            Rol,
            {'idempresa': empresa, 'nombre': 'Super Administrador'},
            {'descripcion': 'Acceso total al sistema'},
        )
        for permiso in self._permisos_tenant.values():
            RolPermiso.objects.get_or_create(idrol=rol_admin, idpermiso=permiso)
        UsuarioRol.objects.get_or_create(idusuario=admin, idrol=rol_admin)
        self._log('', 'Rol', f'{rol_admin.nombre} ({len(self._permisos_tenant)} permisos)')

        supervisor_codes = [
            k for k in self._permisos_tenant
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
            RolPermiso.objects.get_or_create(idrol=rol_supervisor, idpermiso=self._permisos_tenant[key])

        sup_suffix = '' if empresa.ruc == '20123456789' else str(EMPRESAS_DATA.index(next(e for e in EMPRESAS_DATA if e['ruc'] == empresa.ruc)) + 1)
        sup_usuario = f'supervisor{sup_suffix}'
        sup, _ = Usuario.objects.get_or_create(
            usuario=sup_usuario,
            defaults={
                'correo': f'{sup_usuario}@sipro.com',
                'nombres': f'Supervisor',
                'apellidos': 'Empresa',
                'idempresa': empresa,
                'tipo_usuario': 'admin_empresa',
            },
        )
        sup.set_password('demo1234')
        sup.save(update_fields=['password'])
        UsuarioRol.objects.get_or_create(idusuario=sup, idrol=rol_supervisor)
        self._log('', 'Rol', f'{rol_supervisor.nombre} ({len(supervisor_codes)} permisos)')
        self._log('', 'Usuario (tenant)', f'{sup_usuario} (Supervisor)')

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
            RolPermiso.objects.get_or_create(idrol=rol_operario, idpermiso=self._permisos_tenant[key])

        op_suffix = '' if empresa.ruc == '20123456789' else str(EMPRESAS_DATA.index(next(e for e in EMPRESAS_DATA if e['ruc'] == empresa.ruc)) + 1)
        op_usuario = f'operario{op_suffix}'
        op, _ = Usuario.objects.get_or_create(
            usuario=op_usuario,
            defaults={
                'correo': f'{op_usuario}@sipro.com',
                'nombres': f'Operario',
                'apellidos': 'Almacén',
                'idempresa': empresa,
                'tipo_usuario': 'operador',
            },
        )
        op.set_password('demo1234')
        op.save(update_fields=['password'])
        UsuarioRol.objects.get_or_create(idusuario=op, idrol=rol_operario)
        self._log('', 'Rol', f'{rol_operario.nombre} ({len(operario_codes)} permisos)')
        self._log('', 'Usuario (tenant)', f'{op_usuario} (Operario)')

        self._rol_admin = rol_admin
        self._rol_supervisor = rol_supervisor
        self._rol_operario = rol_operario
        self._admin = admin
        self._supervisor = sup
        self._operario = op

    def _seed_sucursales_almacenes(self, sucursales_data, empresa, empresa_num):
        sucursales = []
        for s in sucursales_data:
            suc, _ = Sucursal.objects.get_or_create(
                idempresa=empresa,
                codigo=s['codigo'],
                defaults={
                    'nombre': s['nombre'],
                    'direccion': s['direccion'],
                    'ancho_plano': s['ancho_plano'],
                    'alto_plano': s['alto_plano'],
                },
            )
            sucursales.append(suc)
            self._log('', 'Sucursal', f'{suc.nombre} ({suc.codigo})')

        almacenes = []
        for suc in sucursales:
            a, _ = Almacen.objects.get_or_create(
                idsucursal=suc,
                codigo=f'ALM{empresa_num}{suc.codigo[-3:]}',
                defaults={
                    'nombre': f'Almacén {suc.nombre}',
                    'descripcion': f'Almacén principal de {suc.nombre}',
                    'capacidadmaxima': 10000,
                },
            )
            almacenes.append(a)
            self._log('', 'Almacén', f'{a.nombre} ({a.codigo})')

        return sucursales, almacenes

    def _seed_layout(self, sucursal, almacen, idx):
        self._section(f'    Layout — {sucursal.nombre}')
        offset_x = idx * 50
        offset_y = idx * 30

        zona_recepcion, _ = Zona.objects.get_or_create(
            idsucursal=sucursal,
            codigo=f'Z-REC-E{idx+1}',
            defaults={
                'nombre': 'Recepción',
                'tipo': 'recepcion',
                'x': 0 + offset_x, 'y': 0 + offset_y,
                'poligono': {'type': 'polygon', 'points': [
                    {'x': 0, 'y': 0}, {'x': 400, 'y': 0},
                    {'x': 400, 'y': 200}, {'x': 200, 'y': 250}, {'x': 0, 'y': 200}
                ]},
                'color': '#4CAF50',
            },
        )
        zona_despacho, _ = Zona.objects.get_or_create(
            idsucursal=sucursal,
            codigo=f'Z-DESP-E{idx+1}',
            defaults={
                'nombre': 'Despacho',
                'tipo': 'despacho',
                'x': 0 + offset_x, 'y': 800 + offset_y,
                'poligono': {'type': 'polygon', 'points': [
                    {'x': 0, 'y': 800}, {'x': 300, 'y': 800},
                    {'x': 300, 'y': 950}, {'x': 150, 'y': 980}, {'x': 0, 'y': 950}
                ]},
                'color': '#F44336',
            },
        )
        self._log('', 'Zonas externas (sucursal)', 2)

        zona_alm_a, _ = Zona.objects.get_or_create(
            idalmacen=almacen,
            codigo=f'Z-ALMA-E{idx+1}',
            defaults={
                'nombre': 'Almacenamiento Alta Rotación',
                'tipo': 'almacenamiento',
                'x': 0 + offset_x, 'y': 280 + offset_y,
                'poligono': {'type': 'polygon', 'points': [
                    {'x': 0, 'y': 280}, {'x': 800, 'y': 280},
                    {'x': 800, 'y': 580}, {'x': 0, 'y': 580}
                ]},
                'color': '#2196F3',
            },
        )
        zona_alm_b, _ = Zona.objects.get_or_create(
            idalmacen=almacen,
            codigo=f'Z-ALMB-E{idx+1}',
            defaults={
                'nombre': 'Almacenamiento Baja Rotación',
                'tipo': 'almacenamiento',
                'x': 820 + offset_x, 'y': 280 + offset_y,
                'poligono': {'type': 'polygon', 'points': [
                    {'x': 820, 'y': 280}, {'x': 1400, 'y': 280},
                    {'x': 1400, 'y': 580}, {'x': 820, 'y': 580}
                ]},
                'color': '#9C27B0',
            },
        )
        zona_picking, _ = Zona.objects.get_or_create(
            idalmacen=almacen,
            codigo=f'Z-PICK-E{idx+1}',
            defaults={
                'nombre': 'Picking',
                'tipo': 'picking',
                'x': 0 + offset_x, 'y': 600 + offset_y,
                'poligono': {'type': 'polygon', 'points': [
                    {'x': 0, 'y': 600}, {'x': 800, 'y': 600},
                    {'x': 800, 'y': 780}, {'x': 0, 'y': 780}
                ]},
                'color': '#FF9800',
            },
        )
        self._log('', 'Zonas internas (almacén)', 3)

        estantes = []
        for codigo, nombre, zona, x, y, rot in [
            ('E01', 'Estante A1', zona_alm_a, 50, 50, 0),
            ('E02', 'Estante A2', zona_alm_a, 200, 50, 0),
            ('E03', 'Estante A3', zona_alm_a, 350, 50, 0),
            ('E04', 'Estante A4', zona_alm_a, 500, 50, 0),
            ('E05', 'Estante B1', zona_alm_b, 50, 50, 15),
            ('E06', 'Estante B2', zona_alm_b, 200, 50, 15),
            ('E07', 'Estante B3', zona_alm_b, 350, 50, 15),
            ('E08', 'Estante B4', zona_alm_b, 500, 50, 15),
        ]:
            e, _ = Estante.objects.get_or_create(
                idzona=zona,
                codigo=f'{codigo}-E{idx+1}',
                defaults={
                    'nombre': nombre, 'x': x, 'y': y, 'rotacion': rot,
                    'ancho': 240, 'alto': 120, 'profundidad': 60, 'cantidadniveles': 3,
                },
            )
            estantes.append(e)
        self._log('', 'Estantes', len(estantes))

        niveles = []
        for estante in estantes:
            for k in range(1, 4):
                n, _ = Nivel.objects.get_or_create(
                    idestante=estante, numero=k,
                    defaults={'nombre': f'Nivel {k} — {estante.codigo}', 'altura': 40},
                )
                niveles.append(n)
        self._log('', 'Niveles', len(niveles))

        ubicaciones = []
        for nivel in niveles:
            for m in range(1, 3):
                u, _ = Ubicacion.objects.get_or_create(
                    codigo=f'{nivel.idestante.codigo}-N{nivel.numero}-U{m}',
                    defaults={
                        'idnivel': nivel, 'capacidadpeso': 500,
                        'capacidadvolumen': Decimal('1.50'), 'x': (m - 1) * 60, 'y': 0,
                    },
                )
                ubicaciones.append(u)
        self._log('', 'Ubicaciones', len(ubicaciones))
        self._ubicaciones = ubicaciones

        bx, by = offset_x, offset_y
        nodos_ext = []
        for nombre, tipo, cx, cy in [
            ('N-Puerta-Principal', 'entrada', bx + 50, by + 50),
            ('N-Puerta-Recepcion', 'esquina', bx + 180, by + 220),
            ('N-Puerta-Despacho', 'esquina', bx + 100, by + 880),
            ('N-Salida-Exterior', 'salida', bx + 80, by + 960),
        ]:
            n, _ = self._safe_get_or_create(
                Nodo,
                {'idsucursal': sucursal, 'nombre': f'{nombre}-E{idx+1}'},
                {'tipo': tipo, 'coordenada_x': cx, 'coordenada_y': cy},
            )
            nodos_ext.append(n)
        self._log('', 'Nodos externos (sucursal)', len(nodos_ext))

        nodos_int = []
        for nombre, tipo, cx, cy, ubic in [
            ('N-Entrada-Almacen', 'entrada', bx + 20, by + 295, None),
            ('N-Int-Central', 'interseccion', bx + 200, by + 300, None),
            ('N-Pick-A1', 'punto_recogida', bx + 80, by + 330, ubicaciones[0] if ubicaciones else None),
            ('N-Pick-A2', 'punto_recogida', bx + 230, by + 330, ubicaciones[6] if len(ubicaciones) > 6 else None),
            ('N-Pick-B1', 'punto_recogida', bx + 870, by + 330, ubicaciones[24] if len(ubicaciones) > 24 else None),
            ('N-Pick-B2', 'punto_recogida', bx + 1020, by + 330, ubicaciones[30] if len(ubicaciones) > 30 else None),
        ]:
            n, _ = self._safe_get_or_create(
                Nodo,
                {'idalmacen': almacen, 'nombre': f'{nombre}-E{idx+1}'},
                {'tipo': tipo, 'coordenada_x': cx, 'coordenada_y': cy, 'idubicacion': ubic},
            )
            nodos_int.append(n)
        self._log('', 'Nodos internos (almacén)', len(nodos_int))

        all_nodos = nodos_ext + nodos_int
        conexiones_data = [
            (0, 1, 200, 400, 'acceso'),
            (0, 2, 850, 400, 'acceso'),
            (2, 3, 100, 350, 'acceso'),
            (1, 4, 80, 350, 'acceso'),
            (4, 5, 180, 350, 'pasillo'),
            (5, 6, 130, 350, 'pasillo'),
            (5, 7, 280, 350, 'pasillo'),
            (5, 8, 700, 300, 'cruce'),
            (5, 9, 850, 300, 'cruce'),
            (6, 7, 150, 250, 'pasillo'),
            (8, 9, 150, 250, 'pasillo'),
        ]
        for oi, di, dist, ancho, tipo in conexiones_data:
            Conexion.objects.get_or_create(
                idnodoorigen=all_nodos[oi], idnododestino=all_nodos[di],
                defaults={'distancia': dist, 'ancho': ancho, 'tipo': tipo, 'geometria': {'type': 'line'}},
            )
            Conexion.objects.get_or_create(
                idnododestino=all_nodos[oi], idnodoorigen=all_nodos[di],
                defaults={'distancia': dist, 'ancho': ancho, 'tipo': tipo, 'geometria': {'type': 'line'}},
            )
        self._log('', 'Conexiones', len(conexiones_data) * 2)

    def _seed_kardex_tenant(self):
        inventarios = Inventario.objects.select_related('idproducto', 'idubicacion', 'idlote').all()
        count = 0
        for inv in inventarios:
            Kardex.objects.get_or_create(
                idproducto=inv.idproducto,
                idubicacion=inv.idubicacion,
                idlote=inv.idlote,
                tipo_movimiento='entrada_inicial',
                defaults={
                    'cantidad': inv.cantidad,
                    'saldo_anterior': 0,
                    'saldo_nuevo': inv.cantidad,
                    'referencia': 'Carga inicial de inventario',
                    'idusuario': None,
                    'fecha_movimiento': self._today - timedelta(days=30),
                },
            )
            count += 1
        self._log('', 'Kardex (entradas iniciales)', count)

    def _seed_inventario(self):
        self._section('   Inventario')
        categorias = {}
        for nombre, desc in CATEGORIAS_DATA:
            c, _ = self._safe_get_or_create(Categoria, {'nombre': nombre}, {'descripcion': desc})
            categorias[nombre] = c

        productos = {}
        for codigo, nombre, cat_name, desc, udm, peso, vol, pc, pv, lotes in PRODUCTOS_DATA:
            p, _ = Producto.objects.get_or_create(
                codigo=codigo,
                defaults={
                    'idcategoria': categorias[cat_name],
                    'nombre': nombre,
                    'descripcion': desc,
                    'unidad_medida': udm,
                    'peso': peso,
                    'volumen': vol,
                    'precio_costo': pc,
                    'precio_venta': pv,
                    'stock_minimo': 10,
                    'stock_maximo': 500,
                    'maneja_lotes': lotes,
                },
            )
            productos[codigo] = p
        self._log('', 'Productos', len(productos))

        today = date.today()
        lotes_data = [
            ('SKU-001', 'LOT-HP-2026-001', -30, 1095, 50, 45),
            ('SKU-006', 'LOT-ARROZ-2026-01', -15, 180, 500, 480),
            ('SKU-006', 'LOT-ARROZ-2026-02', -5, 200, 300, 300),
            ('SKU-007', 'LOT-ACEITE-2026-01', -20, 365, 200, 180),
            ('SKU-007', 'LOT-ACEITE-2026-02', -2, 365, 150, 150),
            ('SKU-008', 'LOT-LECHE-2026-01', -10, 90, 400, 350),
            ('SKU-009', 'LOT-AZUCAR-2026-01', -25, 365, 600, 550),
            ('SKU-010', 'LOT-FIDEOS-2026-01', -12, 270, 350, 320),
            ('SKU-018', 'LOT-AGUA-2026-01', -8, 180, 500, 480),
            ('SKU-019', 'LOT-GASEOSA-2026-01', -15, 240, 300, 280),
        ]
        lotes = []
        for sku, num_lote, fp_delta, fv_delta, ci, ca in lotes_data:
            if sku in productos:
                l, _ = Lote.objects.get_or_create(
                    idproducto=productos[sku],
                    numero_lote=num_lote,
                    defaults={
                        'fecha_produccion': today + timedelta(days=fp_delta),
                        'fecha_vencimiento': today + timedelta(days=fv_delta),
                        'cantidad_inicial': ci,
                        'cantidad_actual': ca,
                    },
                )
                lotes.append(l)
        self._log('', 'Lotes', len(lotes))

        ubicaciones = getattr(self, '_ubicaciones', [])
        if not ubicaciones:
            self._log('', 'Inventario', 'sin ubicaciones — saltado')
            return productos

        inv_pairs = list(zip(
            ['SKU-001', 'SKU-001', 'SKU-006', 'SKU-006', 'SKU-007',
             'SKU-008', 'SKU-009', 'SKU-010', 'SKU-011', 'SKU-013',
             'SKU-013', 'SKU-015', 'SKU-016', 'SKU-018', 'SKU-020',
             'SKU-021'],
            [0, 0, 1, 2, 3, 5, 6, 7, None, None, None, None, None, 8, None, None],
            range(min(16, len(ubicaciones))),
            [5, 10, 100, 200, 80, 150, 250, 100, 50, 200, 100, 150, 120, 300, 30, 15],
        ))
        for sku, lote_idx, ubic_idx, cant in inv_pairs:
            if sku in productos and ubic_idx < len(ubicaciones):
                lote = lotes[lote_idx] if lote_idx is not None and lote_idx < len(lotes) else None
                Inventario.objects.get_or_create(
                    idproducto=productos[sku],
                    idubicacion=ubicaciones[ubic_idx],
                    idlote=lote,
                    defaults={'cantidad': cant},
                )
        self._log('', 'Inventario', len(inv_pairs))
        return productos

    def _seed_picking(self, almacen, productos, idx):
        self._section(f'   Picking — Empresa {idx+1}')
        ubicaciones = getattr(self, '_ubicaciones', [])
        if not ubicaciones:
            return

        for pick_num in range(1, 5):
            estado_map = {1: 'pendiente', 2: 'en_proceso', 3: 'completado', 4: 'cancelado'}
            op, _ = OrdenPicking.objects.get_or_create(
                numero_orden=f'PICK-{2026+idx}-{pick_num:03d}',
                defaults={
                    'idalmacen': almacen,
                    'idusuario': self._operario,
                    'estado_orden': estado_map[pick_num],
                    'prioridad': pick_num,
                },
            )
            for det_idx, sku in enumerate(['SKU-006', 'SKU-011', 'SKU-013']):
                if sku in productos and det_idx < len(ubicaciones):
                    self._safe_get_or_create(
                        DetallePicking,
                        {'idorden': op, 'idproducto': productos[sku]},
                        {
                            'idubicacion': ubicaciones[det_idx],
                            'cantidad_solicitada': 10 * (det_idx + 1),
                            'cantidad_pickeada': 10 * (det_idx + 1) if pick_num >= 3 else 0,
                            'estado_detalle': 'completado' if pick_num >= 3 else estado_map[pick_num],
                        },
                    )
            self._log('', 'Orden', f'{op.numero_orden} ({estado_map[pick_num]})')

            if pick_num == 2:
                detalle = DetallePicking.objects.filter(idorden=op).first()
                if detalle:
                    Incidencia.objects.get_or_create(
                        iddetalle=detalle,
                        defaults={
                            'idusuario': self._supervisor,
                            'tipo': 'producto_danado',
                            'descripcion': f'Producto {detalle.idproducto.nombre} llegó con empaque dañado durante el picking.',
                            'resuelta': False,
                        },
                    )
                    self._log('', 'Incidencia', 'Producto dañado reportado')

    def _seed_transferencias(self, origen, destino, idx, productos):
        self._section(f'   Transferencias — Empresa {idx+1}')
        for trf_num in range(1, 3):
            estado = 'pendiente' if trf_num == 1 else 'en_transito'
            t, _ = Transferencia.objects.get_or_create(
                numero_transferencia=f'TRF-{2026+idx}-{trf_num:03d}',
                defaults={
                    'idalmacen_origen': origen,
                    'idalmacen_destino': destino,
                    'idusuario': self._supervisor,
                    'estado_transferencia': estado,
                    'fecha_envio': timezone.now() - timedelta(hours=4) if trf_num == 2 else None,
                },
            )
            self._log('', 'Transferencia', f'{t.numero_transferencia} ({estado})')

            det_skus = ['SKU-006', 'SKU-015', 'SKU-018'] if trf_num == 1 else ['SKU-011', 'SKU-013']
            for d_idx, sku in enumerate(det_skus):
                if sku in productos:
                    DetalleTransferencia.objects.get_or_create(
                        idtransferencia=t,
                        idproducto=productos[sku],
                        defaults={'cantidad': 25 * (d_idx + 1)},
                    )
            self._log('', 'Detalles Transferencia', len(det_skus))

    def _safe_get_or_create(self, model, lookup, defaults):
        existing = model.objects.filter(**lookup).first()
        if existing:
            return existing, False
        return model.objects.create(**{**lookup, **defaults}), True

    def _print_summary(self):
        self.stdout.write('')
        self.stdout.write('=' * 60)
        self.stdout.write('  RESUMEN DE CARGA')
        self.stdout.write('=' * 60)

        self.stdout.write(f'  Portal (public):')
        self.stdout.write(f'    Empresas: {Empresa.objects.count()}')
        self.stdout.write(f'    Usuarios: {Usuario.objects.filter(tipo_usuario="admin_sistema").count()}')
        self.stdout.write(f'    Permisos: {Permiso.objects.count()}')

        for empresa in Empresa.objects.all():
            with tenant_schema(str(empresa.idempresa)):
                self.stdout.write(f'  Tenant {empresa.razonsocial}:')
                self.stdout.write(f'    Usuarios: {Usuario.objects.count()}')
                self.stdout.write(f'    Roles: {Rol.objects.count()}')
                self.stdout.write(f'    Permisos: {Permiso.objects.count()}')
                self.stdout.write(f'    Sucursales: {Sucursal.objects.count()}')
                self.stdout.write(f'    Almacenes: {Almacen.objects.count()}')
                self.stdout.write(f'    Productos: {Producto.objects.count()}')
                self.stdout.write(f'    Kardex: {Kardex.objects.count()}')

        self.stdout.write('')
        self.stdout.write('   Credenciales de acceso:')
        self.stdout.write('  ')
        self.stdout.write('  admin / admin1234 (Super Admin - Portal)')
        for i in range(len(EMPRESAS_DATA)):
            suffix = '' if i == 0 else str(i + 1)
            self.stdout.write(f'  admin{suffix} / admin1234 (Admin Empresa {i+1})')
            self.stdout.write(f'  supervisor{suffix} / demo1234 (Supervisor Empresa {i+1})')
            self.stdout.write(f'  operario{suffix} / demo1234 (Operario Empresa {i+1})')
        self.stdout.write('')
        self.stdout.write('=' * 60)
