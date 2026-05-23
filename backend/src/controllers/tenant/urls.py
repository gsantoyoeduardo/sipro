from django.urls import path, include
from src.controllers.seguridad.tenant_auth_urls import urlpatterns as tenant_auth_urls
from src.controllers.seguridad.views import UsuarioViewSet
from src.controllers.seguridad.auth_views import change_password_view
from src.controllers.tenant.inventario.urls import urlpatterns as inventario_urls
from src.controllers.tenant.picking.urls import urlpatterns as picking_urls
from src.controllers.tenant.layout.urls import urlpatterns as layout_urls
from src.controllers.tenant.transferencia.urls import urlpatterns as transferencia_urls
from src.controllers.seguridad.urls import urlpatterns as seguridad_urls
from src.controllers.tenant.dashboard.urls import urlpatterns as dashboard_urls
from src.controllers.tenant.empresa.urls import urlpatterns as empresa_urls

urlpatterns = [
    path('auth/', include(tenant_auth_urls)),
    path('auth/me/', UsuarioViewSet.as_view({'get': 'me', 'put': 'me', 'patch': 'me'}), name='tenant-auth-me'),
    path('auth/me/password/', change_password_view, name='tenant-auth-change-password'),
    path('api/', include(inventario_urls)),
    path('api/', include(picking_urls)),
    path('api/', include(layout_urls)),
    path('api/', include(transferencia_urls)),
    path('api/', include(seguridad_urls)),
    path('api/', include(dashboard_urls)),
    path('api/', include(empresa_urls)),
]
