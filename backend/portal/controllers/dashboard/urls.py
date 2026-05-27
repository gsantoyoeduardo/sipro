from django.urls import path

from portal.controllers.dashboard.views import dashboard_kpis

urlpatterns = [
    path('dashboard/kpis/', dashboard_kpis, name='portal-dashboard-kpis'),
]
