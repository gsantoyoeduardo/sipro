"""
Vistas del módulo Picking (Gestión de órdenes de picking).

Proporciona endpoints CRUD y acciones personalizadas para el ciclo de vida
completo de órdenes de picking, sus detalles y el reporte de incidencias.
"""
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import OrdenPicking, DetallePicking, Incidencia
from .serializers import (
    OrdenPickingSerializer, OrdenPickingListSerializer,
    DetallePickingSerializer, IncidenciaSerializer,
)


class OrdenPickingViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo OrdenPicking.

    Expone CRUD completo para órdenes de picking.
    El listado se ordena por prioridad (mayor primero) y fecha de creación
    (más reciente primero).
    Filtros:
      - ?idalmacen=<uuid>: Filtra órdenes de un almacén específico.
      - ?estado=<str>: Filtra por estado (pendiente, en_proceso, completado, cancelado).
    Acciones personalizadas:
      - POST /{pk}/iniciar/: Cambia el estado a 'en_proceso' y registra el inicio.
      - POST /{pk}/completar/: Cambia el estado a 'completado' y registra la finalización.
      - POST /{pk}/cancelar/: Cancela la orden (no permitido si ya está completada).
      - GET /{pk}/detalles/: Lista los detalles de la orden.
      - POST /{pk}/detalles/: Crea un nuevo detalle en la orden.
    """
    queryset = OrdenPicking.objects.all()
    serializer_class = OrdenPickingSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return OrdenPickingListSerializer
        return OrdenPickingSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idalmacen = self.request.query_params.get('idalmacen')
        if idalmacen:
            qs = qs.filter(idalmacen_id=idalmacen)
        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)
        return qs.order_by('-prioridad', '-fecha_creacion')

    @action(detail=True, methods=['post'], url_path='iniciar')
    def iniciar(self, request, pk=None):
        """
        Inicia el procesamiento de una orden de picking.

        Pasos:
          1. Obtiene la orden por su ID.
          2. Valida que la orden esté en estado 'pendiente'.
          3. Cambia el estado a 'en_proceso'.
          4. Registra la fecha y hora de inicio.
          5. Asigna el usuario autenticado como responsable.
          6. Guarda los cambios.
        """
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
        """
        Completa una orden de picking.

        Pasos:
          1. Obtiene la orden por su ID.
          2. Valida que la orden esté en estado 'en_proceso'.
          3. Cambia el estado a 'completado'.
          4. Registra la fecha y hora de finalización.
          5. Guarda los cambios.
        """
        orden = self.get_object()
        if orden.estado != 'en_proceso':
            return Response({'error': 'Solo órdenes en proceso pueden completarse'}, status=status.HTTP_400_BAD_REQUEST)
        orden.estado = 'completado'
        orden.fecha_completado = timezone.now()
        orden.save()
        return Response({'estado': orden.estado})

    @action(detail=True, methods=['post'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        """
        Cancela una orden de picking.

        Pasos:
          1. Obtiene la orden por su ID.
          2. Valida que la orden NO esté completada (no se puede cancelar una completada).
          3. Cambia el estado a 'cancelado'.
          4. Guarda los cambios.
        """
        orden = self.get_object()
        if orden.estado == 'completado':
            return Response({'error': 'No se puede cancelar una orden completada'}, status=status.HTTP_400_BAD_REQUEST)
        orden.estado = 'cancelado'
        orden.save()
        return Response({'estado': orden.estado})

    @action(detail=True, methods=['get'], url_path='detalles')
    def detalles(self, request, pk=None):
        """Retorna todos los detalles (líneas) de una orden de picking."""
        dets = DetallePicking.objects.filter(idorden_id=pk)
        return Response(DetallePickingSerializer(dets, many=True).data)

    @action(detail=True, methods=['post'], url_path='detalles')
    def create_detalle(self, request, pk=None):
        """
        Crea un nuevo detalle (línea) en la orden de picking.
        Asigna automáticamente el ID de la orden desde la URL.
        """
        data = request.data.copy()
        data['idorden'] = pk
        serializer = DetallePickingSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DetallePickingViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo DetallePicking (líneas de una orden de picking).

    Expone CRUD completo para los detalles de picking.
    Filtros:
      - ?idorden=<uuid>: Filtra detalles de una orden específica.
    Acciones personalizadas:
      - POST /{pk}/pick/: Registra una cantidad pickeada para el detalle.
      - POST /{pk}/incidencias/: Reporta una incidencia sobre el detalle.
      - GET /{pk}/incidencias/: Lista las incidencias del detalle.
    """
    queryset = DetallePicking.objects.all()
    serializer_class = DetallePickingSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idorden = self.request.query_params.get('idorden')
        if idorden:
            qs = qs.filter(idorden_id=idorden)
        return qs

    @action(detail=True, methods=['post'], url_path='pick')
    def pick(self, request, pk=None):
        """
        Registra una cantidad pickeada para el detalle.

        Pasos:
          1. Obtiene el detalle por su ID.
          2. Valida que 'cantidad' esté presente y sea un número.
          3. Suma la cantidad pickeada al acumulado del detalle.
          4. Si la cantidad acumulada >= la solicitada, marca el detalle como 'completado'.
          5. Si no, lo marca como 'en_proceso'.
          6. Guarda y retorna el detalle actualizado.
        """
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
        """
        Reporta una incidencia sobre un detalle de picking.

        Pasos:
          1. Copia los datos recibidos y asigna el ID del detalle y del usuario.
          2. Crea la incidencia con el serializer.
          3. Marca el detalle como 'incidencia' en su estado.
          4. Retorna la incidencia creada.
        """
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
        """Retorna todas las incidencias reportadas para este detalle."""
        incidencias = Incidencia.objects.filter(iddetalle_id=pk)
        return Response(IncidenciaSerializer(incidencias, many=True).data)


class IncidenciaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Incidencia.

    Expone CRUD completo para incidencias reportadas durante el picking.
    Acciones personalizadas:
      - POST /{pk}/resolver/: Marca la incidencia como resuelta.
    """
    queryset = Incidencia.objects.all()
    serializer_class = IncidenciaSerializer

    @action(detail=True, methods=['post'], url_path='resolver')
    def resolver(self, request, pk=None):
        """
        Marca una incidencia como resuelta.

        Pasos:
          1. Obtiene la incidencia por su ID.
          2. Establece el campo 'resuelta' en True.
          3. Guarda los cambios.
        """
        inc = self.get_object()
        inc.resuelta = True
        inc.save()
        return Response({'resuelta': inc.resuelta})
