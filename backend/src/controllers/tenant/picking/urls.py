from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.controllers.tenant.picking.views import OrdenPickingViewSet, DetallePickingViewSet, IncidenciaViewSet

router = DefaultRouter()
router.register(r'ordenes-picking', OrdenPickingViewSet)
router.register(r'detalles-picking', DetallePickingViewSet)
router.register(r'incidencias', IncidenciaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
