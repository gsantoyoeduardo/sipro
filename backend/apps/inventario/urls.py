from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, ProductoViewSet, LoteViewSet, InventarioViewSet, KardexViewSet

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'lotes', LoteViewSet)
router.register(r'inventarios', InventarioViewSet)
router.register(r'kardex', KardexViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
