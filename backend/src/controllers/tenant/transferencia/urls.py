from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.controllers.tenant.transferencia.views import TransferenciaViewSet, DetalleTransferenciaViewSet

router = DefaultRouter()
router.register(r'transferencias', TransferenciaViewSet)
router.register(r'detalles-transferencia', DetalleTransferenciaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
