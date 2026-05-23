from django.urls import path
from src.controllers.seguridad.portal_auth_views import portal_login_view, portal_logout_view

urlpatterns = [
    path('', portal_login_view, name='portal-login'),
    path('logout/', portal_logout_view, name='portal-logout'),
]
