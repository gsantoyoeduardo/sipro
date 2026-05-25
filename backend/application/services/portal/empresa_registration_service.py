import uuid
from django.db import transaction
from infrastructure.repositories.empresa_repo import EmpresaRepository
from application.services.seguridad.auth_service import AuthService
from application.services.empresa.tenant_service import TenantService

empresa_repo = EmpresaRepository()


class EmpresaRegistrationService:
    @staticmethod
    @transaction.atomic
    def registrar_empresa(data: dict):
        empresa_data = {
            'razonsocial': data['razonsocial'],
            'nombrecomercial': data.get('nombrecomercial', data['razonsocial']),
            'ruc': data['ruc'],
            'correo': data['correo'],
            'telefono': data.get('telefono', ''),
            'direccion': data.get('direccion', ''),
        }
        empresa = empresa_repo.create(empresa_data)

        schema_name = TenantService.crear_schema_tenant(empresa.idempresa)
        TenantService.ejecutar_migraciones_tenant(schema_name)
        TenantService.seed_datos_tenant(schema_name, empresa)

        usuario_data = {
            'idempresa': empresa,
            'nombres': data.get('nombres', 'Administrador'),
            'apellidos': data.get('apellidos', ''),
            'correo': data.get('usuario_correo', data['correo']),
            'usuario': data.get('usuario', f"admin_{empresa.ruc}"),
            'password': data['password'],
            'tipo_usuario': 'admin_empresa',
        }
        from infrastructure.models.seguridad_model import Usuario
        from infrastructure.repositories.seguridad_repo import UsuarioRepository
        usuario_repo = UsuarioRepository()
        usuario_repo.create(usuario_data)

        return empresa
