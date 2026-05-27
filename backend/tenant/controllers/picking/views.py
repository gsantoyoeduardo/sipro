from django.utils import timezone
from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from application.dto.picking.detalle_dto import DetallePickingSerializer, PickSerializer
from application.dto.picking.incidencia_dto import IncidenciaSerializer
from application.dto.picking.orden_dto import (
    OrdenPickingListSerializer,
    OrdenPickingSerializer,
)
from application.filters.picking.orden_filter import OrdenPickingFilter
from infrastructure.models.picking_model import DetallePicking, Incidencia, OrdenPicking


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"notas": "Pedido urgente", "prioridad": 1}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"prioridad": 999}, request_only=True),
    ]),
    update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"notas": "Prioridad modificada"}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"estado_orden": "en_proceso"}, request_only=True),
    ]),
)
class OrdenPickingViewSet(viewsets.ModelViewSet):
    """Órdenes de picking. Permite crear, iniciar, completar y cancelar órdenes de preparación."""
    tenant_only = True
    swagger_tags = 'Órdenes de Picking'
    queryset = OrdenPicking.objects.none()
    serializer_class = OrdenPickingSerializer
    filterset_class = OrdenPickingFilter

    def get_serializer_class(self):
        if self.action == 'list':
            return OrdenPickingListSerializer
        return OrdenPickingSerializer

    def get_queryset(self):
        qs = OrdenPicking.objects.select_related('idalmacen__idsucursal')
        idalmacen = self.request.query_params.get('idalmacen')
        if idalmacen:
            qs = qs.filter(idalmacen_id=idalmacen)
        estado = self.request.query_params.get('estado_orden')
        if estado:
            qs = qs.filter(estado_orden=estado)
        return qs.order_by('-prioridad', '-fecha_creacion')

    @extend_schema(
        request=None, responses={200: None, 400: None},
        description="Inicia el proceso de picking en una orden pendiente. Cambia el estado a 'en_proceso'.",
    )
    @action(detail=True, methods=['post'], url_path='iniciar')
    def iniciar(self, request, pk=None):
        orden = self.get_object()
        if orden.estado_orden != 'pendiente':
            return Response({'error': 'Solo órdenes pendientes pueden iniciarse'}, status=status.HTTP_400_BAD_REQUEST)
        orden.estado_orden = 'en_proceso'
        orden.fecha_inicio = timezone.now()
        orden.idusuario = request.user
        orden.save()
        return Response({'estado': orden.estado})

    @extend_schema(
        request=None, responses={200: None, 400: None},
        description="Marca una orden de picking como completada. Solo aplica a órdenes en proceso.",
    )
    @action(detail=True, methods=['post'], url_path='completar')
    def completar(self, request, pk=None):
        orden = self.get_object()
        if orden.estado_orden != 'en_proceso':
            return Response({'error': 'Solo órdenes en proceso pueden completarse'}, status=status.HTTP_400_BAD_REQUEST)
        orden.estado_orden = 'completado'
        orden.fecha_completado = timezone.now()
        orden.save()
        return Response({'estado': orden.estado})

    @extend_schema(
        request=None, responses={200: None, 400: None},
        description="Cancela una orden de picking pendiente o en proceso. Las órdenes completadas no pueden cancelarse.",
    )
    @action(detail=True, methods=['post'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        orden = self.get_object()
        if orden.estado_orden == 'completado':
            return Response({'error': 'No se puede cancelar una orden completada'}, status=status.HTTP_400_BAD_REQUEST)
        orden.estado_orden = 'cancelado'
        orden.save()
        return Response({'estado': orden.estado})

    @action(detail=True, methods=['get'], url_path='detalles')
    def detalles(self, request, pk=None):
        """Retorna los detalles de una orden de picking: productos, cantidades y ubicaciones asignadas."""
        dets = DetallePicking.objects.filter(idorden_id=pk)
        return Response(DetallePickingSerializer(dets, many=True).data)

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"cantidad_solicitada": 10}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"cantidad_solicitada": 0}, request_only=True),
    ])
    @action(detail=True, methods=['post'], url_path='detalles', serializer_class=DetallePickingSerializer)
    def create_detalle(self, request, pk=None):
        """Agrega un nuevo detalle (producto) a una orden de picking existente."""
        data = request.data.copy()
        data['idorden'] = pk
        serializer = DetallePickingSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"cantidad_solicitada": 15}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"cantidad_solicitada": -1}, request_only=True),
    ]),
)
class DetallePickingViewSet(viewsets.ModelViewSet):
    """Detalles de órdenes de picking. Permite pickear productos y reportar incidencias."""
    tenant_only = True
    swagger_tags = 'Detalles de Picking'
    queryset = DetallePicking.objects.none()
    serializer_class = DetallePickingSerializer

    def get_queryset(self):
        qs = DetallePicking.objects.select_related('idorden__idalmacen__idsucursal')
        idorden = self.request.query_params.get('idorden')
        if idorden:
            qs = qs.filter(idorden_id=idorden)
        return qs

    @extend_schema(
        request=PickSerializer,
        examples=[
            OpenApiExample('Picking exitoso', value={'cantidad': 5.0}, request_only=True),
            OpenApiExample('Cantidad inválida', value={'cantidad': -1}, request_only=True),
        ],
    )
    @action(detail=True, methods=['post'], url_path='pick', serializer_class=PickSerializer)
    def pick(self, request, pk=None):
        detalle = self.get_object()
        cantidad = request.data.get('cantidad')
        if not cantidad:
            return Response({'error': 'cantidad requerida'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            cantidad = float(cantidad)
        except (ValueError, TypeError):
            return Response({'error': 'cantidad debe ser un número'}, status=status.HTTP_400_BAD_REQUEST)
        detalle.cantidad_pickeada += cantidad
        if detalle.cantidad_pickeada >= detalle.cantidad_solicitada:
            detalle.estado_detalle = 'completado'
        else:
            detalle.estado_detalle = 'en_proceso'
        detalle.save()
        return Response(DetallePickingSerializer(detalle).data)

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"tipo": "producto_danado", "descripcion": "El empaque llegó roto"}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"tipo": ""}, request_only=True),
    ])
    @action(detail=True, methods=['post'], url_path='incidencias', serializer_class=IncidenciaSerializer)
    def reportar_incidencia(self, request, pk=None):
        """Reporta una incidencia sobre un detalle de picking (producto dañado, cantidad incorrecta, etc.)."""
        data = request.data.copy()
        data['iddetalle'] = pk
        data['idusuario'] = request.user.idusuario
        serializer = IncidenciaSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        detalle = self.get_object()
        detalle.estado_detalle = 'incidencia'
        detalle.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='incidencias')
    def ver_incidencias(self, request, pk=None):
        """Retorna todas las incidencias reportadas para un detalle de picking específico."""
        incidencias = Incidencia.objects.filter(iddetalle_id=pk)
        return Response(IncidenciaSerializer(incidencias, many=True).data)


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"tipo": "cantidad_incorrecta", "descripcion": "Faltan 2 unidades"}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"tipo": "invalido"}, request_only=True),
    ]),
)
class IncidenciaViewSet(viewsets.ModelViewSet):
    """Incidencias reportadas durante el proceso de picking."""
    tenant_only = True
    swagger_tags = 'Incidencias'
    queryset = Incidencia.objects.none()
    serializer_class = IncidenciaSerializer

    def get_queryset(self):
        qs = Incidencia.objects.select_related('iddetalle__idorden__idalmacen__idsucursal')
        return qs

    @extend_schema(
        request=None, responses={200: None},
        description="Marca una incidencia como resuelta. No requiere cuerpo, solo el ID de la incidencia.",
    )
    @action(detail=True, methods=['post'], url_path='resolver')
    def resolver(self, request, pk=None):
        inc = self.get_object()
        inc.resuelta = True
        inc.save()
        return Response({'resuelta': inc.resuelta})

