from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('schema/', SpectacularAPIView.as_view(urlconf='config.urls_portal'), name='portal-schema'),
    path('swagger/', SpectacularSwaggerView.as_view(url_name='portal-schema'), name='portal-schema-swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='portal-schema'), name='portal-schema-redoc'),
]
