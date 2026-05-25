from django.contrib import admin
from django.shortcuts import redirect
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView


def root_redirect(request):
    return redirect('/tenant/swagger/')


urlpatterns = [
    path('', root_redirect),
    path('admin/', admin.site.urls),
    path('tenant/', include('tenant.urls')),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

try:
    from tenant.swagger import urlpatterns as tenant_swagger
    urlpatterns += [
        path('tenant/', include(tenant_swagger)),
    ]
except ImportError:
    pass
