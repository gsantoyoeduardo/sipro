"""
Vistas del módulo Transferencia (Gestión de transferencias entre almacenes).

Proporciona endpoints CRUD y acciones personalizadas para el ciclo de vida
completo de transferencias de stock entre almacenes, incluyendo el envío,
recepción, rechazo y la gestión de sus detalles.
"""
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Transferencia, DetalleTransferencia
from .serializers import (
    TransferenciaSerializer, TransferenciaListSerializer,
    DetalleTransferenciaSerializer,
)


class TransferenciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Transferencia.

    Expone CRUD completo para transferencias entre almacenes.
    El listado se ordena por fecha de creación descendente.
    Filtros:
      - ?estado=<str>: Filtra por estado (pendiente, en_transito, completado, rechazado).
      - ?origen=<uuid>: Filtra por almacén de origen.
    Acciones personalizadas:
      - POST /{pk}/enviar/: Cambia el estado a 'en_transito' y registra la fecha de envío.
      - POST /{pk}/recibir/: Cambia el estado a 'completado' y registra la fecha de recepción.
      - POST /{pk}/rechazar/: Rechaza la transferencia (no permitido si está completada).
      - GET /{pk}/detalles/: Lista los detalles de la transferencia.
      - POST /{pk}/detalles/: Crea un nuevo detalle en la transferencia.
    """
    queryset = Transferencia.objects.all()
    serializer_class = TransferenciaSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return TransferenciaListSerializer
        return TransferenciaSerializer

    def get_queryset(self):
        qs = super().get_queryset().order_by('-fecha_creacion')
        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)
        origen = self.request.query_params.get('origen')
        if origen:
            qs = qs.filter(idalmacen_origen_id=origen)
        return qs

    @action(detail=True, methods=['post'], url_path='enviar')
    def enviar(self, request, pk=None):
        """
        Envía una transferencia (cambia a estado 'en_transito').

        Pasos:
          1. Obtiene la transferencia por su ID.
          2. Valida que esté en estado 'pendiente'.
          3. Cambia el estado a 'en_transito'.
          4. Registra la fecha y hora de envío.
          5. Guarda los cambios.
        """
        tr = self.get_object()
        if tr.estado != 'pendiente':
            return Response({'error': 'Solo transferencias pendientes pueden enviarse'}, status=status.HTTP_400_BAD_REQUEST)
        tr.estado = 'en_transito'
        tr.fecha_envio = timezone.now()
        tr.save()
        return Response({'estado': tr.estado})

    @action(detail=True, methods=['post'], url_path='recibir')
    def recibir(self, request, pk=None):
        """
        Recibe una transferencia (cambia a estado 'completado').

        Pasos:
          1. Obtiene la transferencia por su ID.
          2. Valida que esté en estado 'en_transito'.
          3. Cambia el estado a 'completado'.
          4. Registra la fecha y hora de recepción.
          5. Guarda los cambios.
        """
        tr = self.get_object()
        if tr.estado != 'en_transito':
            return Response({'error': 'Solo transferencias en tr\u00e1nsito pueden recibirse'}, status=status.HTTP_400_BAD_REQUEST)
        tr.estado = 'completado'
        tr.fecha_recepcion = timezone.now()
        tr.save()
        return Response({'estado': tr.estado})

    @action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        """
        Rechaza una transferencia.

        Pasos:
          1. Obtiene la transferencia por su ID.
          2. Valida que no esté completada (no se puede rechazar una completada).
          3. Cambia el estado a 'rechazado'.
          4. Guarda los cambios.
        """
        tr = self.get_object()
        if tr.estado == 'completado':
            return Response({'error': 'No se puede rechazar una transferencia completada'}, status=status.HTTP_400_BAD_REQUEST)
        tr.estado = 'rechazado'
        tr.save()
        return Response({'estado': tr.estado})

    @action(detail=True, methods=['get'], url_path='detalles')
    def detalles(self, request, pk=None):
        """Retorna todos los detalles (líneas) de una transferencia."""
        dets = DetalleTransferencia.objects.filter(idtransferencia_id=pk)
        return Response(DetalleTransferenciaSerializer(dets, many=True).data)

    @action(detail=True, methods=['post'], url_path='detalles')
    def create_detalle(self, request, pk=None):
        """
        Crea un nuevo detalle (línea) en la transferencia.
        Asigna automáticamente el ID de la transferencia desde la URL.
        """
        data = request.data.copy()
        data['idtransferencia'] = pk
        serializer = DetalleTransferenciaSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DetalleTransferenciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo DetalleTransferencia (líneas de una transferencia).

    Expone CRUD completo para los detalles de una transferencia.
    Filtros:
      - ?idtransferencia=<uuid>: Filtra detalles de una transferencia específica.
    """
    queryset = DetalleTransferencia.objects.all()
    serializer_class = DetalleTransferenciaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idtransferencia = self.request.query_params.get('idtransferencia')
        if idtransferencia:
            qs = qs.filter(idtransferencia_id=idtransferencia)
        return qs
