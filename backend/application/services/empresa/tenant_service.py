import uuid
import os
import django
from django.conf import settings
from django.db import connection
from infrastructure.repositories.empresa_repo import EmpresaRepository

empresa_repo = EmpresaRepository()


class TenantService:
    @staticmethod
    def crear_schema_tenant(idempresa: uuid.UUID):
        schema_name = f"empresa_{idempresa}".replace('-', '_')
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE SCHEMA IF NOT EXISTS \"{schema_name}\"")
        return schema_name

    @staticmethod
    def ejecutar_migraciones_tenant(schema_name: str):
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                AND table_name NOT LIKE 'django_%'
                AND table_name NOT LIKE 'auth_%'
                AND table_name NOT LIKE 'token_%'
            """)
            tables = [row[0] for row in cursor.fetchall()]
            
            for table in tables:
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS "{schema_name}"."{table}" 
                    (LIKE "public"."{table}" INCLUDING ALL)
                """)

    @staticmethod
    def seed_tenant_data(schema_name: str, empresa, admin):
        from infrastructure.models.seguridad_model import Permiso, Rol, RolPermiso, UsuarioRol
        with connection.cursor() as cursor:
            cursor.execute("SHOW search_path")
            original_search_path = cursor.fetchone()[0]
        try:
            with connection.cursor() as cursor:
                cursor.execute(f"SET search_path TO \"{schema_name}\", public")

            PERMISOS_DATA = [
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

            permisos_map = {}
            for codigo, nombre, descripcion in PERMISOS_DATA:
                p, _ = Permiso.objects.get_or_create(
                    codigo=codigo,
                    defaults={'nombre': nombre, 'descripcion': descripcion},
                )
                permisos_map[codigo] = p

            rol_super_admin, _ = Rol.objects.get_or_create(
                idempresa=empresa,
                nombre='Super Administrador',
                defaults={'descripcion': 'Acceso total al sistema'},
            )
            for permiso in permisos_map.values():
                RolPermiso.objects.get_or_create(idrol=rol_super_admin, idpermiso=permiso)

            supervisor_codes = [
                k for k in permisos_map
                if k.startswith('ver_') or k in (
                    'gestionar_picking', 'gestionar_inventario',
                    'gestionar_transferencia', 'gestionar_layout',
                )
            ]
            rol_supervisor, _ = Rol.objects.get_or_create(
                idempresa=empresa,
                nombre='Supervisor',
                defaults={'descripcion': 'Supervisa operaciones de almacén'},
            )
            for key in supervisor_codes:
                RolPermiso.objects.get_or_create(idrol=rol_supervisor, idpermiso=permisos_map[key])

            operario_codes = [
                'ver_dashboard', 'ver_inventario', 'ver_picking',
                'gestionar_picking', 'registrar_kardex',
            ]
            rol_operario, _ = Rol.objects.get_or_create(
                idempresa=empresa,
                nombre='Operario',
                defaults={'descripcion': 'Operario de almacén'},
            )
            for key in operario_codes:
                RolPermiso.objects.get_or_create(idrol=rol_operario, idpermiso=permisos_map[key])

            UsuarioRol.objects.get_or_create(idusuario=admin, idrol=rol_super_admin)

        finally:
            with connection.cursor() as cursor:
                cursor.execute(f"SET search_path TO {original_search_path}")
