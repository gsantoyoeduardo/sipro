from django.urls import include, path

urlpatterns = [
    path('auth/', include('portal.auth.urls')),
    path('api/', include('portal.controllers.empresa.urls')),
    path('api/', include('portal.controllers.auditoria.urls')),
    path('api/', include('portal.controllers.permisos.urls')),
    path('api/', include('portal.controllers.roles.urls')),
    path('api/', include('portal.controllers.usuarios.urls')),
    path('api/', include('portal.controllers.dashboard.urls')),
]
