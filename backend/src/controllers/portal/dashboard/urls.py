from django.urls import path
from src.controllers.portal.dashboard.views import dashboard_kpis

urlpatterns = [
    path('dashboard/kpis/', dashboard_kpis, name='dashboard_kpis'),
]
