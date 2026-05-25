from django.urls import path
from portal.auth.views import portal_login_view, portal_logout_view, change_password_view

urlpatterns = [
    path('', portal_login_view, name='portal-login'),
    path('logout/', portal_logout_view, name='portal-logout'),
    path('me/', change_password_view, name='portal-auth-me'),
    path('me/password/', change_password_view, name='portal-auth-change-password'),
]
