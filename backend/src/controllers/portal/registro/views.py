from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from src.application.portal.empresa_registration_service import EmpresaRegistrationService
from src.infrastructure.models.empresa_model import Empresa


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
    if not data.get('admin_usuario'):
        errors['admin_usuario'] = 'El usuario administrador es obligatorio'
    if not data.get('admin_nombres'):
        errors['admin_nombres'] = 'Los nombres del administrador son obligatorios'
    if not data.get('admin_correo'):
        errors['admin_correo'] = 'El correo del administrador es obligatorio'
    if not data.get('admin_password'):
        errors['admin_password'] = 'La contraseña es obligatoria'
    elif len(data['admin_password']) < 6:
        errors['admin_password'] = 'La contraseña debe tener al menos 6 caracteres'

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
    stats = EmpresaRegistrationService.obtener_stats()
    return Response(stats)


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
    from src.infrastructure.models.seguridad_model import Usuario
    detalle = EmpresaRegistrationService.obtener_detalle_empresa(idempresa)
    total_usuarios = Usuario.objects.filter(idempresa_id=idempresa).count()
    return Response({
        'empresa': detalle['empresa'],
        'admin_usuario': detalle['admin_usuario'],
        'total_usuarios': total_usuarios,
    })
