from django.urls import path
from .auth_views import login_view, logout_view, change_password_view
from .views import UsuarioViewSet

urlpatterns = [
    path('', login_view, name='auth_login'),
    path('logout/', logout_view, name='auth_logout'),
    path('me/', UsuarioViewSet.as_view({'get': 'me', 'put': 'me', 'patch': 'me'}), name='auth_me'),
    path('me/password/', change_password_view, name='auth_change_password'),
]
