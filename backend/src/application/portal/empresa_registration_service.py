"""Servicio de registro de empresas (proceso de onboarding).

Orquesta el flujo completo de alta de una nueva empresa en el sistema:
- Crea el registro de la empresa en el esquema público.
- Genera un esquema PostgreSQL aislado (tenant) para la empresa.
- Ejecuta migraciones y siembra datos iniciales en ese esquema.
- Crea el usuario administrador de la empresa.
"""

import uuid
from src.application.empresa.empresa_service import EmpresaService
from src.application.empresa.tenant_service import TenantService
from src.infrastructure.middleware.tenant_middleware import set_tenant_schema, reset_tenant_schema


class EmpresaRegistrationService:
    """Orquestador del registro completo de una nueva empresa (multi-tenant)."""

    @staticmethod
    def registrar_empresa(data: dict) -> dict:
        """Registra una nueva empresa con su infraestructura multi-tenant.

        Fases:
        1. Extrae los datos de la empresa y del usuario administrador.
        2. Crea el registro de la empresa en el esquema ``public``.
        3. Crea un esquema PostgreSQL aislado para el tenant.
        4. Ejecuta las migraciones sobre el nuevo esquema.
        5. Activa el esquema del tenant (``set_tenant_schema``).
        6. Siembra datos iniciales (permisos, roles, sucursal, almacén).
        7. Crea el usuario administrador con rol Administrador.
        8. Restaura el esquema original (``reset_tenant_schema``).

        Args:
            data: Diccionario con datos de la empresa y del admin.

        Returns:
            dict: Empresa creada, datos del admin y nombre del esquema.
        """
        razonsocial = data.get('razonsocial')
        nombrecomercial = data.get('nombrecomercial', '')
        ruc = data.get('ruc')
        correo = data.get('correo')
        telefono = data.get('telefono', '')
        direccion = data.get('direccion', '')

        admin_usuario = data.get('admin_usuario')
        admin_nombres = data.get('admin_nombres')
        admin_apellidos = data.get('admin_apellidos', '')
        admin_correo = data.get('admin_correo')
        admin_password = data.get('admin_password')

        # Fase 1: Crear empresa en esquema público
        empresa = EmpresaService.crear({
            'razonsocial': razonsocial,
            'nombrecomercial': nombrecomercial,
            'ruc': ruc,
            'correo': correo,
            'telefono': telefono or None,
            'direccion': direccion or None,
        })

        # Fase 2: Crear y migrar esquema del tenant
        schema_name = TenantService.create_schema(empresa.idempresa)
        TenantService.migrate_schema(schema_name)

        # Fase 3: Poblar el tenant y crear admin
        set_tenant_schema(schema_name)
        try:
            TenantService.seed_tenant(empresa.idempresa)

            from src.infrastructure.models.seguridad_model import Usuario, Rol, UsuarioRol

            admin = Usuario.objects.create(
                nombres=admin_nombres,
                apellidos=admin_apellidos,
                correo=admin_correo,
                usuario=admin_usuario,
                idempresa=empresa,
                tipo_usuario='admin_empresa',
                is_staff=True,
                is_active=True,
                estado=True,
            )
            admin.set_password(admin_password)
            admin.save()

            admin_rol = Rol.objects.filter(nombre='Administrador').first()
            if admin_rol:
                UsuarioRol.objects.create(idusuario=admin, idrol=admin_rol)

            from src.infrastructure.serializers.seguridad_serializer import UsuarioSerializer
            admin_data = UsuarioSerializer(admin).data
        finally:
            reset_tenant_schema()

        from src.infrastructure.serializers.empresa_serializer import EmpresaSerializer

        return {
            'empresa': EmpresaSerializer(empresa).data,
            'admin': admin_data,
            'schema': schema_name,
        }

    @staticmethod
    def obtener_detalle_empresa(idempresa: uuid.UUID) -> dict:
        """Retorna el detalle de una empresa junto con los datos de su admin.

        Args:
            idempresa: UUID de la empresa.

        Returns:
            dict: Datos de la empresa y del usuario administrador.
        """
        from src.infrastructure.models.empresa_model import Empresa
        from src.infrastructure.models.seguridad_model import Usuario
        from src.infrastructure.serializers.empresa_serializer import EmpresaSerializer

        empresa = Empresa.objects.get(pk=idempresa)
        serializer = EmpresaSerializer(empresa)

        admin_usuario = Usuario.objects.filter(
            idempresa=empresa, tipo_usuario='admin_empresa'
        ).first()

        return {
            'empresa': serializer.data,
            'admin_usuario': {
                'idusuario': str(admin_usuario.idusuario),
                'usuario': admin_usuario.usuario,
                'nombres': admin_usuario.nombres,
                'apellidos': admin_usuario.apellidos,
                'correo': admin_usuario.correo,
            } if admin_usuario else None,
        }

    @staticmethod
    def obtener_stats() -> dict:
        """Retorna estadísticas globales del portal de empresas.

        Returns:
            dict: Totales de empresas, usuarios, activas e inactivas.
        """
        from src.infrastructure.models.empresa_model import Empresa
        from src.infrastructure.models.seguridad_model import Usuario

        return {
            'total_empresas': Empresa.objects.count(),
            'total_usuarios': Usuario.objects.filter(idempresa__isnull=False).count(),
            'empresas_activas': Empresa.objects.filter(estado=True).count(),
            'empresas_inactivas': Empresa.objects.filter(estado=False).count(),
        }
