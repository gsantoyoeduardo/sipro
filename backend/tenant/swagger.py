from django.urls import path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('schema/', SpectacularAPIView.as_view(urlconf='config.urls_tenant'), name='tenant-schema'),
    path('swagger/', SpectacularSwaggerView.as_view(url_name='tenant-schema'), name='tenant-schema-swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='tenant-schema'), name='tenant-schema-redoc'),
]
