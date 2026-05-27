from django.urls import include, path
from rest_framework.routers import DefaultRouter

from tenant.controllers.inventario.views import (
    CategoriaViewSet,
    InventarioViewSet,
    KardexViewSet,
    LoteViewSet,
    ProductoViewSet,
)

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'lotes', LoteViewSet)
router.register(r'inventario', InventarioViewSet)
router.register(r'kardex', KardexViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
