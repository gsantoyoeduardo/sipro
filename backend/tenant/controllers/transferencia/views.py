from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiExample
from infrastructure.models.transferencia_model import Transferencia, DetalleTransferencia
from application.dto.transferencia.transferencia_dto import TransferenciaSerializer, TransferenciaListSerializer
from application.dto.transferencia.detalle_dto import DetalleTransferenciaSerializer
from application.dto.shared_dto import ToggleEstadoSerializer
from application.filters.transferencia.transferencia_filter import TransferenciaFilter


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"notas": "Transferencia mensual de stock"}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"idalmacen_destino": "uuid-invalido"}, request_only=True),
    ]),
    update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"notas": "Nota actualizada"}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"estado_transferencia": "en_transito"}, request_only=True),
    ]),
)
class TransferenciaViewSet(viewsets.ModelViewSet):
    """Transferencias de stock entre almacenes. Soporta envío, recepción y rechazo."""
    tenant_only = True
    swagger_tags = 'Transferencias'
    queryset = Transferencia.objects.none()
    serializer_class = TransferenciaSerializer
    filterset_class = TransferenciaFilter

    def get_serializer_class(self):
        if self.action == 'list':
            return TransferenciaListSerializer
        return TransferenciaSerializer

    def get_queryset(self):
        qs = Transferencia.objects.select_related('idalmacen_origen__idsucursal', 'idalmacen_destino__idsucursal').order_by('-fecha_creacion')
        estado = self.request.query_params.get('estado_transferencia')
        if estado:
            qs = qs.filter(estado_transferencia=estado)
        origen = self.request.query_params.get('origen')
        if origen:
            qs = qs.filter(idalmacen_origen_id=origen)
        return qs

    @extend_schema(
        request=None, responses={200: None, 400: None},
        description="Envía una transferencia pendiente. Cambia el estado a 'en_tránsito'.",
    )
    @action(detail=True, methods=['post'], url_path='enviar')
    def enviar(self, request, pk=None):
        tr = self.get_object()
        if tr.estado_transferencia != 'pendiente':
            return Response({'error': 'Solo transferencias pendientes pueden enviarse'}, status=status.HTTP_400_BAD_REQUEST)
        tr.estado_transferencia = 'en_transito'
        tr.fecha_envio = timezone.now()
        tr.save()
        return Response({'estado': tr.estado})

    @extend_schema(
        request=None, responses={200: None, 400: None},
        description="Recibe una transferencia en tránsito. Cambia el estado a 'completado'.",
    )
    @action(detail=True, methods=['post'], url_path='recibir')
    def recibir(self, request, pk=None):
        tr = self.get_object()
        if tr.estado_transferencia != 'en_transito':
            return Response({'error': 'Solo transferencias en tránsito pueden recibirse'}, status=status.HTTP_400_BAD_REQUEST)
        tr.estado_transferencia = 'completado'
        tr.fecha_recepcion = timezone.now()
        tr.save()
        return Response({'estado': tr.estado})

    @extend_schema(
        request=None, responses={200: None, 400: None},
        description="Rechaza una transferencia pendiente o en tránsito. Cambia el estado a 'rechazado'.",
    )
    @action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        tr = self.get_object()
        if tr.estado_transferencia not in ('pendiente', 'en_transito'):
            return Response({'error': 'No se puede rechazar esta transferencia'}, status=status.HTTP_400_BAD_REQUEST)
        tr.estado_transferencia = 'rechazado'
        tr.save()
        return Response({'estado': tr.estado})

    @action(detail=True, methods=['get'], url_path='detalles')
    def detalles(self, request, pk=None):
        """Retorna los productos incluidos en una transferencia de stock."""
        dets = DetalleTransferencia.objects.filter(idtransferencia_id=pk)
        return Response(DetalleTransferenciaSerializer(dets, many=True).data)

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"cantidad": 25}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"cantidad": -5}, request_only=True),
    ])
    @action(detail=True, methods=['post'], url_path='detalles', serializer_class=DetalleTransferenciaSerializer)
    def create_detalle(self, request, pk=None):
        """Agrega un producto a una transferencia de stock existente."""
        data = request.data.copy()
        data['idtransferencia'] = pk
        serializer = DetalleTransferenciaSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"cantidad": 30}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"cantidad": 0}, request_only=True),
    ]),
)
class DetalleTransferenciaViewSet(viewsets.ModelViewSet):
    """Detalles de productos incluidos en una transferencia de stock."""
    tenant_only = True
    swagger_tags = 'Detalles de Transferencia'
    queryset = DetalleTransferencia.objects.none()
    serializer_class = DetalleTransferenciaSerializer

    def get_queryset(self):
        qs = DetalleTransferencia.objects.select_related('idtransferencia__idalmacen_origen__idsucursal')
        idtransferencia = self.request.query_params.get('idtransferencia')
        if idtransferencia:
            qs = qs.filter(idtransferencia_id=idtransferencia)
        return qs

