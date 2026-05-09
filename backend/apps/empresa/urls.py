from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmpresaViewSet, SucursalViewSet, AlmacenViewSet

router = DefaultRouter()
router.register(r'empresas', EmpresaViewSet)
router.register(r'sucursales', SucursalViewSet)
router.register(r'almacenes', AlmacenViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
