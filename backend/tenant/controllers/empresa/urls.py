from django.urls import include, path
from rest_framework.routers import DefaultRouter

from tenant.controllers.empresa.views import (
    AlmacenViewSet,
    EmpresaViewSet,
    SucursalViewSet,
)

router = DefaultRouter()
router.register(r'empresa', EmpresaViewSet)
router.register(r'sucursales', SucursalViewSet)
router.register(r'almacenes', AlmacenViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
