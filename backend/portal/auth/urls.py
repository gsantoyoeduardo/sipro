from django.urls import path

from portal.auth.views import (
    change_password_view,
    portal_login_view,
    portal_logout_view,
)

urlpatterns = [
    path('', portal_login_view, name='portal-login'),
    path('iniciar-sesion/', portal_login_view, name='portal-login-alt'),
    path('cerrar-sesion/', portal_logout_view, name='portal-logout'),
    path('me/', change_password_view, name='portal-auth-me'),
]
