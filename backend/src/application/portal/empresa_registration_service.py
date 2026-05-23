import uuid
from src.application.empresa.empresa_service import EmpresaService
from src.application.empresa.tenant_service import TenantService
from src.infrastructure.middleware.tenant_middleware import set_tenant_schema, reset_tenant_schema


class EmpresaRegistrationService:

    @staticmethod
    def registrar_empresa(data: dict) -> dict:
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

        empresa = EmpresaService.crear({
            'razonsocial': razonsocial,
            'nombrecomercial': nombrecomercial,
            'ruc': ruc,
            'correo': correo,
            'telefono': telefono or None,
            'direccion': direccion or None,
        })

        schema_name = TenantService.create_schema(empresa.idempresa)
        TenantService.migrate_schema(schema_name)

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
        from src.infrastructure.models.empresa_model import Empresa
        from src.infrastructure.models.seguridad_model import Usuario

        return {
            'total_empresas': Empresa.objects.count(),
            'total_usuarios': Usuario.objects.filter(idempresa__isnull=False).count(),
            'empresas_activas': Empresa.objects.filter(estado=True).count(),
            'empresas_inactivas': Empresa.objects.filter(estado=False).count(),
        }
