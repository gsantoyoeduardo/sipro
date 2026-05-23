from django.urls import path, include
from src.controllers.seguridad.portal_auth_urls import urlpatterns as portal_auth_urls
from src.controllers.seguridad.views import UsuarioViewSet
from src.controllers.seguridad.auth_views import change_password_view
from src.controllers.portal.empresa.urls import urlpatterns as empresa_urls
from src.controllers.seguridad.urls import urlpatterns as seguridad_urls
from src.controllers.portal.registro.urls import urlpatterns as registro_urls
from src.controllers.portal.dashboard.urls import urlpatterns as dashboard_urls

urlpatterns = [
    path('auth/', include(portal_auth_urls)),
    path('auth/me/', UsuarioViewSet.as_view({'get': 'me', 'put': 'me', 'patch': 'me'}), name='portal-auth-me'),
    path('auth/me/password/', change_password_view, name='portal-auth-change-password'),
    path('api/', include(empresa_urls)),
    path('api/', include(seguridad_urls)),
    path('api/registro/', include(registro_urls)),
    path('api/', include(dashboard_urls)),
]
