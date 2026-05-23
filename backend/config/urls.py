from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('portal/', include('src.controllers.portal.urls')),
    path('tenant/', include('src.controllers.tenant.urls')),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

try:
    from django.urls import re_path
    from rest_framework import permissions
    from drf_yasg.views import get_schema_view
    from drf_yasg import openapi

    schema_view = get_schema_view(
        openapi.Info(
            title='SIPRO WMS API',
            default_version='v1',
            description='Sistema Integral de Procesos y Recursos Operativos — WMS',
            contact=openapi.Contact(email='admin@sipro.com'),
        ),
        public=True,
        permission_classes=[permissions.AllowAny],
    )

    urlpatterns += [
        re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
        path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
        path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    ]
except ImportError:
    pass
