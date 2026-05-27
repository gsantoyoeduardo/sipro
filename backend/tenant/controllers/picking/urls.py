from django.urls import include, path
from rest_framework.routers import DefaultRouter

from tenant.controllers.picking.views import (
    DetallePickingViewSet,
    IncidenciaViewSet,
    OrdenPickingViewSet,
)

router = DefaultRouter()
router.register(r'ordenes', OrdenPickingViewSet)
router.register(r'detalles', DetallePickingViewSet)
router.register(r'incidencias', IncidenciaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
