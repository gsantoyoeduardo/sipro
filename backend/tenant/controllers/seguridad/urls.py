from django.urls import include, path
from rest_framework.routers import DefaultRouter

from tenant.controllers.seguridad.views import (
    PermisoViewSet,
    RolViewSet,
    SesionUsuarioViewSet,
    UsuarioViewSet,
)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'roles', RolViewSet)
router.register(r'permisos', PermisoViewSet)
router.register(r'sesiones', SesionUsuarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
