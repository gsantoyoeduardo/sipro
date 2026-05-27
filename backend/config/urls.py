from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView


def root_redirect(request):
    return redirect('/iniciar-sesion/')


urlpatterns = [
    path('', root_redirect),
    path('admin/', admin.site.urls),
    path('tenant/', include('tenant.urls')),
    path('auth/', include('portal.auth.urls')),
    path('auth/refrescar/', TokenRefreshView.as_view(), name='token_refresh'),
    path('empresa/', include('portal.controllers.empresa.urls')),
    path('auditorias/', include('portal.controllers.auditoria.urls')),
    path('permisos/', include('portal.controllers.permisos.urls')),
    path('roles/', include('portal.controllers.roles.urls')),
    path('usuarios/', include('portal.controllers.usuarios.urls')),
]

try:
    from portal.swagger import urlpatterns as portal_swagger
    from tenant.swagger import urlpatterns as tenant_swagger
    urlpatterns += [
        path('api/', include(portal_swagger)),
        path('tenant/', include(tenant_swagger)),
    ]
except ImportError:
    pass
