from django.urls import path, include
from rest_framework.routers import DefaultRouter
from tenant.controllers.transferencia.views import TransferenciaViewSet, DetalleTransferenciaViewSet

router = DefaultRouter()
router.register(r'transferencias', TransferenciaViewSet)
router.register(r'detalles', DetalleTransferenciaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
