"""
Vistas del Portal Registro (Registro y gestión de empresas desde el portal).

Proporciona endpoints basados en funciones (api_view) para que un administrador
global pueda crear empresas completas (con su esquema y administrador),
obtener estadísticas, cambiar el estado de una empresa y consultar su detalle.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from src.application.portal.empresa_registration_service import EmpresaRegistrationService
from src.infrastructure.models.empresa_model import Empresa


@api_view(['POST'])
@permission_classes([IsAdminUser])
def crear_empresa(request):
    """
    Crea una nueva empresa de forma completa en un solo paso.

    Recibe los datos de la empresa (razonsocial, ruc, correo) y del usuario
    administrador (admin_usuario, admin_nombres, admin_correo, admin_password).
    Valida que todos los campos obligatorios estén presentes y que la
    contraseña tenga al menos 6 caracteres.
    Delega la creación en EmpresaRegistrationService.registrar_empresa().
    """
    data = request.data
    errors = {}
    if not data.get('razonsocial'):
        errors['razonsocial'] = 'La raz\u00f3n social es obligatoria'
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
        errors['admin_password'] = 'La contrase\u00f1a es obligatoria'
    elif len(data['admin_password']) < 6:
        errors['admin_password'] = 'La contrase\u00f1a debe tener al menos 6 caracteres'

    if errors:
        return Response({'error': 'Datos inv\u00e1lidos', 'fields': errors}, status=status.HTTP_400_BAD_REQUEST)

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
    """
    Retorna estadísticas globales de empresas registradas.
    Delega en EmpresaRegistrationService.obtener_stats().
    """
    stats = EmpresaRegistrationService.obtener_stats()
    return Response(stats)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def toggle_empresa_estado(request, idempresa):
    """
    Cambia el estado (activo/inactivo) de una empresa por su ID.
    Alterna el valor booleano del campo 'estado'.
    """
    empresa = Empresa.objects.get(pk=idempresa)
    empresa.estado = not empresa.estado
    empresa.save(update_fields=['estado'])
    return Response({'estado': empresa.estado})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_empresa_detalle(request, idempresa):
    """
    Retorna el detalle completo de una empresa incluyendo:
      - Datos de la empresa
      - Información del usuario administrador
      - Total de usuarios registrados bajo esa empresa
    """
    from src.infrastructure.models.seguridad_model import Usuario
    detalle = EmpresaRegistrationService.obtener_detalle_empresa(idempresa)
    total_usuarios = Usuario.objects.filter(idempresa_id=idempresa).count()
    return Response({
        'empresa': detalle['empresa'],
        'admin_usuario': detalle['admin_usuario'],
        'total_usuarios': total_usuarios,
    })
