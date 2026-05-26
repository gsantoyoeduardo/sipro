import uuid
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiExample
from application.dto.portal.registro_dto import CrearEmpresaSerializer
from application.dto.empresa.empresa_dto import EmpresaSerializer, EmpresaListSerializer
from application.services.portal.empresa_registration_service import EmpresaRegistrationService
from application.services.empresa.empresa_service import EmpresaService
from infrastructure.models.empresa_model import Empresa
from infrastructure.utils.tenant_schema import tenant_schema


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
    if not data.get('admin_password'):
        errors['admin_password'] = 'La contraseña del administrador es obligatoria'
    elif len(data['admin_password']) < 8:
        errors['admin_password'] = 'La contraseña debe tener al menos 8 caracteres'
    if not data.get('admin_usuario'):
        errors['admin_usuario'] = 'El nombre de usuario administrador es obligatorio'
    if not data.get('admin_nombres'):
        errors['admin_nombres'] = 'Los nombres del administrador son obligatorios'
    if not data.get('admin_correo'):
        errors['admin_correo'] = 'El correo del administrador es obligatorio'

    if errors:
        return Response({'error': 'Datos inválidos', 'fields': errors}, status=status.HTTP_400_BAD_REQUEST)

    service_data = {
        **data,
        'password': data['admin_password'],
        'usuario': data['admin_usuario'],
        'nombres': data['admin_nombres'],
        'apellidos': data.get('admin_apellidos', ''),
        'usuario_correo': data['admin_correo'],
    }

    result = EmpresaRegistrationService.registrar_empresa(service_data)
    return Response({
        'mensaje': 'Empresa creada exitosamente',
        'empresa': result['empresa'],
        'admin': result['admin'],
        'schema': result['schema'],
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def listar_empresas(request):
    empresas = EmpresaService.listar()
    page = request.query_params.get('page', 1)
    page_size = request.query_params.get('page_size', 20)
    serializer = EmpresaListSerializer(empresas, many=True)
    return Response({'results': serializer.data})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def detalle_empresa(request, idempresa):
    from infrastructure.models.seguridad_model import Usuario
    empresa = Empresa.objects.get(pk=idempresa)
    total_usuarios = Usuario.objects.filter(idempresa_id=idempresa).count()
    admin = Usuario.objects.filter(idempresa_id=idempresa, tipo_usuario='admin_empresa').first()
    return Response({
        'empresa': EmpresaSerializer(empresa).data,
        'total_usuarios': total_usuarios,
        'admin_usuario': admin.usuario if admin else None,
    })


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def editar_empresa(request, idempresa):
    empresa = Empresa.objects.get(pk=idempresa)
    serializer = EmpresaSerializer(empresa, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({'mensaje': 'Empresa actualizada exitosamente', 'empresa': serializer.data})


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def desactivar_empresa(request, idempresa):
    empresa = Empresa.objects.get(pk=idempresa)
    empresa.estado = not empresa.estado
    empresa.save(update_fields=['estado'])
    return Response({'estado': empresa.estado})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def listar_usuarios_empresa(request, idempresa):
    from infrastructure.models.seguridad_model import Usuario
    from application.dto.seguridad.usuario_dto import UsuarioListSerializer
    with tenant_schema(idempresa):
        usuarios = Usuario.objects.all().order_by('-fechacreacion')
        serializer = UsuarioListSerializer(usuarios, many=True)
        return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def editar_usuario_empresa(request, idempresa, userId):
    from infrastructure.models.seguridad_model import Usuario
    from application.dto.seguridad.usuario_dto import UsuarioSerializer
    from infrastructure.repositories.seguridad_repo import UsuarioRepository
    with tenant_schema(idempresa):
        usuario = Usuario.objects.get(pk=userId)
        repo = UsuarioRepository()
        repo.update(userId, request.data)
        return Response({'mensaje': 'Usuario actualizado exitosamente'})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def sesiones_empresa(request, idempresa):
    from infrastructure.models.seguridad_model import SesionUsuario
    from application.dto.seguridad.sesion_dto import SesionUsuarioSerializer
    with tenant_schema(idempresa):
        sesiones = SesionUsuario.objects.filter(activa=True).order_by('-fechainicio')
        serializer = SesionUsuarioSerializer(sesiones, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def estadisticas(request):
    from infrastructure.repositories.empresa_repo import EmpresaRepository
    from infrastructure.models.seguridad_model import Usuario
    empresa_repo = EmpresaRepository()
    total = empresa_repo.get_all().count()
    activas = empresa_repo.get_all().filter(estado=True).count()
    return Response({
        'total_empresas': total,
        'total_usuarios': Usuario.objects.count(),
        'empresas_activas': activas,
        'empresas_inactivas': total - activas,
    })
