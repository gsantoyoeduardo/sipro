from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiExample
from application.dto.portal.registro_dto import CrearEmpresaSerializer
from application.services.portal.empresa_registration_service import EmpresaRegistrationService
from infrastructure.models.empresa_model import Empresa


@extend_schema(
    request=CrearEmpresaSerializer,
    responses={201: None, 400: None},
    description="Crea una nueva empresa con su administrador y schema de base de datos.",
    examples=[
        OpenApiExample('Registro completo', value={
            'razonsocial': 'Nueva Empresa S.A.C.', 'nombrecomercial': 'Nueva Empresa', 'ruc': '20123456789',
            'correo': 'contacto@nuevaempresa.pe', 'telefono': '01-555-0000', 'direccion': 'Av. Empresarial 456',
            'admin_usuario': 'admin_nuevo', 'admin_nombres': 'Admin Nuevo',
            'admin_correo': 'admin@nuevaempresa.pe', 'admin_password': 'segura123',
        }, request_only=True),
        OpenApiExample('Faltan campos requeridos', value={'razonsocial': 'Incompleta'}, request_only=True),
    ],
)
@api_view(['POST'])
@permission_classes([IsAdminUser])
def crear_empresa(request):
    data = request.data
    errors = {}
    if not data.get('razonsocial'):
        errors['razonsocial'] = 'La razón social es obligatoria'
    if not data.get('ruc'):
        errors['ruc'] = 'El RUC es obligatorio'
    if not data.get('correo'):
        errors['correo'] = 'El correo empresarial es obligatorio'
    if not data.get('password'):
        errors['password'] = 'La contraseña del administrador es obligatoria'
    elif len(data['password']) < 8:
        errors['password'] = 'La contraseña debe tener al menos 8 caracteres'

    if errors:
        return Response({'error': 'Datos inválidos', 'fields': errors}, status=status.HTTP_400_BAD_REQUEST)

    result = EmpresaRegistrationService.registrar_empresa(data)
    return Response({
        'mensaje': 'Empresa creada exitosamente',
        'empresa': result['empresa'],
        'admin': result['admin'],
        'schema': result['schema'],
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_stats(request):
    from infrastructure.repositories.empresa_repo import EmpresaRepository
    empresa_repo = EmpresaRepository()
    return Response({
        'total_empresas': empresa_repo.get_all().count(),
        'activas': empresa_repo.get_all().filter(estado=True).count(),
    })


@extend_schema(
    request=None,
    responses={200: None},
    description="Activa o desactiva una empresa. No requiere cuerpo, solo el ID de la empresa en la URL.",
)
@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def toggle_empresa_estado(request, idempresa):
    empresa = Empresa.objects.get(pk=idempresa)
    empresa.estado = not empresa.estado
    empresa.save(update_fields=['estado'])
    return Response({'estado': empresa.estado})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_empresa_detalle(request, idempresa):
    from infrastructure.models.seguridad_model import Usuario
    empresa = Empresa.objects.get(pk=idempresa)
    from application.dto.empresa.empresa_dto import EmpresaSerializer
    total_usuarios = Usuario.objects.filter(idempresa_id=idempresa).count()
    admin = Usuario.objects.filter(idempresa_id=idempresa, tipo_usuario='admin_empresa').first()
    return Response({
        'empresa': EmpresaSerializer(empresa).data,
        'total_usuarios': total_usuarios,
        'admin_usuario': admin.usuario if admin else None,
    })

