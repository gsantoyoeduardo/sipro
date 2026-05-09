from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/login/', include('apps.seguridad.auth_urls')),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include('apps.seguridad.urls')),
    path('', include('apps.empresa.urls')),
    path('', include('apps.layout.urls')),
    path('', include('apps.inventario.urls')),
    path('', include('apps.picking.urls')),
    path('', include('apps.transferencia.urls')),
    path('', include('apps.dashboard.urls')),
]
