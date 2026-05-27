from django.urls import include, path
from rest_framework.routers import DefaultRouter

from tenant.controllers.layout.views import (
    ConexionViewSet,
    EstanteViewSet,
    NivelViewSet,
    NodoViewSet,
    RutaViewSet,
    UbicacionViewSet,
    ZonaViewSet,
)

router = DefaultRouter()
router.register(r'zonas', ZonaViewSet)
router.register(r'estantes', EstanteViewSet)
router.register(r'niveles', NivelViewSet)
router.register(r'ubicaciones', UbicacionViewSet)
router.register(r'nodos', NodoViewSet)
router.register(r'conexiones', ConexionViewSet)
router.register(r'rutas', RutaViewSet, basename='ruta')

urlpatterns = [
    path('', include(router.urls)),
]
