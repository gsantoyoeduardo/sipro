from django.urls import path

from tenant.controllers.dashboard.views import dashboard_kpis

urlpatterns = [
    path('dashboard/kpis/', dashboard_kpis, name='tenant-dashboard-kpis'),
]
