from django.contrib import admin
from django.shortcuts import redirect
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView


def root_redirect(request):
    return redirect('/portal/swagger/')


urlpatterns = [
    path('', root_redirect),
    path('admin/', admin.site.urls),
    path('portal/', include('portal.urls')),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

try:
    from portal.swagger import urlpatterns as portal_swagger
    urlpatterns += [
        path('portal/', include(portal_swagger)),
    ]
except ImportError:
    pass
