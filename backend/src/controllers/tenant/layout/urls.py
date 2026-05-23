from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.controllers.tenant.layout.views import (
    ZonaViewSet, PasilloViewSet, EstanteViewSet,
    NivelViewSet, UbicacionViewSet,
    NodoViewSet, ConexionViewSet, RutaViewSet,
)

router = DefaultRouter()
router.register(r'zonas', ZonaViewSet)
router.register(r'pasillos', PasilloViewSet)
router.register(r'estantes', EstanteViewSet)
router.register(r'niveles', NivelViewSet)
router.register(r'ubicaciones', UbicacionViewSet)
router.register(r'nodos', NodoViewSet)
router.register(r'conexiones', ConexionViewSet)
router.register(r'rutas', RutaViewSet, basename='ruta')

urlpatterns = [
    path('', include(router.urls)),
]
