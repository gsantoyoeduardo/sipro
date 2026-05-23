from django.urls import path
from src.controllers.seguridad.tenant_auth_views import tenant_login_view, tenant_logout_view

urlpatterns = [
    path('', tenant_login_view, name='tenant-login'),
    path('logout/', tenant_logout_view, name='tenant-logout'),
]
