from django.urls import include, path
from rest_framework.routers import DefaultRouter

from tenant.controllers.transferencia.views import (
    DetalleTransferenciaViewSet,
    TransferenciaViewSet,
)

router = DefaultRouter()
router.register(r'transferencias', TransferenciaViewSet)
router.register(r'detalles', DetalleTransferenciaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
