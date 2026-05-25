from django.urls import path, include
from rest_framework.routers import DefaultRouter
from tenant.controllers.empresa.views import EmpresaViewSet, SucursalViewSet, AlmacenViewSet

router = DefaultRouter()
router.register(r'empresa', EmpresaViewSet)
router.register(r'sucursales', SucursalViewSet)
router.register(r'almacenes', AlmacenViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
