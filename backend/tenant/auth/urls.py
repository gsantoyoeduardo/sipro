from django.urls import path
from tenant.auth.views import tenant_login_view, tenant_logout_view, tenant_refresh_view, change_password_view

urlpatterns = [
    path('', tenant_login_view, name='tenant-login'),
    path('refresh/', tenant_refresh_view, name='tenant-refresh'),
    path('logout/', tenant_logout_view, name='tenant-logout'),
    path('me/', change_password_view, name='tenant-auth-me'),
    path('me/password/', change_password_view, name='tenant-auth-change-password'),
]
