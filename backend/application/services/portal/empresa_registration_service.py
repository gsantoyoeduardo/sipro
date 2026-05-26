import uuid
from django.db import transaction
from infrastructure.repositories.empresa_repo import EmpresaRepository
from application.services.empresa.tenant_service import TenantService
from infrastructure.utils.tenant_schema import tenant_schema

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

        usuario_data = {
            'idempresa': empresa,
            'nombres': data.get('nombres', 'Administrador'),
            'apellidos': data.get('apellidos', ''),
            'correo': data.get('usuario_correo', data['correo']),
            'usuario': data.get('usuario', f"admin_{empresa.ruc}"),
            'password': data['password'],
            'tipo_usuario': 'admin_empresa',
        }

        from infrastructure.models.empresa_model import Empresa as EmpresaModel
        from infrastructure.models.seguridad_model import Usuario

        with tenant_schema(str(empresa.idempresa)):
            empresa_tenant, _ = EmpresaModel.objects.get_or_create(
                idempresa=empresa.idempresa,
                defaults=empresa_data,
            )

            admin, created = Usuario.objects.get_or_create(
                usuario=usuario_data['usuario'],
                defaults={
                    'idempresa': empresa_tenant,
                    'nombres': usuario_data['nombres'],
                    'apellidos': usuario_data['apellidos'],
                    'correo': usuario_data['correo'],
                    'tipo_usuario': usuario_data['tipo_usuario'],
                },
            )
            if created:
                admin.set_password(usuario_data['password'])
                admin.save()

            TenantService.seed_tenant_data(schema_name, empresa_tenant, admin)

        from application.dto.empresa.empresa_dto import EmpresaSerializer
        return {
            'empresa': EmpresaSerializer(empresa).data,
            'admin': {
                'idusuario': str(admin.idusuario),
                'usuario': admin.usuario,
                'nombres': admin.nombres,
                'apellidos': admin.apellidos,
                'correo': admin.correo,
            },
            'schema': schema_name,
        }
