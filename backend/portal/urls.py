from django.urls import path, include

urlpatterns = [
    path('auth/', include('portal.auth.urls')),
    path('api/', include('portal.controllers.empresa.urls')),
    path('api/', include('portal.controllers.seguridad.urls')),
    path('api/', include('portal.controllers.registro.urls')),
    path('api/', include('portal.controllers.dashboard.urls')),
    path('api/auditoria/', include('portal.controllers.auditoria.urls')),
]
