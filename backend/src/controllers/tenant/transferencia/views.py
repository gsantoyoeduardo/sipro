from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from src.infrastructure.models.transferencia_model import Transferencia, DetalleTransferencia
from src.infrastructure.serializers.transferencia_serializer import (
    TransferenciaSerializer, TransferenciaListSerializer,
    DetalleTransferenciaSerializer,
)


class TransferenciaViewSet(viewsets.ModelViewSet):
    queryset = Transferencia.objects.none()
    serializer_class = TransferenciaSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return TransferenciaListSerializer
        return TransferenciaSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        qs = Transferencia.objects.select_related('idalmacen_origen__idsucursal', 'idalmacen_destino__idsucursal').order_by('-fecha_creacion')
        if idempresa:
            qs = qs.filter(idalmacen_origen__idsucursal__idempresa_id=idempresa)
        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)
        origen = self.request.query_params.get('origen')
        if origen:
            qs = qs.filter(idalmacen_origen_id=origen)
        return qs

    @action(detail=True, methods=['post'], url_path='enviar')
    def enviar(self, request, pk=None):
        tr = self.get_object()
        if tr.estado != 'pendiente':
            return Response({'error': 'Solo transferencias pendientes pueden enviarse'}, status=status.HTTP_400_BAD_REQUEST)
        tr.estado = 'en_transito'
        tr.fecha_envio = timezone.now()
        tr.save()
        return Response({'estado': tr.estado})

    @action(detail=True, methods=['post'], url_path='recibir')
    def recibir(self, request, pk=None):
        tr = self.get_object()
        if tr.estado != 'en_transito':
            return Response({'error': 'Solo transferencias en tránsito pueden recibirse'}, status=status.HTTP_400_BAD_REQUEST)
        tr.estado = 'completado'
        tr.fecha_recepcion = timezone.now()
        tr.save()
        return Response({'estado': tr.estado})

    @action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        tr = self.get_object()
        if tr.estado == 'completado':
            return Response({'error': 'No se puede rechazar una transferencia completada'}, status=status.HTTP_400_BAD_REQUEST)
        tr.estado = 'rechazado'
        tr.save()
        return Response({'estado': tr.estado})

    @action(detail=True, methods=['get'], url_path='detalles')
    def detalles(self, request, pk=None):
        dets = DetalleTransferencia.objects.filter(idtransferencia_id=pk)
        return Response(DetalleTransferenciaSerializer(dets, many=True).data)

    @action(detail=True, methods=['post'], url_path='detalles')
    def create_detalle(self, request, pk=None):
        data = request.data.copy()
        data['idtransferencia'] = pk
        serializer = DetalleTransferenciaSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DetalleTransferenciaViewSet(viewsets.ModelViewSet):
    queryset = DetalleTransferencia.objects.none()
    serializer_class = DetalleTransferenciaSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        qs = DetalleTransferencia.objects.select_related('idtransferencia__idalmacen_origen__idsucursal')
        if idempresa:
            qs = qs.filter(idtransferencia__idalmacen_origen__idsucursal__idempresa_id=idempresa)
        idtransferencia = self.request.query_params.get('idtransferencia')
        if idtransferencia:
            qs = qs.filter(idtransferencia_id=idtransferencia)
        return qs
