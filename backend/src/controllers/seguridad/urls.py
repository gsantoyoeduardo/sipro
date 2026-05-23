from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.controllers.seguridad.views import UsuarioViewSet, RolViewSet, PermisoViewSet, SesionUsuarioViewSet

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'roles', RolViewSet)
router.register(r'permisos', PermisoViewSet)
router.register(r'sesiones', SesionUsuarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
