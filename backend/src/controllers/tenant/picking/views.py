from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from src.infrastructure.models.picking_model import OrdenPicking, DetallePicking, Incidencia
from src.infrastructure.serializers.picking_serializer import (
    OrdenPickingSerializer, OrdenPickingListSerializer,
    DetallePickingSerializer, IncidenciaSerializer,
)


class OrdenPickingViewSet(viewsets.ModelViewSet):
    queryset = OrdenPicking.objects.none()
    serializer_class = OrdenPickingSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return OrdenPickingListSerializer
        return OrdenPickingSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        qs = OrdenPicking.objects.select_related('idalmacen__idsucursal')
        if idempresa:
            qs = qs.filter(idalmacen__idsucursal__idempresa_id=idempresa)
        idalmacen = self.request.query_params.get('idalmacen')
        if idalmacen:
            qs = qs.filter(idalmacen_id=idalmacen)
        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)
        return qs.order_by('-prioridad', '-fecha_creacion')

    @action(detail=True, methods=['post'], url_path='iniciar')
    def iniciar(self, request, pk=None):
        orden = self.get_object()
        if orden.estado != 'pendiente':
            return Response({'error': 'Solo órdenes pendientes pueden iniciarse'}, status=status.HTTP_400_BAD_REQUEST)
        orden.estado = 'en_proceso'
        orden.fecha_inicio = timezone.now()
        orden.idusuario = request.user
        orden.save()
        return Response({'estado': orden.estado})

    @action(detail=True, methods=['post'], url_path='completar')
    def completar(self, request, pk=None):
        orden = self.get_object()
        if orden.estado != 'en_proceso':
            return Response({'error': 'Solo órdenes en proceso pueden completarse'}, status=status.HTTP_400_BAD_REQUEST)
        orden.estado = 'completado'
        orden.fecha_completado = timezone.now()
        orden.save()
        return Response({'estado': orden.estado})

    @action(detail=True, methods=['post'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        orden = self.get_object()
        if orden.estado == 'completado':
            return Response({'error': 'No se puede cancelar una orden completada'}, status=status.HTTP_400_BAD_REQUEST)
        orden.estado = 'cancelado'
        orden.save()
        return Response({'estado': orden.estado})

    @action(detail=True, methods=['get'], url_path='detalles')
    def detalles(self, request, pk=None):
        dets = DetallePicking.objects.filter(idorden_id=pk)
        return Response(DetallePickingSerializer(dets, many=True).data)

    @action(detail=True, methods=['post'], url_path='detalles')
    def create_detalle(self, request, pk=None):
        data = request.data.copy()
        data['idorden'] = pk
        serializer = DetallePickingSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DetallePickingViewSet(viewsets.ModelViewSet):
    queryset = DetallePicking.objects.none()
    serializer_class = DetallePickingSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        qs = DetallePicking.objects.select_related('idorden__idalmacen__idsucursal')
        if idempresa:
            qs = qs.filter(idorden__idalmacen__idsucursal__idempresa_id=idempresa)
        idorden = self.request.query_params.get('idorden')
        if idorden:
            qs = qs.filter(idorden_id=idorden)
        return qs

    @action(detail=True, methods=['post'], url_path='pick')
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
            detalle.estado = 'completado'
        else:
            detalle.estado = 'en_proceso'
        detalle.save()
        return Response(DetallePickingSerializer(detalle).data)

    @action(detail=True, methods=['post'], url_path='incidencias')
    def reportar_incidencia(self, request, pk=None):
        data = request.data.copy()
        data['iddetalle'] = pk
        data['idusuario'] = request.user.idusuario
        serializer = IncidenciaSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        detalle = self.get_object()
        detalle.estado = 'incidencia'
        detalle.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='incidencias')
    def ver_incidencias(self, request, pk=None):
        incidencias = Incidencia.objects.filter(iddetalle_id=pk)
        return Response(IncidenciaSerializer(incidencias, many=True).data)


class IncidenciaViewSet(viewsets.ModelViewSet):
    queryset = Incidencia.objects.none()
    serializer_class = IncidenciaSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        qs = Incidencia.objects.select_related('iddetalle__idorden__idalmacen__idsucursal')
        if idempresa:
            qs = qs.filter(iddetalle__idorden__idalmacen__idsucursal__idempresa_id=idempresa)
        return qs

    @action(detail=True, methods=['post'], url_path='resolver')
    def resolver(self, request, pk=None):
        inc = self.get_object()
        inc.resuelta = True
        inc.save()
        return Response({'resuelta': inc.resuelta})
