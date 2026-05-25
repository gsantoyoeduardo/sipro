from django.urls import path, include

urlpatterns = [
    path('auth/', include('tenant.auth.urls')),
    path('api/', include('tenant.controllers.inventario.urls')),
    path('api/', include('tenant.controllers.picking.urls')),
    path('api/', include('tenant.controllers.layout.urls')),
    path('api/', include('tenant.controllers.transferencia.urls')),
    path('api/', include('tenant.controllers.seguridad.urls')),
    path('api/', include('tenant.controllers.dashboard.urls')),
    path('api/', include('tenant.controllers.empresa.urls')),
]
