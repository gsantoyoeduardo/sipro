import uuid
from django.db import connection
from django.core.management import call_command


class TenantService:
    @staticmethod
    def create_schema(empresa_id: uuid.UUID):
        schema_name = f"empresa_{empresa_id}"
        with connection.cursor() as cursor:
            cursor.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"')
        return schema_name

    @staticmethod
    def migrate_schema(schema_name: str):
        with connection.cursor() as cursor:
            cursor.execute(f'SET search_path = "{schema_name}", public')
            call_command('migrate', verbosity=0)
            cursor.execute('SET search_path = public')

    @staticmethod
    def seed_tenant(empresa_id: uuid.UUID):
        from src.infrastructure.models.seguridad_model import Rol, Permiso, UsuarioRol
        from src.infrastructure.models.empresa_model import Sucursal, Almacen

        permisos_data = [
            ('ver_dashboard', 'Ver Dashboard'),
            ('ver_empresas', 'Ver Empresas'),
            ('crear_empresas', 'Crear Empresas'),
            ('editar_empresas', 'Editar Empresas'),
            ('eliminar_empresas', 'Eliminar Empresas'),
            ('ver_sucursales', 'Ver Sucursales'),
            ('crear_sucursales', 'Crear Sucursales'),
            ('editar_sucursales', 'Editar Sucursales'),
            ('eliminar_sucursales', 'Eliminar Sucursales'),
            ('ver_almacenes', 'Ver Almacenes'),
            ('crear_almacenes', 'Crear Almacenes'),
            ('editar_almacenes', 'Editar Almacenes'),
            ('eliminar_almacenes', 'Eliminar Almacenes'),
            ('ver_usuarios', 'Ver Usuarios'),
            ('crear_usuarios', 'Crear Usuarios'),
            ('editar_usuarios', 'Editar Usuarios'),
            ('eliminar_usuarios', 'Eliminar Usuarios'),
            ('ver_roles', 'Ver Roles'),
            ('crear_roles', 'Crear Roles'),
            ('editar_roles', 'Editar Roles'),
            ('eliminar_roles', 'Eliminar Roles'),
            ('ver_layout', 'Ver Layout'),
            ('ver_inventario', 'Ver Inventario'),
            ('ver_picking', 'Ver Picking'),
            ('ver_transferencias', 'Ver Transferencias'),
        ]

        permisos = {}
        for codigo, nombre in permisos_data:
            p, _ = Permiso.objects.get_or_create(codigo=codigo, defaults={'nombre': nombre, 'descripcion': nombre})
            permisos[codigo] = p

        admin_rol, _ = Rol.objects.get_or_create(
            idempresa_id=empresa_id,
            nombre='Administrador',
            defaults={'descripcion': 'Administrador del sistema'},
        )
        for p in permisos.values():
            RolPermiso, _ = admin_rol.rolpermiso_set.get_or_create(idpermiso=p)

        supervisor_rol, _ = Rol.objects.get_or_create(
            idempresa_id=empresa_id,
            nombre='Supervisor',
            defaults={'descripcion': 'Supervisor de operaciones'},
        )
        for codigo in ['ver_dashboard', 'ver_sucursales', 'ver_almacenes', 'ver_usuarios',
                       'ver_layout', 'ver_inventario', 'ver_picking', 'ver_transferencias']:
            if codigo in permisos:
                supervisor_rol.rolpermiso_set.get_or_create(idpermiso=permisos[codigo])

        operario_rol, _ = Rol.objects.get_or_create(
            idempresa_id=empresa_id,
            nombre='Operario',
            defaults={'descripcion': 'Operario de almacén'},
        )
        for codigo in ['ver_dashboard', 'ver_inventario', 'ver_picking', 'ver_layout']:
            if codigo in permisos:
                operario_rol.rolpermiso_set.get_or_create(idpermiso=permisos[codigo])

        sucursal, _ = Sucursal.objects.get_or_create(
            idempresa_id=empresa_id,
            codigo='SUC001',
            defaults={'nombre': 'Sucursal Principal', 'direccion': ''},
        )

        Almacen.objects.get_or_create(
            idsucursal=sucursal,
            codigo='ALM001',
            defaults={
                'nombre': 'Almacén Principal',
                'descripcion': 'Almacén principal de la sucursal',
                'ancho': 500,
                'alto': 300,
                'capacidadmaxima': 10000,
            },
        )
